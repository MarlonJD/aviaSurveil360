package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/application"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/evidence"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/httpapi"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/inspections/attachments"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/planning"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/config"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/objectstore"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/session"
	fieldsync "github.com/MarlonJD/aviaSurveil360/apps/api/internal/sync"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/testprofile"
	"github.com/MarlonJD/aviaSurveil360/apps/api/migrations"
)

type unavailableReadiness struct {
	err error
}

type objectStoreReadiness struct {
	store objectstore.Store
}

func (readiness objectStoreReadiness) Ready(ctx context.Context) error {
	return readiness.store.Check(ctx)
}

type combinedReadiness []httpapi.ReadinessProbe

func (readiness combinedReadiness) Ready(ctx context.Context) error {
	for _, probe := range readiness {
		if err := probe.Ready(ctx); err != nil {
			return err
		}
	}
	return nil
}

func (readiness unavailableReadiness) Ready(context.Context) error {
	return readiness.err
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx); err != nil {
		slog.Error("API stopped", "error", err)
		os.Exit(1)
	}
}

func run(ctx context.Context) error {
	settings, err := config.Load(os.LookupEnv)
	if err != nil {
		return fmt.Errorf("load configuration: %w", err)
	}

	var probe httpapi.ReadinessProbe = unavailableReadiness{err: errors.New("PostgreSQL initialization has not completed")}
	var authentication http.Handler
	var authenticatedAPI http.Handler
	var testAdministration http.Handler
	pool, databaseErr := database.Open(ctx, settings.DatabaseURL)
	if databaseErr == nil {
		if migrationErr := migrations.Apply(ctx, pool); migrationErr == nil {
			if bootstrapErr := session.BootstrapTestProfile(ctx, pool, settings, time.Now()); bootstrapErr == nil {
				databaseProbe := database.Readiness{Pool: pool, RequiredMigrationVersion: migrations.LatestVersion}
				probe = databaseProbe
				var authBoundary *httpapi.AuthBoundary
				if settings.OIDCIssuerURL != "" {
					sessionManager, managerErr := session.NewManager(pool, settings.SessionEncryptionKey, session.ManagerDependencies{})
					if managerErr != nil {
						probe = unavailableReadiness{err: managerErr}
						slog.Error("session manager unavailable; readiness will fail closed", "error", managerErr)
					} else {
						provider, providerErr := identity.NewRemoteOIDCProvider(ctx, identity.RemoteOIDCConfig{
							IssuerURL: settings.OIDCIssuerURL, ClientID: settings.OIDCClientID,
							ClientSecret: settings.OIDCClientSecret, RedirectURL: settings.OIDCRedirectURL,
						})
						if providerErr != nil {
							probe = unavailableReadiness{err: providerErr}
							slog.Error("OIDC provider unavailable; readiness will fail closed", "error", providerErr)
						} else {
							authBoundary = httpapi.NewAuthBoundary(provider, sessionManager)
							authentication = authBoundary.Handler()
						}
					}
				}
				if settings.ObjectStoreEndpoint != "" {
					objects, objectErr := objectstore.NewMinIOStore(objectstore.MinIOConfig{
						Endpoint: settings.ObjectStoreEndpoint, AccessKey: settings.ObjectStoreAccessKey,
						SecretKey: settings.ObjectStoreSecretKey, UseTLS: settings.ObjectStoreTLS,
						Region: settings.ObjectStoreRegion, AllowServerManagedCORS: settings.AllowServerManagedCORS,
					})
					if objectErr == nil {
						objectErr = objects.EnsurePrivateBuckets(ctx, []string{settings.QuarantineBucket, settings.CanonicalBucket}, settings.ObjectStoreCORSOrigins)
					}
					if objectErr != nil {
						probe = unavailableReadiness{err: objectErr}
						slog.Error("object store unavailable; readiness will fail closed", "error", objectErr)
					} else {
						probe = combinedReadiness{databaseProbe, objectStoreReadiness{store: objects}}
						generator := testprofile.NewGenerator()
						appDependencies := application.Dependencies{}
						if settings.CanonicalSeed {
							appDependencies.IDGenerator = generator.Next
							appDependencies.FindingReferenceGenerator = generator.FindingReference
							if resetErr := testprofile.Reset(ctx, pool, time.Now()); resetErr != nil {
								probe = unavailableReadiness{err: resetErr}
								slog.Error("canonical test seed failed; readiness will fail closed", "error", resetErr)
							}
						}
						applicationService := application.NewService(pool, appDependencies)
						grantService := fieldsync.NewGrantService(pool, fieldsync.GrantDependencies{IDGenerator: generator.Next})
						syncOperations := fieldsync.NewOperationService(pool, fieldsync.OperationDependencies{IDGenerator: generator.Next})
						evidenceUploads := evidence.NewUploadService(pool, objects, evidence.UploadServiceConfig{
							QuarantineBucket: settings.QuarantineBucket, CanonicalBucket: settings.CanonicalBucket,
							MaximumByteSize: 25 * 1024 * 1024, InstructionTTL: 10 * time.Minute, IDGenerator: generator.Next,
						})
						attachmentUploads := attachments.NewUploadService(pool, objects, attachments.UploadServiceConfig{
							QuarantineBucket: settings.QuarantineBucket, MaximumByteSize: 25 * 1024 * 1024,
							InstructionTTL: 10 * time.Minute, IDGenerator: generator.Next,
						})
						planningService := planning.NewService(pool, planning.Dependencies{IDGenerator: generator.Next})
						apiHandler := httpapi.NewCanonicalAPI(httpapi.CanonicalAPIDependencies{
							Pool: pool, Application: applicationService, GrantService: grantService,
							SyncOperations:  syncOperations,
							EvidenceUploads: evidenceUploads, AttachmentUploads: attachmentUploads,
							Planning: planningService,
						}).Handler()
						if settings.CanonicalTestProfile {
							boundary := httpapi.NewCanonicalTestBoundary(settings.CanonicalTestToken)
							authenticatedAPI = boundary.Protect(apiHandler)
							admin := httpapi.NewCanonicalTestAdmin(pool, objects,
								[]string{settings.QuarantineBucket, settings.CanonicalBucket}, generator, time.Now)
							testAdministration = boundary.Admin(admin)
						} else if authBoundary != nil {
							authenticatedAPI = authBoundary.Protect(apiHandler)
						}
					}
				}
			} else {
				probe = unavailableReadiness{err: bootstrapErr}
				slog.Error("test profile bootstrap failed; readiness will fail closed", "error", bootstrapErr)
			}
		} else {
			probe = unavailableReadiness{err: migrationErr}
			slog.Error("database migrations unavailable; readiness will fail closed", "error", migrationErr)
		}
	} else {
		probe = unavailableReadiness{err: databaseErr}
		slog.Error("database unavailable; readiness will fail closed", "error", databaseErr)
	}
	if pool != nil {
		defer pool.Close()
	}

	server := &http.Server{
		Addr:              settings.HTTPAddress,
		Handler:           httpapi.NewApplicationHandler(probe, authentication, authenticatedAPI, testAdministration),
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	serverErrors := make(chan error, 1)
	go func() {
		slog.Info("API listening", "address", settings.HTTPAddress, "environment", settings.Environment)
		serverErrors <- server.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownContext, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return server.Shutdown(shutdownContext)
	case err := <-serverErrors:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return fmt.Errorf("serve HTTP: %w", err)
	}
}
