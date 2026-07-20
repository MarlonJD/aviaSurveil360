package config_test

import (
	"strings"
	"testing"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/config"
)

func TestProductionRejectsTestAndDevelopmentBypasses(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		key  string
	}{
		{name: "test identity", key: "AVIA_TEST_PRINCIPAL"},
		{name: "test session", key: "AVIA_TEST_SESSION"},
		{name: "development session secret", key: "AVIA_DEV_SESSION_SECRET"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			values := map[string]string{
				"AVIA_ENVIRONMENT":  "production",
				"AVIA_DATABASE_URL": "postgres://example.invalid/avia",
				test.key:            "enabled",
			}

			_, err := config.Load(mapLookup(values))
			if err == nil {
				t.Fatalf("Load() accepted production bypass %s", test.key)
			}
			if !strings.Contains(err.Error(), test.key) {
				t.Fatalf("Load() error %q does not identify %s", err, test.key)
			}
		})
	}
}

func TestExplicitTestProfileLoadsDeterministicPrincipal(t *testing.T) {
	t.Parallel()

	settings, err := config.Load(mapLookup(map[string]string{
		"AVIA_ENVIRONMENT":    "test",
		"AVIA_DATABASE_URL":   "postgres://127.0.0.1/avia",
		"AVIA_TEST_PRINCIPAL": "inspector-cabin-001",
		"AVIA_TEST_SESSION":   "session-cabin-001",
	}))
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if settings.TestPrincipal != "inspector-cabin-001" {
		t.Fatalf("TestPrincipal = %q", settings.TestPrincipal)
	}
	if settings.TestSession != "session-cabin-001" {
		t.Fatalf("TestSession = %q", settings.TestSession)
	}
}

func mapLookup(values map[string]string) config.LookupEnv {
	return func(key string) (string, bool) {
		value, ok := values[key]
		return value, ok
	}
}
