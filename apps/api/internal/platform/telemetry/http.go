package telemetry

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net"
	"net/http"
	"regexp"
	"strings"
	"time"

	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/trace"
)

type correlationIDContextKey struct{}

var safeCorrelationID = regexp.MustCompile(`^[A-Za-z0-9._-]{8,128}$`)

func (runtime *Runtime) HTTPMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		startedAt := time.Now()
		extracted := runtime.propagator.Extract(
			request.Context(),
			propagation.HeaderCarrier(request.Header),
		)
		correlationID := request.Header.Get("X-Correlation-ID")
		if !safeCorrelationID.MatchString(correlationID) {
			correlationID = newCorrelationID()
		}
		contextWithCorrelation := context.WithValue(
			extracted,
			correlationIDContextKey{},
			correlationID,
		)
		route := boundedRoute(request.URL.Path)
		ctx, span := runtime.tracer.Start(
			contextWithCorrelation,
			"http.server.request",
			trace.WithSpanKind(trace.SpanKindServer),
		)
		span.SetAttributes(
			attribute.String("http.request.method", request.Method),
			attribute.String("http.route", route),
			attribute.String("operation.class", operationClass(request.Method)),
			attribute.String("module", routeModule(route)),
			attribute.String("correlation.id", correlationID),
		)
		defer span.End()

		response := &statusResponseWriter{ResponseWriter: writer, status: http.StatusOK}
		response.Header().Set("X-Correlation-ID", correlationID)
		next.ServeHTTP(response, request.WithContext(ctx))
		span.SetAttributes(attribute.Int("http.response.status_code", response.status))
		if response.status >= http.StatusInternalServerError {
			span.SetStatus(codes.Error, "internal")
		}
		runtime.httpDuration.Record(
			ctx,
			float64(time.Since(startedAt).Microseconds())/1000,
			metric.WithAttributes(
				attribute.String("http.request.method", request.Method),
				attribute.String("http.route", route),
				attribute.Int("http.response.status_code", response.status),
				attribute.String("operation.class", operationClass(request.Method)),
				attribute.String("module", routeModule(route)),
			),
		)
	})
}

func CorrelationIDFromContext(ctx context.Context) string {
	correlationID, _ := ctx.Value(correlationIDContextKey{}).(string)
	return correlationID
}

func ContextWithCorrelationID(ctx context.Context, correlationID string) context.Context {
	if !safeCorrelationID.MatchString(correlationID) {
		return ctx
	}
	return context.WithValue(ctx, correlationIDContextKey{}, correlationID)
}

func ErrorClass(err error) string {
	switch {
	case err == nil:
		return "none"
	case errors.Is(err, context.DeadlineExceeded):
		return "deadline_exceeded"
	case errors.Is(err, context.Canceled):
		return "canceled"
	default:
		var networkError net.Error
		if errors.As(err, &networkError) {
			return "network"
		}
		return "internal"
	}
}

func newCorrelationID() string {
	var value [16]byte
	if _, err := rand.Read(value[:]); err != nil {
		return "correlation-unavailable"
	}
	return hex.EncodeToString(value[:])
}

func boundedRoute(path string) string {
	switch {
	case strings.HasPrefix(path, "/health/"):
		return "/health/*"
	case strings.HasPrefix(path, "/auth/"):
		return "/auth/*"
	case strings.HasPrefix(path, "/v1/"):
		return "/v1/*"
	case strings.HasPrefix(path, "/__test/"):
		return "/__test/*"
	default:
		return "unmatched"
	}
}

func routeModule(route string) string {
	switch route {
	case "/health/*":
		return "health"
	case "/auth/*":
		return "identity"
	case "/v1/*":
		return "application"
	case "/__test/*":
		return "test-profile"
	default:
		return "unmatched"
	}
}

func operationClass(method string) string {
	switch method {
	case http.MethodGet, http.MethodHead, http.MethodOptions:
		return "read"
	default:
		return "command"
	}
}

type statusResponseWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (writer *statusResponseWriter) WriteHeader(status int) {
	if writer.wroteHeader {
		return
	}
	writer.wroteHeader = true
	writer.status = status
	writer.ResponseWriter.WriteHeader(status)
}

func (writer *statusResponseWriter) Write(body []byte) (int, error) {
	writer.wroteHeader = true
	return writer.ResponseWriter.Write(body)
}

func (writer *statusResponseWriter) Unwrap() http.ResponseWriter {
	return writer.ResponseWriter
}
