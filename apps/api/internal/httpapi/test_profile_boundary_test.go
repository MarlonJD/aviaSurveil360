package httpapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestNormalApplicationDoesNotRegisterTestProfileRoutes(t *testing.T) {
	t.Parallel()
	api := http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
		writer.WriteHeader(http.StatusNoContent)
	})
	handler := NewApplicationHandler(
		readinessStub(func(context.Context) error { return nil }),
		nil,
		api,
		nil,
	)
	request := httptest.NewRequest(http.MethodPost, "/__test/reset", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Code != http.StatusNotFound {
		t.Fatalf("normal application /__test/reset status = %d, want %d", response.Code, http.StatusNotFound)
	}
}
