package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/config"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/objectstore"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/session"
	evidenceworker "github.com/MarlonJD/aviaSurveil360/apps/api/internal/worker/evidence"
	"github.com/MarlonJD/aviaSurveil360/apps/api/migrations"
)

type scanProcessor interface {
	ProcessNext(context.Context) (bool, error)
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx); err != nil {
		slog.Error("worker stopped", "error", err)
		os.Exit(1)
	}
}

func run(ctx context.Context) error {
	settings, err := config.Load(os.LookupEnv)
	if err != nil {
		return fmt.Errorf("load configuration: %w", err)
	}
	pool, err := database.Open(ctx, settings.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()
	if err := migrations.Apply(ctx, pool); err != nil {
		return err
	}
	if err := session.BootstrapTestProfile(ctx, pool, settings, time.Now()); err != nil {
		return err
	}
	if settings.ScannerMode != "deterministic-test" {
		return fmt.Errorf("an approved scanner adapter is not configured")
	}
	objects, err := objectstore.NewMinIOStore(objectstore.MinIOConfig{
		Endpoint: settings.ObjectStoreEndpoint, AccessKey: settings.ObjectStoreAccessKey,
		SecretKey: settings.ObjectStoreSecretKey, UseTLS: settings.ObjectStoreTLS,
		Region: settings.ObjectStoreRegion, AllowServerManagedCORS: settings.AllowServerManagedCORS,
	})
	if err != nil {
		return err
	}
	if err := objects.EnsurePrivateBuckets(ctx, []string{settings.QuarantineBucket, settings.CanonicalBucket}, settings.ObjectStoreCORSOrigins); err != nil {
		return err
	}
	worker := evidenceworker.New(pool, objects, evidenceworker.SignatureScanner{}, evidenceworker.Config{
		WorkerID: "evidence-worker", CanonicalBucket: settings.CanonicalBucket, LeaseDuration: time.Minute,
	})

	readiness := database.Readiness{Pool: pool, RequiredMigrationVersion: migrations.LatestVersion}
	ticker := time.NewTicker(settings.WorkerInterval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return nil
		case <-ticker.C:
			if err := readiness.Ready(ctx); err != nil {
				return fmt.Errorf("worker dependency check: %w", err)
			}
			if err := objects.Check(ctx); err != nil {
				return fmt.Errorf("worker object-store check: %w", err)
			}
			processed, err := processAvailable(ctx, worker)
			if err != nil {
				slog.Error("scan work batch failed", "processed", processed, "error", err)
				continue
			}
			if processed > 0 {
				slog.Info("scan work batch completed", "processed", processed)
			}
		}
	}
}

func processAvailable(ctx context.Context, processor scanProcessor) (int, error) {
	processedCount := 0
	for {
		processed, err := processor.ProcessNext(ctx)
		if err != nil {
			return processedCount, err
		}
		if !processed {
			return processedCount, nil
		}
		processedCount++
	}
}
