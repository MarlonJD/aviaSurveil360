package documents

import (
	"context"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

const testRendererHash = "sha256:56c47f7b913f3b978554115a0191c4a9dcc2558f9090f27f3f13f28a7c2f8329"

func TestGotenbergRendererSendsBoundedDeterministicHTMLAndReturnsPDFProvenance(t *testing.T) {
	t.Parallel()

	var renderedHTML string
	var metadata map[string]any
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodPost ||
			request.URL.Path != "/forms/chromium/convert/html" {
			t.Errorf("Gotenberg request = %s %s", request.Method, request.URL.Path)
			http.Error(writer, "unexpected route", http.StatusNotFound)
			return
		}
		if request.Header.Get("Gotenberg-Output-Filename") != "RPT-2026-018scriptalertunsafescript-v3" {
			t.Errorf("Gotenberg output filename = %q", request.Header.Get("Gotenberg-Output-Filename"))
		}
		reader, err := request.MultipartReader()
		if err != nil {
			t.Errorf("multipart request: %v", err)
			http.Error(writer, "bad multipart", http.StatusBadRequest)
			return
		}
		fields := readGotenbergFields(t, reader)
		renderedHTML = fields["files"]
		if fields["preferCssPageSize"] != "true" ||
			fields["printBackground"] != "true" ||
			fields["failOnConsoleExceptions"] != "true" {
			t.Errorf("deterministic render fields = %#v", fields)
		}
		if err := json.Unmarshal([]byte(fields["metadata"]), &metadata); err != nil {
			t.Errorf("metadata JSON: %v", err)
		}
		writer.Header().Set("Content-Type", "application/pdf")
		_, _ = writer.Write([]byte("%PDF-1.7\n1 0 obj\n<</Type/Catalog>>\nendobj\n%%EOF\n"))
	}))
	defer server.Close()

	renderer, err := NewGotenbergRenderer(GotenbergConfig{
		BaseURL: server.URL, Timeout: time.Second, RendererHash: testRendererHash,
	})
	if err != nil {
		t.Fatalf("NewGotenbergRenderer() error = %v", err)
	}
	snapshot := RenderSnapshot{
		ReportVersionID:  "REPORT-VERSION-003",
		ReportID:         `RPT-2026-018<script>alert("unsafe")</script>`,
		Kind:             "FINAL",
		OrganizationID:   "ORG-FLY-NAMIBIA",
		AuditID:          "AUD-2026-018",
		FindingIDs:       []string{"FND-2026-003", `FND-<unsafe>`},
		ContentHash:      "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		Version:          3,
		CreatedBySubject: "executive-001",
	}
	artifact, err := renderer.Render(context.Background(), snapshot)
	if err != nil {
		t.Fatalf("Render() error = %v", err)
	}
	if !strings.HasPrefix(string(artifact.Body), "%PDF-") ||
		artifact.MediaType != "application/pdf" ||
		artifact.FileName != "RPT-2026-018scriptalertunsafescript-v3.pdf" {
		t.Fatalf("artifact = %+v", artifact)
	}
	if artifact.RendererHash != testRendererHash ||
		!strings.HasPrefix(artifact.TemplateHash, "sha256:") ||
		!strings.HasPrefix(artifact.SourceHash, "sha256:") {
		t.Fatalf("artifact provenance = %+v", artifact)
	}
	if strings.Contains(renderedHTML, `<script>alert("unsafe")</script>`) ||
		!strings.Contains(renderedHTML, "&lt;script&gt;") ||
		!strings.Contains(renderedHTML, "REPORT-VERSION-003") ||
		!strings.Contains(renderedHTML, "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") ||
		!strings.Contains(renderedHTML, "FND-&lt;unsafe&gt;") {
		t.Fatalf("rendered HTML did not preserve escaped exact source identity:\n%s", renderedHTML)
	}
	if metadata["Title"] != `RPT-2026-018<script>alert("unsafe")</script> version 3` ||
		metadata["Creator"] != "AviaSurveil360" ||
		metadata["Producer"] != "Gotenberg" ||
		metadata["CreationDate"] != "1970-01-01T00:00:00Z" ||
		metadata["ModDate"] != "1970-01-01T00:00:00Z" {
		t.Fatalf("deterministic metadata = %#v", metadata)
	}

	repeated, err := renderer.Render(context.Background(), snapshot)
	if err != nil {
		t.Fatalf("repeat Render() error = %v", err)
	}
	if repeated.TemplateHash != artifact.TemplateHash ||
		repeated.SourceHash != artifact.SourceHash ||
		repeated.RendererHash != artifact.RendererHash {
		t.Fatalf("repeat provenance = %+v, first = %+v", repeated, artifact)
	}
}

func TestGotenbergRendererFailsClosedForProviderAndPDFBoundaryErrors(t *testing.T) {
	t.Parallel()

	t.Run("provider error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
			http.Error(writer, "renderer unavailable internal detail", http.StatusServiceUnavailable)
		}))
		defer server.Close()
		renderer := mustGotenbergRenderer(t, server.URL, time.Second)
		if _, err := renderer.Render(context.Background(), validRenderSnapshot()); err == nil ||
			!strings.Contains(err.Error(), "status 503") ||
			strings.Contains(err.Error(), "internal detail") {
			t.Fatalf("provider error = %v", err)
		}
	})

	t.Run("timeout", func(t *testing.T) {
		release := make(chan struct{})
		server := httptest.NewServer(http.HandlerFunc(func(_ http.ResponseWriter, _ *http.Request) {
			<-release
		}))
		defer server.Close()
		renderer := mustGotenbergRenderer(t, server.URL, 25*time.Millisecond)
		started := time.Now()
		_, renderErr := renderer.Render(context.Background(), validRenderSnapshot())
		close(release)
		if renderErr == nil ||
			!strings.Contains(renderErr.Error(), "deadline") {
			t.Fatalf("timeout error = %v", renderErr)
		}
		if elapsed := time.Since(started); elapsed > time.Second {
			t.Fatalf("bounded timeout elapsed = %v", elapsed)
		}
	})

	t.Run("non PDF response", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, _ *http.Request) {
			writer.Header().Set("Content-Type", "text/plain")
			_, _ = writer.Write([]byte("not a PDF"))
		}))
		defer server.Close()
		renderer := mustGotenbergRenderer(t, server.URL, time.Second)
		if _, err := renderer.Render(context.Background(), validRenderSnapshot()); err == nil ||
			!strings.Contains(err.Error(), "PDF") {
			t.Fatalf("non-PDF error = %v", err)
		}
	})
}

func TestReportRendererBoundsSourceAndHTMLBeforeCallingGotenberg(t *testing.T) {
	t.Parallel()

	t.Run("source", func(t *testing.T) {
		snapshot := validRenderSnapshot()
		snapshot.ReportID = strings.Repeat("R", (1<<20)+1)
		if _, _, _, err := renderReportHTML(snapshot); err == nil ||
			!strings.Contains(err.Error(), "source exceeds") {
			t.Fatalf("oversized source error = %v", err)
		}
	})

	t.Run("HTML expansion", func(t *testing.T) {
		snapshot := validRenderSnapshot()
		snapshot.ReportID = strings.Repeat(`"`, 450_000)
		if _, _, _, err := renderReportHTML(snapshot); err == nil ||
			!strings.Contains(err.Error(), "HTML request exceeds") {
			t.Fatalf("oversized HTML error = %v", err)
		}
	})
}

func readGotenbergFields(t *testing.T, reader *multipart.Reader) map[string]string {
	t.Helper()
	fields := map[string]string{}
	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			return fields
		}
		if err != nil {
			t.Fatalf("read multipart part: %v", err)
		}
		body, err := io.ReadAll(io.LimitReader(part, 2<<20))
		if err != nil {
			t.Fatalf("read multipart field %s: %v", part.FormName(), err)
		}
		fields[part.FormName()] = string(body)
		if part.FileName() != "" && part.FileName() != "index.html" {
			t.Fatalf("Gotenberg HTML filename = %q", part.FileName())
		}
	}
}

func mustGotenbergRenderer(t *testing.T, baseURL string, timeout time.Duration) *GotenbergRenderer {
	t.Helper()
	renderer, err := NewGotenbergRenderer(GotenbergConfig{
		BaseURL: baseURL, Timeout: timeout, RendererHash: testRendererHash,
	})
	if err != nil {
		t.Fatalf("NewGotenbergRenderer() error = %v", err)
	}
	return renderer
}

func validRenderSnapshot() RenderSnapshot {
	return RenderSnapshot{
		ReportVersionID: "REPORT-VERSION-001", ReportID: "RPT-2026-001",
		Kind: "PRELIMINARY", OrganizationID: "ORG-FLY-NAMIBIA",
		AuditID: "AUD-2026-001", FindingIDs: []string{"FND-2026-001"},
		ContentHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", Version: 1,
		CreatedBySubject: "executive-001",
	}
}
