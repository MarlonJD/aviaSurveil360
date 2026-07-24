package documents

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

type RenderedArtifact struct {
	FileName  string
	MediaType string
	Body      []byte
}

type Renderer interface {
	Render(context.Context, RenderSnapshot) (RenderedArtifact, error)
}

// DeterministicPDFRenderer is a local candidate renderer. Plan 3 replaces this
// adapter with Gotenberg; the service and immutable job boundary stay intact.
type DeterministicPDFRenderer struct{}

func (DeterministicPDFRenderer) Render(_ context.Context, snapshot RenderSnapshot) (RenderedArtifact, error) {
	if strings.TrimSpace(snapshot.ReportVersionID) == "" ||
		strings.TrimSpace(snapshot.ReportID) == "" ||
		strings.TrimSpace(snapshot.OrganizationID) == "" ||
		snapshot.Version <= 0 {
		return RenderedArtifact{}, fmt.Errorf("complete report render identity is required")
	}
	payload, err := json.Marshal(snapshot)
	if err != nil {
		return RenderedArtifact{}, fmt.Errorf("encode report render snapshot: %w", err)
	}
	body := []byte("%PDF-1.7\n% AviaSurveil360 deterministic candidate document\n")
	body = append(body, payload...)
	body = append(body, []byte("\n%%EOF\n")...)
	return RenderedArtifact{
		FileName:  snapshot.ReportID + ".pdf",
		MediaType: "application/pdf",
		Body:      body,
	}, nil
}
