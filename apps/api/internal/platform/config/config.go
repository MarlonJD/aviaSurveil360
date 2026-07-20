package config

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

type LookupEnv func(string) (string, bool)

type Settings struct {
	Environment      string
	DatabaseURL      string
	HTTPAddress      string
	WorkerInterval   time.Duration
	TestPrincipal    string
	TestSession      string
	DevSessionSecret string
}

func Load(lookup LookupEnv) (Settings, error) {
	environment := valueOrDefault(lookup, "AVIA_ENVIRONMENT", "development")
	settings := Settings{
		Environment:      environment,
		DatabaseURL:      value(lookup, "AVIA_DATABASE_URL"),
		HTTPAddress:      valueOrDefault(lookup, "AVIA_HTTP_ADDRESS", ":8080"),
		TestPrincipal:    value(lookup, "AVIA_TEST_PRINCIPAL"),
		TestSession:      value(lookup, "AVIA_TEST_SESSION"),
		DevSessionSecret: value(lookup, "AVIA_DEV_SESSION_SECRET"),
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
