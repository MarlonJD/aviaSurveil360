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

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/httpapi"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/config"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/session"
	"github.com/MarlonJD/aviaSurveil360/apps/api/migrations"
)

type unavailableReadiness struct {
	err error
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
	pool, databaseErr := database.Open(ctx, settings.DatabaseURL)
	if databaseErr == nil {
		if migrationErr := migrations.Apply(ctx, pool); migrationErr == nil {
			if bootstrapErr := session.BootstrapTestProfile(ctx, pool, settings, time.Now()); bootstrapErr == nil {
				probe = database.Readiness{Pool: pool, RequiredMigrationVersion: migrations.LatestVersion}
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
		Handler:           httpapi.NewHealthHandler(probe),
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
