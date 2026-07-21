package objectstore

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/cors"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinIOConfig struct {
	Endpoint               string
	AccessKey              string
	SecretKey              string
	UseTLS                 bool
	Region                 string
	AllowServerManagedCORS bool
}

type MinIOStore struct {
	client                 *minio.Client
	allowServerManagedCORS bool
}

func NewMinIOStore(config MinIOConfig) (*MinIOStore, error) {
	if strings.TrimSpace(config.Endpoint) == "" || config.AccessKey == "" || config.SecretKey == "" {
		return nil, errors.New("object-store endpoint and credentials are required")
	}
	client, err := minio.New(config.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(config.AccessKey, config.SecretKey, ""),
		Secure: config.UseTLS, Region: config.Region,
	})
	if err != nil {
		return nil, fmt.Errorf("create MinIO-compatible client: %w", err)
	}
	return &MinIOStore{client: client, allowServerManagedCORS: config.AllowServerManagedCORS}, nil
}

func (store *MinIOStore) EnsurePrivateBuckets(ctx context.Context, buckets []string, allowedOrigins []string) error {
	if len(allowedOrigins) == 0 {
		return errors.New("at least one explicit object-store CORS origin is required")
	}
	for _, bucket := range buckets {
		exists, err := store.client.BucketExists(ctx, bucket)
		if err != nil {
			return fmt.Errorf("check private bucket %s: %w", bucket, err)
		}
		if !exists {
			if err := store.client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
				return fmt.Errorf("create private bucket %s: %w", bucket, err)
			}
		}
		configuration := cors.NewConfig([]cors.Rule{{
			ID: "avia-private-browser", AllowedOrigin: append([]string(nil), allowedOrigins...),
			AllowedMethod: []string{http.MethodGet, http.MethodHead, http.MethodPut},
			AllowedHeader: []string{"Content-Type", "x-amz-meta-sha256"},
			ExposeHeader:  []string{"ETag"}, MaxAgeSeconds: 300,
		}})
		if err := store.client.SetBucketCors(ctx, bucket, configuration); err != nil {
			response := minio.ToErrorResponse(err)
			if !store.allowServerManagedCORS || response.Code != "NotImplemented" {
				return fmt.Errorf("configure private bucket CORS %s: %w", bucket, err)
			}
		}
	}
	return nil
}

func (store *MinIOStore) CreatePutInstruction(ctx context.Context, request PutRequest) (PutInstruction, error) {
	duration := time.Until(request.ExpiresAt)
	if duration < time.Second {
		return PutInstruction{}, errors.New("upload instruction expiry must be in the future")
	}
	headers := make(http.Header, len(request.RequiredHeaders))
	for key, value := range request.RequiredHeaders {
		headers.Set(key, value)
	}
	presigned, err := store.client.PresignHeader(ctx, http.MethodPut, request.Bucket, request.Key, duration, nil, headers)
	if err != nil {
		return PutInstruction{}, fmt.Errorf("presign private PUT: %w", err)
	}
	return PutInstruction{URL: presigned.String(), Headers: cloneHeaders(request.RequiredHeaders), ExpiresAt: request.ExpiresAt}, nil
}

func (store *MinIOStore) Open(ctx context.Context, bucket, key string) (io.ReadCloser, ObjectInfo, error) {
	stat, err := store.client.StatObject(ctx, bucket, key, minio.StatObjectOptions{})
	if err != nil {
		return nil, ObjectInfo{}, mapObjectError(err)
	}
	object, err := store.client.GetObject(ctx, bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, ObjectInfo{}, mapObjectError(err)
	}
	metadata := make(map[string]string, len(stat.UserMetadata))
	for key, value := range stat.UserMetadata {
		metadata[strings.ToLower(key)] = value
	}
	return object, ObjectInfo{
		Bucket: bucket, Key: key, Size: stat.Size, ContentType: stat.ContentType, Metadata: metadata,
	}, nil
}

func (store *MinIOStore) Copy(ctx context.Context, request CopyRequest) error {
	if _, err := store.client.StatObject(ctx, request.DestinationBucket, request.DestinationKey, minio.StatObjectOptions{}); err == nil {
		return ErrObjectAlreadyExists
	} else if !errors.Is(mapObjectError(err), ErrObjectNotFound) {
		return fmt.Errorf("check copy destination: %w", err)
	}
	_, err := store.client.CopyObject(ctx,
		minio.CopyDestOptions{Bucket: request.DestinationBucket, Object: request.DestinationKey},
		minio.CopySrcOptions{Bucket: request.SourceBucket, Object: request.SourceKey},
	)
	if err != nil {
		return mapObjectError(err)
	}
	return nil
}

func (store *MinIOStore) CreateGetInstruction(ctx context.Context, request GetRequest) (GetInstruction, error) {
	if _, err := store.client.StatObject(ctx, request.Bucket, request.Key, minio.StatObjectOptions{}); err != nil {
		return GetInstruction{}, mapObjectError(err)
	}
	duration := time.Until(request.ExpiresAt)
	if duration < time.Second {
		return GetInstruction{}, errors.New("download instruction expiry must be in the future")
	}
	presigned, err := store.client.PresignedGetObject(ctx, request.Bucket, request.Key, duration, url.Values{})
	if err != nil {
		return GetInstruction{}, fmt.Errorf("presign private GET: %w", err)
	}
	return GetInstruction{URL: presigned.String(), ExpiresAt: request.ExpiresAt}, nil
}

func (store *MinIOStore) Check(ctx context.Context) error {
	_, err := store.client.ListBuckets(ctx)
	if err != nil {
		return fmt.Errorf("check object-store connectivity: %w", err)
	}
	return nil
}

func (store *MinIOStore) ResetPrivateBuckets(ctx context.Context, buckets []string) error {
	for _, bucket := range buckets {
		objects := store.client.ListObjects(ctx, bucket, minio.ListObjectsOptions{Recursive: true})
		for object := range objects {
			if object.Err != nil {
				return fmt.Errorf("list test objects in %s: %w", bucket, object.Err)
			}
			if err := store.client.RemoveObject(ctx, bucket, object.Key, minio.RemoveObjectOptions{}); err != nil {
				return fmt.Errorf("remove test object %s/%s: %w", bucket, object.Key, err)
			}
		}
	}
	return nil
}

func mapObjectError(err error) error {
	if err == nil {
		return nil
	}
	response := minio.ToErrorResponse(err)
	switch response.Code {
	case "NoSuchKey", "NoSuchObject", "NoSuchBucket", "NotFound":
		return fmt.Errorf("%w: %v", ErrObjectNotFound, err)
	case "PreconditionFailed":
		return fmt.Errorf("%w: %v", ErrObjectAlreadyExists, err)
	default:
		return err
	}
}

func cloneHeaders(values map[string]string) map[string]string {
	cloned := make(map[string]string, len(values))
	for key, value := range values {
		cloned[key] = value
	}
	return cloned
}
