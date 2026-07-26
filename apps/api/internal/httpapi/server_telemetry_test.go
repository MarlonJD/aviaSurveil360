package httpapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestInstrumentedApplicationHandlerWrapsEveryApplicationRoute(t *testing.T) {
	t.Parallel()

	handler := NewInstrumentedApplicationHandler(
		readyProbe{},
		nil,
		http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
			writer.WriteHeader(http.StatusNoContent)
		}),
		nil,
		func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
				writer.Header().Set("X-Test-Telemetry", "wrapped")
				next.ServeHTTP(writer, request)
			})
		},
	)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/v1/example", nil))
	if response.Header().Get("X-Test-Telemetry") != "wrapped" {
		t.Fatal("application route bypassed telemetry middleware")
	}
}

type readyProbe struct{}

func (readyProbe) Ready(context.Context) error { return nil }
