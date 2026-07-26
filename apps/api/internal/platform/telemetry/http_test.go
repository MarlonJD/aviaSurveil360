package telemetry

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"go.opentelemetry.io/otel/sdk/trace/tracetest"
)

func TestHTTPMiddlewareRetainsTheFirstWrittenStatus(t *testing.T) {
	t.Parallel()

	exporter := tracetest.NewInMemoryExporter()
	runtime, err := NewRuntime(context.Background(), Config{
		ServiceName:    "api",
		ServiceVersion: "test",
		Environment:    "test",
		SpanExporter:   exporter,
	})
	if err != nil {
		t.Fatalf("NewRuntime() error = %v", err)
	}
	t.Cleanup(func() { _ = runtime.Shutdown(context.Background()) })

	handler := runtime.HTTPMiddleware(http.HandlerFunc(func(
		writer http.ResponseWriter,
		_ *http.Request,
	) {
		writer.WriteHeader(http.StatusCreated)
		writer.WriteHeader(http.StatusServiceUnavailable)
	}))
	response := httptest.NewRecorder()
	handler.ServeHTTP(
		response,
		httptest.NewRequest(http.MethodPost, "/v1/findings", nil),
	)
	if response.Code != http.StatusCreated {
		t.Fatalf("HTTP status = %d", response.Code)
	}
	if err := runtime.ForceFlush(context.Background()); err != nil {
		t.Fatalf("ForceFlush() error = %v", err)
	}
	spans := exporter.GetSpans()
	if len(spans) != 1 {
		t.Fatalf("exported spans = %d", len(spans))
	}
	for _, attribute := range spans[0].Attributes {
		if attribute.Key == "http.response.status_code" &&
			attribute.Value.AsInt64() != http.StatusCreated {
			t.Fatalf("telemetry status = %d", attribute.Value.AsInt64())
		}
	}
}
