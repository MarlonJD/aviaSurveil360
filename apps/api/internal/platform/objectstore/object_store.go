package objectstore

import (
	"context"
	"errors"
	"io"
	"time"
)

var (
	ErrObjectNotFound      = errors.New("object not found")
	ErrObjectAlreadyExists = errors.New("object already exists")
)

type PutRequest struct {
	Bucket          string
	Key             string
	RequiredHeaders map[string]string
	ExpiresAt       time.Time
}

type PutInstruction struct {
	URL       string            `json:"url"`
	Headers   map[string]string `json:"headers"`
	ExpiresAt time.Time         `json:"expiresAt"`
}

type ObjectInfo struct {
	Bucket      string
	Key         string
	Size        int64
	ContentType string
	Metadata    map[string]string
}

type CopyRequest struct {
	SourceBucket      string
	SourceKey         string
	DestinationBucket string
	DestinationKey    string
}

type GetRequest struct {
	Bucket    string
	Key       string
	ExpiresAt time.Time
}

type GetInstruction struct {
	URL       string    `json:"url"`
	ExpiresAt time.Time `json:"expiresAt"`
}

// Store is backend-neutral. Implementations must keep buckets private and
// issue short-lived instructions instead of exposing durable public URLs.
type Store interface {
	CreatePutInstruction(context.Context, PutRequest) (PutInstruction, error)
	Open(context.Context, string, string) (io.ReadCloser, ObjectInfo, error)
	Copy(context.Context, CopyRequest) error
	CreateGetInstruction(context.Context, GetRequest) (GetInstruction, error)
	Check(context.Context) error
}

// TestResetter is intentionally separate from Store so production services
// cannot acquire destructive bucket-reset authority.
type TestResetter interface {
	ResetPrivateBuckets(context.Context, []string) error
}
