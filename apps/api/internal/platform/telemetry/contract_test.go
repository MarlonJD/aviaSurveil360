package telemetry

import (
	"bytes"
	"context"
	"errors"
	"log/slog"
	"strings"
	"testing"

	"go.opentelemetry.io/otel/sdk/trace/tracetest"
)

func TestDefaultContractIsBoundedOwnedAndRedacted(t *testing.T) {
	t.Parallel()

	contract := DefaultContract()
	if err := contract.Validate(); err != nil {
		t.Fatalf("DefaultContract().Validate() error = %v", err)
	}
	for _, required := range []string{
		"http.server.request",
		"http.server.duration",
		"db.client.operation",
		"db.client.operation.duration",
		"outbox.ready.age",
		"worker.job.process",
		"worker.job.attempts",
	} {
		if _, ok := contract.Signal(required); !ok {
			t.Fatalf("required signal %q is missing", required)
		}
	}
}

func TestContractRejectsMissingOwnerUnitOrHistogramBoundaries(t *testing.T) {
	t.Parallel()

	cases := []struct {
		name   string
		mutate func(*Contract)
		want   string
	}{
		{
			name: "owner",
			mutate: func(contract *Contract) {
				contract.Signals[0].Owner = ""
			},
			want: "owner",
		},
		{
			name: "unit",
			mutate: func(contract *Contract) {
				contract.Signals[0].Unit = ""
			},
			want: "unit",
		},
		{
			name: "histogram boundaries",
			mutate: func(contract *Contract) {
				for index := range contract.Signals {
					if contract.Signals[index].Name == "http.server.duration" {
						contract.Signals[index].HistogramBoundaries = nil
						return
					}
				}
			},
			want: "histogram boundaries",
		},
	}
	for _, testCase := range cases {
		testCase := testCase
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()
			contract := DefaultContract()
			testCase.mutate(&contract)
			err := contract.Validate()
			if err == nil || !strings.Contains(err.Error(), testCase.want) {
				t.Fatalf("Validate() error = %v, want fragment %q", err, testCase.want)
			}
		})
	}
}

func TestContractRejectsSensitiveOrUnboundedAttributes(t *testing.T) {
	t.Parallel()

	for _, attribute := range []string{
		"session.cookie",
		"provider.token",
		"evidence.bytes",
		"message.body",
		"internal_caa_note.text",
		"finding.id",
		"user.id",
	} {
		contract := DefaultContract()
		contract.Signals[0].AllowedAttributes = append(
			contract.Signals[0].AllowedAttributes,
			attribute,
		)
		if err := contract.Validate(); err == nil {
			t.Fatalf("sensitive or unbounded attribute %q was accepted", attribute)
		}
	}
}

func TestJSONLoggerRedactsSensitiveAndRawErrorAttributes(t *testing.T) {
	t.Parallel()

	var output bytes.Buffer
	logger := NewJSONLogger(&output, "api")
	logger.Error(
		"dependency unavailable",
		"error",
		errors.New("password=secret Internal CAA Note"),
		"token",
		"provider-token",
		"safe",
		"bounded",
		slog.Group("nested", "cookie", "session-cookie"),
	)

	encoded := output.String()
	for _, forbidden := range []string{
		"password=secret",
		"Internal CAA Note",
		"provider-token",
		"session-cookie",
	} {
		if strings.Contains(encoded, forbidden) {
			t.Fatalf("structured log leaked %q: %s", forbidden, encoded)
		}
	}
	for _, required := range []string{
		`"error":"[REDACTED]"`,
		`"token":"[REDACTED]"`,
		`"cookie":"[REDACTED]"`,
		`"safe":"bounded"`,
	} {
		if !strings.Contains(encoded, required) {
			t.Fatalf("structured log missing %s: %s", required, encoded)
		}
	}
}

func TestRuntimeRejectsPublicOTLPEndpoint(t *testing.T) {
	t.Parallel()

	_, err := NewRuntime(context.Background(), Config{
		ServiceName:      "api",
		ServiceVersion:   "test",
		Environment:      "test",
		OTLPHTTPEndpoint: "http://telemetry.example.invalid:4318",
	})
	if err == nil || !strings.Contains(err.Error(), "private HTTP") {
		t.Fatalf("NewRuntime() public OTLP endpoint error = %v", err)
	}
}

func TestRuntimeEmitsEveryRequiredResourceAttribute(t *testing.T) {
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
	_, span := runtime.Tracer().Start(context.Background(), "resource.contract")
	span.End()
	if err := runtime.ForceFlush(context.Background()); err != nil {
		t.Fatalf("ForceFlush() error = %v", err)
	}
	spans := exporter.GetSpans()
	if len(spans) != 1 {
		t.Fatalf("exported spans = %d", len(spans))
	}
	attributes := map[string]bool{}
	for _, attribute := range spans[0].Resource.Attributes() {
		attributes[string(attribute.Key)] = attribute.Value.AsString() != ""
	}
	for _, required := range DefaultContract().ResourceAttributes {
		if !attributes[required] {
			t.Errorf("resource attribute %q is missing or empty", required)
		}
	}
}
