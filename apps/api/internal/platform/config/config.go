package config

import (
	"encoding/base64"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type LookupEnv func(string) (string, bool)

type Settings struct {
	Environment             string
	DatabaseURL             string
	HTTPAddress             string
	WorkerInterval          time.Duration
	TestPrincipal           string
	TestSession             string
	DevSessionSecret        string
	OIDCIssuerURL           string
	OIDCClientID            string
	OIDCClientSecret        string
	OIDCRedirectURL         string
	SessionEncryptionKey    []byte
	SessionIdleDuration     time.Duration
	SessionAbsoluteDuration time.Duration
	CookieSecure            bool
	CanonicalTestProfile    bool
	CanonicalTestToken      string
	ObjectStoreEndpoint     string
	ObjectStoreAccessKey    string
	ObjectStoreSecretKey    string
	ObjectStoreTLS          bool
	ObjectStoreRegion       string
	ObjectStoreCORSOrigins  []string
	QuarantineBucket        string
	CanonicalBucket         string
	AllowServerManagedCORS  bool
	ScannerMode             string
}

func Load(lookup LookupEnv) (Settings, error) {
	environment := valueOrDefault(lookup, "AVIA_ENVIRONMENT", "development")
	settings := Settings{
		Environment:             environment,
		DatabaseURL:             value(lookup, "AVIA_DATABASE_URL"),
		HTTPAddress:             valueOrDefault(lookup, "AVIA_HTTP_ADDRESS", ":8080"),
		TestPrincipal:           value(lookup, "AVIA_TEST_PRINCIPAL"),
		TestSession:             value(lookup, "AVIA_TEST_SESSION"),
		DevSessionSecret:        value(lookup, "AVIA_DEV_SESSION_SECRET"),
		OIDCIssuerURL:           value(lookup, "AVIA_OIDC_ISSUER_URL"),
		OIDCClientID:            value(lookup, "AVIA_OIDC_CLIENT_ID"),
		OIDCClientSecret:        value(lookup, "AVIA_OIDC_CLIENT_SECRET"),
		OIDCRedirectURL:         value(lookup, "AVIA_OIDC_REDIRECT_URL"),
		SessionIdleDuration:     30 * time.Minute,
		SessionAbsoluteDuration: 8 * time.Hour,
		CookieSecure:            true,
		CanonicalTestToken:      value(lookup, "AVIA_CANONICAL_TEST_TOKEN"),
		ObjectStoreEndpoint:     value(lookup, "AVIA_OBJECT_STORE_ENDPOINT"),
		ObjectStoreAccessKey:    value(lookup, "AVIA_OBJECT_STORE_ACCESS_KEY"),
		ObjectStoreSecretKey:    value(lookup, "AVIA_OBJECT_STORE_SECRET_KEY"),
		ObjectStoreRegion:       value(lookup, "AVIA_OBJECT_STORE_REGION"),
		ObjectStoreCORSOrigins:  commaValues(value(lookup, "AVIA_OBJECT_STORE_CORS_ORIGINS")),
		QuarantineBucket:        valueOrDefault(lookup, "AVIA_OBJECT_STORE_QUARANTINE_BUCKET", "avia-quarantine"),
		CanonicalBucket:         valueOrDefault(lookup, "AVIA_OBJECT_STORE_CANONICAL_BUCKET", "avia-canonical"),
		ScannerMode:             value(lookup, "AVIA_SCANNER_MODE"),
	}
	canonicalProfile, err := parseBoolean(lookup, "AVIA_ENABLE_CANONICAL_TEST_PROFILE", false)
	if err != nil {
		return Settings{}, err
	}
	settings.CanonicalTestProfile = canonicalProfile
	objectStoreTLS, err := parseBoolean(lookup, "AVIA_OBJECT_STORE_TLS", false)
	if err != nil {
		return Settings{}, err
	}
	settings.ObjectStoreTLS = objectStoreTLS
	settings.AllowServerManagedCORS = settings.Environment == "test" && settings.CanonicalTestProfile

	if settings.Environment == "production" {
		for _, key := range []string{"AVIA_TEST_PRINCIPAL", "AVIA_TEST_SESSION", "AVIA_DEV_SESSION_SECRET", "AVIA_ENABLE_CANONICAL_TEST_PROFILE", "AVIA_CANONICAL_TEST_TOKEN"} {
			if value(lookup, key) != "" {
				return Settings{}, fmt.Errorf("%s is forbidden in production", key)
			}
		}
	}
	if settings.CanonicalTestProfile && settings.Environment != "test" {
		return Settings{}, fmt.Errorf("AVIA_ENABLE_CANONICAL_TEST_PROFILE requires AVIA_ENVIRONMENT=test")
	}
	if settings.CanonicalTestToken != "" && !settings.CanonicalTestProfile {
		return Settings{}, fmt.Errorf("AVIA_CANONICAL_TEST_TOKEN requires AVIA_ENABLE_CANONICAL_TEST_PROFILE=true")
	}
	if settings.CanonicalTestProfile && len(settings.CanonicalTestToken) < 16 {
		return Settings{}, fmt.Errorf("AVIA_CANONICAL_TEST_TOKEN is required and must contain at least 16 characters")
	}
	if settings.CanonicalTestProfile && settings.ScannerMode != "deterministic-test" {
		return Settings{}, fmt.Errorf("AVIA_SCANNER_MODE=deterministic-test is required by the canonical test profile")
	}
	if settings.Environment == "production" && settings.ScannerMode == "deterministic-test" {
		return Settings{}, fmt.Errorf("AVIA_SCANNER_MODE=deterministic-test is forbidden in production")
	}
	if settings.Environment != "test" && (settings.TestPrincipal != "" || settings.TestSession != "") {
		return Settings{}, fmt.Errorf("AVIA_TEST_PRINCIPAL and AVIA_TEST_SESSION require AVIA_ENVIRONMENT=test")
	}
	if settings.Environment != "development" && settings.DevSessionSecret != "" {
		return Settings{}, fmt.Errorf("AVIA_DEV_SESSION_SECRET requires AVIA_ENVIRONMENT=development")
	}
	if settings.Environment == "test" && (settings.TestPrincipal == "") != (settings.TestSession == "") {
		return Settings{}, fmt.Errorf("AVIA_TEST_PRINCIPAL and AVIA_TEST_SESSION must be configured together")
	}
	if settings.DatabaseURL == "" {
		return Settings{}, fmt.Errorf("AVIA_DATABASE_URL is required")
	}
	if !contains([]string{"development", "test", "production"}, settings.Environment) {
		return Settings{}, fmt.Errorf("AVIA_ENVIRONMENT must be development, test, or production")
	}

	objectStoreConfigured := settings.ObjectStoreEndpoint != "" || settings.ObjectStoreAccessKey != "" || settings.ObjectStoreSecretKey != "" || len(settings.ObjectStoreCORSOrigins) > 0
	if settings.Environment == "production" || settings.CanonicalTestProfile || objectStoreConfigured {
		for _, entry := range []struct {
			name  string
			value any
		}{
			{name: "AVIA_OBJECT_STORE_ENDPOINT", value: settings.ObjectStoreEndpoint},
			{name: "AVIA_OBJECT_STORE_ACCESS_KEY", value: settings.ObjectStoreAccessKey},
			{name: "AVIA_OBJECT_STORE_SECRET_KEY", value: settings.ObjectStoreSecretKey},
			{name: "AVIA_OBJECT_STORE_CORS_ORIGINS", value: settings.ObjectStoreCORSOrigins},
		} {
			missing := entry.value == ""
			if values, ok := entry.value.([]string); ok {
				missing = len(values) == 0
			}
			if missing {
				return Settings{}, fmt.Errorf("%s is required when object storage is enabled", entry.name)
			}
		}
		if settings.QuarantineBucket == settings.CanonicalBucket {
			return Settings{}, fmt.Errorf("quarantine and canonical object-store buckets must be distinct")
		}
		if settings.Environment == "production" && !settings.ObjectStoreTLS {
			return Settings{}, fmt.Errorf("AVIA_OBJECT_STORE_TLS=true is required in production")
		}
	}

	oidcKeys := []struct {
		name  string
		value string
	}{
		{name: "AVIA_OIDC_ISSUER_URL", value: settings.OIDCIssuerURL},
		{name: "AVIA_OIDC_CLIENT_ID", value: settings.OIDCClientID},
		{name: "AVIA_OIDC_CLIENT_SECRET", value: settings.OIDCClientSecret},
		{name: "AVIA_OIDC_REDIRECT_URL", value: settings.OIDCRedirectURL},
		{name: "AVIA_SESSION_ENCRYPTION_KEY", value: value(lookup, "AVIA_SESSION_ENCRYPTION_KEY")},
	}
	oidcConfigured := false
	for _, entry := range oidcKeys {
		if entry.value != "" {
			oidcConfigured = true
			break
		}
	}
	if settings.Environment == "production" || oidcConfigured {
		for _, entry := range oidcKeys {
			if entry.value == "" {
				return Settings{}, fmt.Errorf("%s is required when OIDC authentication is enabled", entry.name)
			}
		}
		key, err := base64.StdEncoding.DecodeString(value(lookup, "AVIA_SESSION_ENCRYPTION_KEY"))
		if err != nil || len(key) != 32 {
			return Settings{}, fmt.Errorf("AVIA_SESSION_ENCRYPTION_KEY must be base64 for exactly 32 bytes")
		}
		settings.SessionEncryptionKey = key
		issuerURL, err := url.Parse(settings.OIDCIssuerURL)
		if err != nil || issuerURL.Scheme == "" || issuerURL.Host == "" {
			return Settings{}, fmt.Errorf("AVIA_OIDC_ISSUER_URL must be an absolute URL")
		}
		redirectURL, err := url.Parse(settings.OIDCRedirectURL)
		if err != nil || redirectURL.Scheme == "" || redirectURL.Host == "" {
			return Settings{}, fmt.Errorf("AVIA_OIDC_REDIRECT_URL must be an absolute URL")
		}
		if settings.Environment == "production" && (issuerURL.Scheme != "https" || redirectURL.Scheme != "https") {
			return Settings{}, fmt.Errorf("production OIDC issuer and redirect URLs must use HTTPS")
		}
	}

	workerMilliseconds := valueOrDefault(lookup, "AVIA_WORKER_INTERVAL_MS", "1000")
	milliseconds, err := strconv.Atoi(workerMilliseconds)
	if err != nil || milliseconds < 50 {
		return Settings{}, fmt.Errorf("AVIA_WORKER_INTERVAL_MS must be an integer of at least 50")
	}
	settings.WorkerInterval = time.Duration(milliseconds) * time.Millisecond
	return settings, nil
}

func value(lookup LookupEnv, key string) string {
	if raw, ok := lookup(key); ok {
		return strings.TrimSpace(raw)
	}
	return ""
}

func valueOrDefault(lookup LookupEnv, key, fallback string) string {
	if resolved := value(lookup, key); resolved != "" {
		return resolved
	}
	return fallback
}

func contains(values []string, expected string) bool {
	for _, value := range values {
		if value == expected {
			return true
		}
	}
	return false
}

func parseBoolean(lookup LookupEnv, key string, fallback bool) (bool, error) {
	raw := value(lookup, key)
	if raw == "" {
		return fallback, nil
	}
	parsed, err := strconv.ParseBool(raw)
	if err != nil {
		return false, fmt.Errorf("%s must be true or false", key)
	}
	return parsed, nil
}

func commaValues(raw string) []string {
	if raw == "" {
		return nil
	}
	values := []string{}
	for _, candidate := range strings.Split(raw, ",") {
		if trimmed := strings.TrimSpace(candidate); trimmed != "" {
			values = append(values, trimmed)
		}
	}
	return values
}
