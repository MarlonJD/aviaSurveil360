package main

import (
	"testing"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/config"
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
