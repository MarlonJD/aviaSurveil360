package httpapi

import "net/http"

func NewServerHandler(readiness ReadinessProbe, authentication http.Handler) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("/health/", NewHealthHandler(readiness))
	if authentication == nil {
		authentication = http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
			writeProblem(writer, http.StatusServiceUnavailable, "Authentication unavailable", "OIDC authentication is not configured", "AUTH_UNAVAILABLE")
		})
	}
	mux.Handle("/auth/", authentication)
	return mux
}
