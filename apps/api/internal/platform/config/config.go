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
	}

	if settings.Environment == "production" {
		for _, key := range []string{"AVIA_TEST_PRINCIPAL", "AVIA_TEST_SESSION", "AVIA_DEV_SESSION_SECRET"} {
			if value(lookup, key) != "" {
				return Settings{}, fmt.Errorf("%s is forbidden in production", key)
			}
		}
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
