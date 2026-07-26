package telemetry

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
)

type SignalKind string

type RedactionClass string

const (
	SignalKindSpan   SignalKind = "span"
	SignalKindMetric SignalKind = "metric"
	SignalKindLog    SignalKind = "log"

	RedactionPublic      RedactionClass = "public"
	RedactionOperational RedactionClass = "operational"
	RedactionRestricted  RedactionClass = "restricted"
)

type Signal struct {
	Name                string
	Kind                SignalKind
	Unit                string
	Owner               string
	RedactionClass      RedactionClass
	AllowedAttributes   []string
	HistogramBoundaries []float64
}

type Contract struct {
	ResourceAttributes []string
	Signals            []Signal
}

var (
	safeSignalName    = regexp.MustCompile(`^[a-z][a-z0-9_.]+$`)
	unboundedID       = regexp.MustCompile(`(^|\.)(user|subject|entity|record|finding|audit)\.?id$`)
	forbiddenFragment = []string{
		"password",
		"token",
		"cookie",
		"evidence.bytes",
		"message.body",
		"internal_caa_note",
	}
)

func DefaultContract() Contract {
	return Contract{
		ResourceAttributes: []string{
			"service.name",
			"service.version",
			"deployment.environment.name",
			"service.instance.id",
		},
		Signals: []Signal{
			{
				Name:           "http.server.request",
				Kind:           SignalKindSpan,
				Unit:           "request",
				Owner:          "Backend",
				RedactionClass: RedactionOperational,
				AllowedAttributes: []string{
					"http.request.method",
					"http.route",
					"http.response.status_code",
					"operation.class",
					"module",
					"correlation.id",
				},
			},
			{
				Name:                "http.server.duration",
				Kind:                SignalKindMetric,
				Unit:                "ms",
				Owner:               "Backend",
				RedactionClass:      RedactionOperational,
				AllowedAttributes:   []string{"http.request.method", "http.route", "http.response.status_code", "operation.class", "module"},
				HistogramBoundaries: []float64{5, 10, 25, 50, 100, 250, 500, 1000, 2500},
			},
			{
				Name:           "db.client.operation",
				Kind:           SignalKindSpan,
				Unit:           "operation",
				Owner:          "Backend",
				RedactionClass: RedactionRestricted,
				AllowedAttributes: []string{
					"db.system.name",
					"db.operation.name",
					"module",
					"outcome.class",
					"correlation.id",
				},
			},
			{
				Name:                "db.client.operation.duration",
				Kind:                SignalKindMetric,
				Unit:                "ms",
				Owner:               "Backend",
				RedactionClass:      RedactionOperational,
				AllowedAttributes:   []string{"db.system.name", "db.operation.name", "module", "outcome.class"},
				HistogramBoundaries: []float64{1, 2.5, 5, 10, 25, 50, 100, 250, 500},
			},
			{
				Name:                "outbox.ready.age",
				Kind:                SignalKindMetric,
				Unit:                "s",
				Owner:               "Backend",
				RedactionClass:      RedactionOperational,
				AllowedAttributes:   []string{"job.kind", "queue", "outcome.class"},
				HistogramBoundaries: []float64{5, 15, 30, 60, 120, 300, 600},
			},
			{
				Name:           "worker.job.process",
				Kind:           SignalKindSpan,
				Unit:           "job",
				Owner:          "Backend",
				RedactionClass: RedactionRestricted,
				AllowedAttributes: []string{
					"job.kind",
					"adapter",
					"outcome.class",
					"correlation.id",
				},
			},
			{
				Name:           "worker.job.attempts",
				Kind:           SignalKindMetric,
				Unit:           "attempt",
				Owner:          "Backend",
				RedactionClass: RedactionOperational,
				AllowedAttributes: []string{
					"job.kind",
					"adapter",
					"outcome.class",
				},
			},
		},
	}
}

func (contract Contract) Signal(name string) (Signal, bool) {
	for _, signal := range contract.Signals {
		if signal.Name == name {
			return signal, true
		}
	}
	return Signal{}, false
}

func (contract Contract) Validate() error {
	if len(contract.ResourceAttributes) == 0 {
		return errors.New("telemetry resource attributes are required")
	}
	seen := make(map[string]struct{}, len(contract.Signals))
	for _, signal := range contract.Signals {
		if !safeSignalName.MatchString(signal.Name) {
			return fmt.Errorf("telemetry signal name %q is invalid", signal.Name)
		}
		if _, exists := seen[signal.Name]; exists {
			return fmt.Errorf("telemetry signal %q is duplicated", signal.Name)
		}
		seen[signal.Name] = struct{}{}
		if signal.Owner == "" {
			return fmt.Errorf("telemetry signal %q owner is required", signal.Name)
		}
		if signal.Unit == "" {
			return fmt.Errorf("telemetry signal %q unit is required", signal.Name)
		}
		switch signal.Kind {
		case SignalKindSpan, SignalKindMetric, SignalKindLog:
		default:
			return fmt.Errorf("telemetry signal %q kind is invalid", signal.Name)
		}
		switch signal.RedactionClass {
		case RedactionPublic, RedactionOperational, RedactionRestricted:
		default:
			return fmt.Errorf("telemetry signal %q redaction class is invalid", signal.Name)
		}
		if signal.Kind == SignalKindMetric &&
			strings.Contains(signal.Name, "duration") &&
			len(signal.HistogramBoundaries) == 0 {
			return fmt.Errorf("telemetry signal %q histogram boundaries are required", signal.Name)
		}
		for _, attribute := range signal.AllowedAttributes {
			if reason := invalidAttribute(attribute); reason != "" {
				return fmt.Errorf(
					"telemetry signal %q attribute %q is forbidden: %s",
					signal.Name,
					attribute,
					reason,
				)
			}
		}
	}
	return nil
}

func invalidAttribute(attribute string) string {
	normalized := strings.ToLower(strings.TrimSpace(attribute))
	for _, fragment := range forbiddenFragment {
		if strings.Contains(normalized, fragment) {
			return "sensitive data"
		}
	}
	if unboundedID.MatchString(normalized) {
		return "unbounded identity"
	}
	return ""
}
