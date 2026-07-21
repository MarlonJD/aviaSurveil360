package config_test

import (
	"encoding/base64"
	"strings"
	"testing"
	"time"

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
		{name: "canonical test profile", key: "AVIA_ENABLE_CANONICAL_TEST_PROFILE"},
		{name: "canonical test token", key: "AVIA_CANONICAL_TEST_TOKEN"},
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

func TestCanonicalHTTPProfileRequiresExplicitTestOnlyObjectStoreConfiguration(t *testing.T) {
	t.Parallel()
	values := map[string]string{
		"AVIA_ENVIRONMENT":                   "test",
		"AVIA_DATABASE_URL":                  "postgres://127.0.0.1/avia",
		"AVIA_ENABLE_CANONICAL_TEST_PROFILE": "true",
		"AVIA_CANONICAL_TEST_TOKEN":          "candidate-test-token-1234",
		"AVIA_OBJECT_STORE_ENDPOINT":         "127.0.0.1:59001",
		"AVIA_OBJECT_STORE_ACCESS_KEY":       "local-access",
		"AVIA_OBJECT_STORE_SECRET_KEY":       "local-secret",
		"AVIA_OBJECT_STORE_CORS_ORIGINS":     "http://127.0.0.1:4173",
		"AVIA_SCANNER_MODE":                  "deterministic-test",
	}
	settings, err := config.Load(mapLookup(values))
	if err != nil {
		t.Fatalf("Load() canonical HTTP profile: %v", err)
	}
	if !settings.CanonicalTestProfile || settings.CanonicalTestToken != values["AVIA_CANONICAL_TEST_TOKEN"] {
		t.Fatalf("canonical profile = %+v", settings)
	}
	if settings.ObjectStoreEndpoint != "127.0.0.1:59001" || len(settings.ObjectStoreCORSOrigins) != 1 || !settings.AllowServerManagedCORS {
		t.Fatalf("object-store profile = %+v", settings)
	}

	for _, missing := range []string{
		"AVIA_CANONICAL_TEST_TOKEN", "AVIA_OBJECT_STORE_ENDPOINT", "AVIA_OBJECT_STORE_ACCESS_KEY",
		"AVIA_OBJECT_STORE_SECRET_KEY", "AVIA_OBJECT_STORE_CORS_ORIGINS",
	} {
		t.Run("missing "+missing, func(t *testing.T) {
			candidate := cloneValues(values)
			delete(candidate, missing)
			if _, err := config.Load(mapLookup(candidate)); err == nil || !strings.Contains(err.Error(), missing) {
				t.Fatalf("missing %s error = %v", missing, err)
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

func TestProductionRequiresCompleteHTTPSOIDCAndSessionConfiguration(t *testing.T) {
	t.Parallel()

	base := map[string]string{
		"AVIA_ENVIRONMENT":               "production",
		"AVIA_DATABASE_URL":              "postgres://example.invalid/avia",
		"AVIA_OIDC_ISSUER_URL":           "https://identity.example/realms/avia",
		"AVIA_OIDC_CLIENT_ID":            "aviasurveil360",
		"AVIA_OIDC_CLIENT_SECRET":        "provider-secret",
		"AVIA_OIDC_REDIRECT_URL":         "https://avia.example/auth/callback",
		"AVIA_SESSION_ENCRYPTION_KEY":    base64.StdEncoding.EncodeToString([]byte("0123456789abcdef0123456789abcdef")),
		"AVIA_OBJECT_STORE_ENDPOINT":     "objects.example:443",
		"AVIA_OBJECT_STORE_ACCESS_KEY":   "production-access",
		"AVIA_OBJECT_STORE_SECRET_KEY":   "production-secret",
		"AVIA_OBJECT_STORE_CORS_ORIGINS": "https://avia.example",
		"AVIA_OBJECT_STORE_TLS":          "true",
	}
	settings, err := config.Load(mapLookup(base))
	if err != nil {
		t.Fatalf("Load() complete production config: %v", err)
	}
	if settings.OIDCIssuerURL != base["AVIA_OIDC_ISSUER_URL"] || settings.OIDCClientID != "aviasurveil360" {
		t.Fatalf("OIDC settings = %+v", settings)
	}
	if settings.SessionIdleDuration != 30*time.Minute || settings.SessionAbsoluteDuration != 8*time.Hour {
		t.Fatalf("session policy = idle %s absolute %s", settings.SessionIdleDuration, settings.SessionAbsoluteDuration)
	}
	if len(settings.SessionEncryptionKey) != 32 || !settings.CookieSecure {
		t.Fatalf("session security config = key bytes %d, secure cookie %t", len(settings.SessionEncryptionKey), settings.CookieSecure)
	}

	for _, missing := range []string{
		"AVIA_OIDC_ISSUER_URL", "AVIA_OIDC_CLIENT_ID", "AVIA_OIDC_CLIENT_SECRET",
		"AVIA_OIDC_REDIRECT_URL", "AVIA_SESSION_ENCRYPTION_KEY",
	} {
		t.Run("missing "+missing, func(t *testing.T) {
			values := cloneValues(base)
			delete(values, missing)
			if _, err := config.Load(mapLookup(values)); err == nil || !strings.Contains(err.Error(), missing) {
				t.Fatalf("Load() missing %s error = %v", missing, err)
			}
		})
	}
}

func TestProductionRejectsInsecureOIDCEndpointsAndInvalidEncryptionKey(t *testing.T) {
	t.Parallel()
	base := map[string]string{
		"AVIA_ENVIRONMENT":               "production",
		"AVIA_DATABASE_URL":              "postgres://example.invalid/avia",
		"AVIA_OIDC_ISSUER_URL":           "https://identity.example/realms/avia",
		"AVIA_OIDC_CLIENT_ID":            "aviasurveil360",
		"AVIA_OIDC_CLIENT_SECRET":        "provider-secret",
		"AVIA_OIDC_REDIRECT_URL":         "https://avia.example/auth/callback",
		"AVIA_SESSION_ENCRYPTION_KEY":    base64.StdEncoding.EncodeToString([]byte("0123456789abcdef0123456789abcdef")),
		"AVIA_OBJECT_STORE_ENDPOINT":     "objects.example:443",
		"AVIA_OBJECT_STORE_ACCESS_KEY":   "production-access",
		"AVIA_OBJECT_STORE_SECRET_KEY":   "production-secret",
		"AVIA_OBJECT_STORE_CORS_ORIGINS": "https://avia.example",
		"AVIA_OBJECT_STORE_TLS":          "true",
	}
	for name, mutation := range map[string]func(map[string]string){
		"HTTP issuer":   func(values map[string]string) { values["AVIA_OIDC_ISSUER_URL"] = "http://identity.example/realms/avia" },
		"HTTP redirect": func(values map[string]string) { values["AVIA_OIDC_REDIRECT_URL"] = "http://avia.example/auth/callback" },
		"short session key": func(values map[string]string) {
			values["AVIA_SESSION_ENCRYPTION_KEY"] = base64.StdEncoding.EncodeToString([]byte("short"))
		},
	} {
		t.Run(name, func(t *testing.T) {
			values := cloneValues(base)
			mutation(values)
			if _, err := config.Load(mapLookup(values)); err == nil {
				t.Fatalf("Load() accepted %s", name)
			}
		})
	}
}

func cloneValues(source map[string]string) map[string]string {
	clone := make(map[string]string, len(source))
	for key, value := range source {
		clone[key] = value
	}
	return clone
}

func mapLookup(values map[string]string) config.LookupEnv {
	return func(key string) (string, bool) {
		value, ok := values[key]
		return value, ok
	}
}
