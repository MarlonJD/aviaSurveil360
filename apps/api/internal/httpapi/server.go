package httpapi

import "net/http"

func NewServerHandler(readiness ReadinessProbe, authentication http.Handler) http.Handler {
	return NewApplicationHandler(readiness, authentication, nil, nil)
}

func NewApplicationHandler(readiness ReadinessProbe, authentication, api, testAdministration http.Handler) http.Handler {
	return NewInstrumentedApplicationHandler(
		readiness,
		authentication,
		api,
		testAdministration,
		nil,
	)
}

func NewInstrumentedApplicationHandler(
	readiness ReadinessProbe,
	authentication http.Handler,
	api http.Handler,
	testAdministration http.Handler,
	instrument func(http.Handler) http.Handler,
) http.Handler {
	handler := newApplicationHandler(
		readiness,
		authentication,
		api,
		testAdministration,
		applicationSecurityOptions{},
	)
	if instrument != nil {
		return instrument(handler)
	}
	return handler
}

func newApplicationHandler(readiness ReadinessProbe, authentication, api, testAdministration http.Handler, options applicationSecurityOptions) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("/health/", NewHealthHandler(readiness))
	if authentication == nil {
		authentication = http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
			writeProblem(writer, http.StatusServiceUnavailable, "Authentication unavailable", "OIDC authentication is not configured", "AUTH_UNAVAILABLE")
		})
	}
	mux.Handle("/auth/", authentication)
	if api != nil {
		mux.Handle("/v1/", api)
	}
	if testAdministration != nil {
		mux.Handle("/__test/", testAdministration)
	}
	return withSecurityHeaders(newApplicationRateLimiter(options).protect(mux))
}
