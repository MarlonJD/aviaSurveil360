package health

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
)

type Status string

type DependencyStatus string

const (
	StatusReady    Status = "ready"
	StatusDegraded Status = "degraded"
	StatusNotReady Status = "not_ready"

	DependencyStatusReady       DependencyStatus = "ready"
	DependencyStatusUnavailable DependencyStatus = "unavailable"
)

type Probe interface {
	Ready(context.Context) error
}

type ProbeFunc func(context.Context) error

func (function ProbeFunc) Ready(ctx context.Context) error {
	return function(ctx)
}

type Dependency struct {
	Name     string
	Required bool
	Probe    Probe
	Timeout  time.Duration
}

type DependencyState struct {
	Name     string           `json:"name"`
	Required bool             `json:"required"`
	Status   DependencyStatus `json:"status"`
}

type Report struct {
	Status       Status            `json:"status"`
	Dependencies []DependencyState `json:"dependencies"`
}

type Dependencies struct {
	dependencies []Dependency
}

type HTTPProbe struct {
	url    string
	client *http.Client
}

type TCPProbe struct {
	address string
	timeout time.Duration
}

var safeDependencyName = regexp.MustCompile(`^[a-z][a-z0-9-]{0,31}$`)

func NewHTTPProbe(rawURL string, timeout time.Duration) (*HTTPProbe, error) {
	parsed, err := url.Parse(strings.TrimSpace(rawURL))
	if err != nil || parsed.Host == "" ||
		(parsed.Scheme != "http" && parsed.Scheme != "https") ||
		parsed.User != nil || parsed.RawQuery != "" || parsed.Fragment != "" {
		return nil, errors.New("health URL must be absolute HTTP(S) without credentials, query, or fragment")
	}
	if timeout <= 0 || timeout > 5*time.Second {
		return nil, errors.New("health HTTP timeout must be positive and no greater than five seconds")
	}
	return &HTTPProbe{
		url: parsed.String(),
		client: &http.Client{
			Timeout: timeout,
			CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
	}, nil
}

func (probe *HTTPProbe) Ready(ctx context.Context) error {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, probe.url, nil)
	if err != nil {
		return errors.New("create health request")
	}
	response, err := probe.client.Do(request)
	if err != nil {
		return errors.New("health endpoint unavailable")
	}
	defer response.Body.Close()
	if response.StatusCode < http.StatusOK ||
		response.StatusCode >= http.StatusMultipleChoices {
		return errors.New("health endpoint returned an unsuccessful status")
	}
	return nil
}

func NewTCPProbe(address string, timeout time.Duration) (*TCPProbe, error) {
	address = strings.TrimSpace(address)
	if _, _, err := net.SplitHostPort(address); err != nil {
		return nil, errors.New("health TCP address must contain host and port")
	}
	if timeout <= 0 || timeout > 5*time.Second {
		return nil, errors.New("health TCP timeout must be positive and no greater than five seconds")
	}
	return &TCPProbe{address: address, timeout: timeout}, nil
}

func (probe *TCPProbe) Ready(ctx context.Context) error {
	connection, err := (&net.Dialer{Timeout: probe.timeout}).DialContext(
		ctx,
		"tcp",
		probe.address,
	)
	if err != nil {
		return errors.New("health TCP endpoint unavailable")
	}
	return connection.Close()
}

func NewDependencies(entries ...Dependency) (*Dependencies, error) {
	if len(entries) == 0 {
		return nil, errors.New("at least one health dependency is required")
	}
	seen := make(map[string]struct{}, len(entries))
	validated := append([]Dependency(nil), entries...)
	for index := range validated {
		entry := &validated[index]
		if !safeDependencyName.MatchString(entry.Name) {
			return nil, errors.New("health dependency name is invalid")
		}
		if entry.Probe == nil {
			return nil, fmt.Errorf("health dependency %s requires a probe", entry.Name)
		}
		if _, exists := seen[entry.Name]; exists {
			return nil, fmt.Errorf("health dependency %s is duplicated", entry.Name)
		}
		seen[entry.Name] = struct{}{}
		if entry.Timeout <= 0 {
			entry.Timeout = time.Second
		}
		if entry.Timeout > 5*time.Second {
			return nil, fmt.Errorf("health dependency %s timeout exceeds five seconds", entry.Name)
		}
	}
	sort.Slice(validated, func(left, right int) bool {
		return validated[left].Name < validated[right].Name
	})
	return &Dependencies{dependencies: validated}, nil
}

func (dependencies *Dependencies) Readiness(ctx context.Context) Report {
	report := Report{
		Status:       StatusReady,
		Dependencies: make([]DependencyState, len(dependencies.dependencies)),
	}
	var probes sync.WaitGroup
	probes.Add(len(dependencies.dependencies))
	for index, dependency := range dependencies.dependencies {
		go func() {
			defer probes.Done()
			probeContext, cancel := context.WithTimeout(ctx, dependency.Timeout)
			defer cancel()
			status := DependencyStatusReady
			if err := dependency.Probe.Ready(probeContext); err != nil {
				status = DependencyStatusUnavailable
			}
			report.Dependencies[index] = DependencyState{
				Name: dependency.Name, Required: dependency.Required, Status: status,
			}
		}()
	}
	probes.Wait()
	for _, state := range report.Dependencies {
		if state.Status == DependencyStatusReady {
			continue
		}
		if state.Required {
			report.Status = StatusNotReady
		} else if report.Status == StatusReady {
			report.Status = StatusDegraded
		}
	}
	return report
}

func (dependencies *Dependencies) Ready(ctx context.Context) error {
	report := dependencies.Readiness(ctx)
	if report.Status == StatusNotReady {
		return errors.New("one or more required dependencies are unavailable")
	}
	return nil
}
