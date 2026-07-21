package integration_test

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"sync"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/objectstore"
)

type memoryObject struct {
	body        []byte
	contentType string
	metadata    map[string]string
}

type memoryObjectStore struct {
	mu      sync.Mutex
	objects map[string]memoryObject
	copies  []objectstore.CopyRequest
}

func newMemoryObjectStore() *memoryObjectStore {
	return &memoryObjectStore{objects: map[string]memoryObject{}}
}

func objectLocation(bucket, key string) string { return bucket + "/" + key }

func (store *memoryObjectStore) CreatePutInstruction(_ context.Context, request objectstore.PutRequest) (objectstore.PutInstruction, error) {
	return objectstore.PutInstruction{
		URL:       "memory://" + objectLocation(request.Bucket, request.Key),
		Headers:   cloneStrings(request.RequiredHeaders),
		ExpiresAt: request.ExpiresAt,
	}, nil
}

func (store *memoryObjectStore) Open(_ context.Context, bucket, key string) (io.ReadCloser, objectstore.ObjectInfo, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	object, ok := store.objects[objectLocation(bucket, key)]
	if !ok {
		return nil, objectstore.ObjectInfo{}, objectstore.ErrObjectNotFound
	}
	copyBody := append([]byte(nil), object.body...)
	return io.NopCloser(bytes.NewReader(copyBody)), objectstore.ObjectInfo{
		Bucket: bucket, Key: key, Size: int64(len(copyBody)), ContentType: object.contentType,
		Metadata: cloneStrings(object.metadata),
	}, nil
}

func (store *memoryObjectStore) Copy(_ context.Context, request objectstore.CopyRequest) error {
	store.mu.Lock()
	defer store.mu.Unlock()
	source, ok := store.objects[objectLocation(request.SourceBucket, request.SourceKey)]
	if !ok {
		return objectstore.ErrObjectNotFound
	}
	destination := objectLocation(request.DestinationBucket, request.DestinationKey)
	if _, exists := store.objects[destination]; exists {
		return objectstore.ErrObjectAlreadyExists
	}
	store.objects[destination] = memoryObject{
		body: append([]byte(nil), source.body...), contentType: source.contentType,
		metadata: cloneStrings(source.metadata),
	}
	store.copies = append(store.copies, request)
	return nil
}

func (store *memoryObjectStore) CreateGetInstruction(_ context.Context, request objectstore.GetRequest) (objectstore.GetInstruction, error) {
	store.mu.Lock()
	defer store.mu.Unlock()
	if _, ok := store.objects[objectLocation(request.Bucket, request.Key)]; !ok {
		return objectstore.GetInstruction{}, objectstore.ErrObjectNotFound
	}
	return objectstore.GetInstruction{
		URL: "memory://download/" + objectLocation(request.Bucket, request.Key), ExpiresAt: request.ExpiresAt,
	}, nil
}

func (store *memoryObjectStore) Check(context.Context) error { return nil }

func (store *memoryObjectStore) Put(bucket, key, contentType string, body []byte, metadata map[string]string) {
	store.mu.Lock()
	defer store.mu.Unlock()
	store.objects[objectLocation(bucket, key)] = memoryObject{
		body: append([]byte(nil), body...), contentType: contentType, metadata: cloneStrings(metadata),
	}
}

func (store *memoryObjectStore) Has(bucket, key string) bool {
	store.mu.Lock()
	defer store.mu.Unlock()
	_, ok := store.objects[objectLocation(bucket, key)]
	return ok
}

func cloneStrings(values map[string]string) map[string]string {
	cloned := make(map[string]string, len(values))
	for key, value := range values {
		cloned[key] = value
	}
	return cloned
}

func sha256Digest(body []byte) string {
	digest := sha256.Sum256(body)
	return "sha256:" + hex.EncodeToString(digest[:])
}

func validPDF(label string) []byte {
	return []byte(fmt.Sprintf("%%PDF-1.7\n1 0 obj\n<</Type/Catalog/Label(%s)>>\nendobj\n%%%%EOF\n", label))
}

func deterministicIDs() func(string) string {
	var mu sync.Mutex
	counters := map[string]int{}
	return func(prefix string) string {
		mu.Lock()
		defer mu.Unlock()
		counters[prefix]++
		return fmt.Sprintf("%s-test-%03d", prefix, counters[prefix])
	}
}

func uploadClock() time.Time { return canonicalNow }
