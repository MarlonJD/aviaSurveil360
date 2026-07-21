// Command local-recovery-drill performs an exact-object backup/restore check
// against the isolated local candidate profile. It refuses every non-test
// environment and has no production deployment role.
package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type result struct {
	Status         string `json:"status"`
	ArtifactStatus string `json:"artifactStatus"`
	Bucket         string `json:"bucket"`
	Key            string `json:"key"`
	SHA256         string `json:"sha256"`
	Size           int    `json:"size"`
}

func main() {
	if err := run(); err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "local object-store recovery drill: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	if os.Getenv("AVIA_ENVIRONMENT") != "test" || os.Getenv("AVIA_ENABLE_LOCAL_RECOVERY_DRILL") != "true" {
		return errors.New("AVIA_ENVIRONMENT=test and AVIA_ENABLE_LOCAL_RECOVERY_DRILL=true are required")
	}
	backupDirectory := filepath.Clean(os.Getenv("AVIA_RECOVERY_DRILL_DIRECTORY"))
	if !strings.HasPrefix(backupDirectory, "/private/tmp/aviasurveil360-task13-recovery.") {
		return errors.New("AVIA_RECOVERY_DRILL_DIRECTORY must be a dedicated Task 13 temporary directory")
	}
	endpoint := strings.TrimSpace(os.Getenv("AVIA_OBJECT_STORE_ENDPOINT"))
	accessKey := os.Getenv("AVIA_OBJECT_STORE_ACCESS_KEY")
	secretKey := os.Getenv("AVIA_OBJECT_STORE_SECRET_KEY")
	bucket := strings.TrimSpace(os.Getenv("AVIA_OBJECT_STORE_QUARANTINE_BUCKET"))
	if endpoint == "" || accessKey == "" || secretKey == "" || bucket == "" {
		return errors.New("complete local object-store configuration is required")
	}
	client, err := minio.New(endpoint, &minio.Options{
		Creds: credentials.NewStaticV4(accessKey, secretKey, ""),
	})
	if err != nil {
		return fmt.Errorf("create object-store client: %w", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil || !exists {
		return fmt.Errorf("candidate bucket is unavailable: exists=%t: %w", exists, err)
	}

	key := "local-recovery-drill/exact-sentinel.txt"
	payload := []byte("AviaSurveil360 local recovery drill 2026-07-21\n")
	digest := sha256.Sum256(payload)
	hexDigest := hex.EncodeToString(digest[:])
	metadata := map[string]string{"sha256": hexDigest, "evidence-status": "candidate-only"}
	_ = client.RemoveObject(ctx, bucket, key, minio.RemoveObjectOptions{})
	defer func() { _ = client.RemoveObject(context.Background(), bucket, key, minio.RemoveObjectOptions{}) }()

	if _, err := client.PutObject(ctx, bucket, key, bytes.NewReader(payload), int64(len(payload)), minio.PutObjectOptions{
		ContentType: "text/plain", UserMetadata: metadata,
	}); err != nil {
		return fmt.Errorf("write source sentinel: %w", err)
	}
	backupBytes, sourceInfo, err := readObject(ctx, client, bucket, key)
	if err != nil {
		return fmt.Errorf("read backup source: %w", err)
	}
	backupPath := filepath.Join(backupDirectory, "object-backup.bin")
	if err := os.WriteFile(backupPath, backupBytes, 0o600); err != nil {
		return fmt.Errorf("write temporary object backup: %w", err)
	}
	if err := client.RemoveObject(ctx, bucket, key, minio.RemoveObjectOptions{}); err != nil {
		return fmt.Errorf("remove source before restore: %w", err)
	}
	if _, err := client.StatObject(ctx, bucket, key, minio.StatObjectOptions{}); err == nil {
		return errors.New("source object remained after exact-key removal")
	}
	restoredBytes, err := os.ReadFile(backupPath)
	if err != nil {
		return fmt.Errorf("read temporary object backup: %w", err)
	}
	if _, err := client.PutObject(ctx, bucket, key, bytes.NewReader(restoredBytes), int64(len(restoredBytes)), minio.PutObjectOptions{
		ContentType: sourceInfo.ContentType, UserMetadata: sourceInfo.UserMetadata,
	}); err != nil {
		return fmt.Errorf("restore exact object: %w", err)
	}
	verifiedBytes, restoredInfo, err := readObject(ctx, client, bucket, key)
	if err != nil {
		return fmt.Errorf("read restored object: %w", err)
	}
	restoredDigest := sha256.Sum256(verifiedBytes)
	if !bytes.Equal(verifiedBytes, payload) || restoredInfo.Size != int64(len(payload)) || hex.EncodeToString(restoredDigest[:]) != hexDigest {
		return errors.New("restored object bytes, size, or SHA-256 differ from the backup")
	}
	if restoredInfo.UserMetadata["Sha256"] != hexDigest && restoredInfo.UserMetadata["sha256"] != hexDigest {
		return errors.New("restored object metadata lost the SHA-256 value")
	}

	return json.NewEncoder(os.Stdout).Encode(result{
		Status: "verified locally", ArtifactStatus: "candidate-only",
		Bucket: bucket, Key: key, SHA256: hexDigest, Size: len(payload),
	})
}

func readObject(ctx context.Context, client *minio.Client, bucket, key string) ([]byte, minio.ObjectInfo, error) {
	info, err := client.StatObject(ctx, bucket, key, minio.StatObjectOptions{})
	if err != nil {
		return nil, minio.ObjectInfo{}, err
	}
	object, err := client.GetObject(ctx, bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, minio.ObjectInfo{}, err
	}
	defer object.Close()
	body, err := io.ReadAll(object)
	return body, info, err
}
