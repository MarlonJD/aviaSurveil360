package httpapi_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/httpapi"
)

type readinessFunc func(context.Context) error

func (function readinessFunc) Ready(ctx context.Context) error {
	return function(ctx)
}

func TestLivenessDoesNotDependOnPostgreSQL(t *testing.T) {
	t.Parallel()

	handler := httpapi.NewHealthHandler(readinessFunc(func(context.Context) error {
		return errors.New("database unavailable")
	}))
	request := httptest.NewRequest(http.MethodGet, "/health/live", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
	assertJSONStatus(t, response, "ok")
}

func TestReadinessFailsClosedWhenPostgreSQLIsUnavailable(t *testing.T) {
	t.Parallel()

	handler := httpapi.NewHealthHandler(readinessFunc(func(context.Context) error {
		return errors.New("database unavailable")
	}))
	request := httptest.NewRequest(http.MethodGet, "/health/ready", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusServiceUnavailable)
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "application/problem+json" {
		t.Fatalf("Content-Type = %q", contentType)
	}
}

func TestReadinessSucceedsWhenRequiredDependenciesAreReady(t *testing.T) {
	t.Parallel()

	handler := httpapi.NewHealthHandler(readinessFunc(func(context.Context) error { return nil }))
	request := httptest.NewRequest(http.MethodGet, "/health/ready", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}
	assertJSONStatus(t, response, "ok")
}

func assertJSONStatus(t *testing.T, response *httptest.ResponseRecorder, expected string) {
	t.Helper()
	if contentType := response.Header().Get("Content-Type"); contentType != "application/json" {
		t.Fatalf("Content-Type = %q", contentType)
	}
	var body struct {
		Status string `json:"status"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body.Status != expected {
		t.Fatalf("status body = %q, want %q", body.Status, expected)
	}
}
