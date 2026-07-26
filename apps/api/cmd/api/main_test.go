package main

import (
	"context"
	"testing"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/config"
	platformhealth "github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/health"
)

func TestUploadServiceConfigsUseInjectedScenarioClock(t *testing.T) {
	scenarioTime := time.Date(2026, time.June, 15, 9, 0, 0, 0, time.UTC)
	clock := func() time.Time { return scenarioTime }
	idGenerator := func(prefix string) string { return prefix + "-canonical" }
	settings := config.Settings{
		QuarantineBucket: "quarantine",
		CanonicalBucket:  "canonical",
	}

	evidenceConfig, attachmentConfig := uploadServiceConfigs(settings, clock, idGenerator)
	planningDependencies := planningServiceDependencies(clock, idGenerator)
	communicationsDependencies := communicationsWorkflowDependencies(clock, idGenerator)

	if got := evidenceConfig.Clock(); !got.Equal(scenarioTime) {
		t.Fatalf("Evidence upload clock = %s, want %s", got, scenarioTime)
	}
	if got := attachmentConfig.Clock(); !got.Equal(scenarioTime) {
		t.Fatalf("Inspection Attachment upload clock = %s, want %s", got, scenarioTime)
	}
	if got := evidenceConfig.IDGenerator("evidence"); got != "evidence-canonical" {
		t.Fatalf("Evidence upload ID generator = %q", got)
	}
	if got := attachmentConfig.IDGenerator("attachment"); got != "attachment-canonical" {
		t.Fatalf("Inspection Attachment upload ID generator = %q", got)
	}
	if got := planningDependencies.Clock(); !got.Equal(scenarioTime) {
		t.Fatalf("Planning service clock = %s, want %s", got, scenarioTime)
	}
	if got := planningDependencies.IDGenerator("planning"); got != "planning-canonical" {
		t.Fatalf("Planning service ID generator = %q", got)
	}
	if got := communicationsDependencies.Clock(); !got.Equal(scenarioTime) {
		t.Fatalf("Communications workflow clock = %s, want %s", got, scenarioTime)
	}
	if got := communicationsDependencies.IDGenerator("notification"); got != "notification-canonical" {
		t.Fatalf("Communications workflow ID generator = %q", got)
	}
}

func TestScannerReadinessIsRequiredOnlyForRealClamAVMode(t *testing.T) {
	t.Parallel()

	probe, err := newScannerReadiness(config.Settings{
		ScannerMode:               "clamav",
		ClamAVAddress:             "clamav:3310",
		ClamAVMaximumSignatureAge: 48 * time.Hour,
	})
	if err != nil || probe == nil {
		t.Fatalf("ClamAV readiness = %T, err = %v", probe, err)
	}
	testProbe, err := newScannerReadiness(config.Settings{
		Environment: "test",
		ScannerMode: "deterministic-test",
	})
	if err != nil || testProbe != nil {
		t.Fatalf("deterministic readiness = %T, err = %v", testProbe, err)
	}
}

func TestRuntimeReadinessKeepsConfiguredUnavailableDependenciesNamed(t *testing.T) {
	t.Parallel()

	ready := platformhealth.ProbeFunc(func(context.Context) error { return nil })
	probe, err := newRuntimeReadiness(
		config.Settings{
			ObjectStoreEndpoint:  "minio:9000",
			ScannerMode:          "clamav",
			RuntimeHealthTimeout: time.Second,
		},
		ready,
		ready,
		nil,
		nil,
	)
	if err != nil {
		t.Fatalf("newRuntimeReadiness returned %v", err)
	}
	dependencies, ok := probe.(*platformhealth.Dependencies)
	if !ok {
		t.Fatalf("runtime readiness = %T, want named dependencies", probe)
	}
	report := dependencies.Readiness(context.Background())
	if report.Status != platformhealth.StatusNotReady {
		t.Fatalf("readiness status = %q, want not_ready", report.Status)
	}
	statuses := make(map[string]platformhealth.DependencyStatus)
	for _, dependency := range report.Dependencies {
		statuses[dependency.Name] = dependency.Status
	}
	for _, name := range []string{"minio", "clamav"} {
		if statuses[name] != platformhealth.DependencyStatusUnavailable {
			t.Fatalf("%s status = %q, want unavailable", name, statuses[name])
		}
	}
}
