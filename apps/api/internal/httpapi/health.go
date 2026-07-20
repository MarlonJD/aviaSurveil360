package httpapi

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type ReadinessProbe interface {
	Ready(context.Context) error
}

func NewHealthHandler(readiness ReadinessProbe) http.Handler {
	router := chi.NewRouter()
	router.Get("/health/live", func(writer http.ResponseWriter, _ *http.Request) {
		writeJSON(writer, http.StatusOK, map[string]string{"status": "ok"})
	})
	router.Get("/health/ready", func(writer http.ResponseWriter, request *http.Request) {
		if readiness == nil || readiness.Ready(request.Context()) != nil {
			writeProblem(writer, http.StatusServiceUnavailable, "Service unavailable", "required dependencies are not ready", "NOT_READY")
			return
		}
		writeJSON(writer, http.StatusOK, map[string]string{"status": "ok"})
	})
	return router
}

func writeJSON(writer http.ResponseWriter, status int, body any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	_ = json.NewEncoder(writer).Encode(body)
}

func writeProblem(writer http.ResponseWriter, status int, title, detail, code string) {
	writer.Header().Set("Content-Type", "application/problem+json")
	writer.WriteHeader(status)
	_ = json.NewEncoder(writer).Encode(map[string]any{
		"type":   "about:blank",
		"title":  title,
		"status": status,
		"detail": detail,
		"code":   code,
	})
}
