package assistant

import "context"

// ProviderRequest is deliberately narrow. Canonical status, severity, ownership,
// organization, Internal CAA Notes, and auditee comments never cross this
// advisory boundary.
type ProviderRequest struct {
	FindingID        string `json:"findingId"`
	FindingReference string `json:"findingReference"`
	Prompt           string `json:"prompt"`
}

type ProviderResponse struct {
	Text       string `json:"text"`
	ProviderID string `json:"providerId"`
}

type Provider interface {
	Generate(context.Context, ProviderRequest) (ProviderResponse, error)
}
