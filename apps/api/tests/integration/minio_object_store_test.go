package integration_test

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/objectstore"
)

func TestMinIOObjectStoreKeepsObjectsPrivateAndHonorsSignedBoundaries(t *testing.T) {
	endpoint := os.Getenv("AVIA_TEST_OBJECT_STORE_ENDPOINT")
	if endpoint == "" {
		endpoint = "127.0.0.1:59001"
	}
	store, err := objectstore.NewMinIOStore(objectstore.MinIOConfig{
		Endpoint: endpoint, AccessKey: "avia-local-access", SecretKey: "avia-local-secret-key",
		AllowServerManagedCORS: true,
	})
	if err != nil {
		t.Fatalf("create MinIO-compatible store: %v", err)
	}
	ctx := context.Background()
	if err := store.EnsurePrivateBuckets(ctx, []string{"avia-quarantine", "avia-canonical"}, []string{"http://127.0.0.1:4174"}); err != nil {
		t.Fatalf("initialize private object store: %v", err)
	}
	if err := store.Check(ctx); err != nil {
		t.Fatalf("object-store readiness: %v", err)
	}
	body := validPDF("minio-adapter")
	digest := sha256Digest(body)
	key := fmt.Sprintf("adapter-tests/%s-%d", strings.ReplaceAll(t.Name(), "/", "-"), time.Now().UnixNano())
	instruction, err := store.CreatePutInstruction(ctx, objectstore.PutRequest{
		Bucket: "avia-quarantine", Key: key, ExpiresAt: time.Now().Add(time.Minute),
		RequiredHeaders: map[string]string{"Content-Type": "application/pdf", "x-amz-meta-sha256": digest},
	})
	if err != nil {
		t.Fatalf("create signed PUT: %v", err)
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodPut, instruction.URL, bytes.NewReader(body))
	if err != nil {
		t.Fatalf("create PUT request: %v", err)
	}
	for key, value := range instruction.Headers {
		request.Header.Set(key, value)
	}
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatalf("upload through signed instruction: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		contents, _ := io.ReadAll(response.Body)
		t.Fatalf("signed PUT status = %d: %s", response.StatusCode, contents)
	}

	reader, info, err := store.Open(ctx, "avia-quarantine", key)
	if err != nil {
		t.Fatalf("open uploaded object: %v", err)
	}
	observed, readErr := io.ReadAll(reader)
	closeErr := reader.Close()
	if readErr != nil || closeErr != nil || !bytes.Equal(observed, body) || info.Size != int64(len(body)) {
		t.Fatalf("observed object = %+v, read = %v, close = %v", info, readErr, closeErr)
	}
	destination := key + "-canonical"
	if err := store.Copy(ctx, objectstore.CopyRequest{
		SourceBucket: "avia-quarantine", SourceKey: key, DestinationBucket: "avia-canonical", DestinationKey: destination,
	}); err != nil {
		t.Fatalf("copy clean object: %v", err)
	}
	if err := store.Copy(ctx, objectstore.CopyRequest{
		SourceBucket: "avia-quarantine", SourceKey: key, DestinationBucket: "avia-canonical", DestinationKey: destination,
	}); err != objectstore.ErrObjectAlreadyExists {
		t.Fatalf("non-overwriting copy error = %v", err)
	}
	download, err := store.CreateGetInstruction(ctx, objectstore.GetRequest{
		Bucket: "avia-canonical", Key: destination, ExpiresAt: time.Now().Add(time.Minute),
	})
	if err != nil {
		t.Fatalf("create signed GET: %v", err)
	}
	getResponse, err := http.Get(download.URL)
	if err != nil {
		t.Fatalf("download through signed instruction: %v", err)
	}
	defer getResponse.Body.Close()
	if getResponse.StatusCode != http.StatusOK {
		t.Fatalf("signed GET status = %d", getResponse.StatusCode)
	}
	parsed, _ := url.Parse(download.URL)
	parsed.RawQuery = ""
	publicResponse, err := http.Get(parsed.String())
	if err != nil {
		t.Fatalf("try unsigned object access: %v", err)
	}
	defer publicResponse.Body.Close()
	if publicResponse.StatusCode != http.StatusForbidden {
		t.Fatalf("unsigned object access status = %d, want 403", publicResponse.StatusCode)
	}
}
