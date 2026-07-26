package documents

import (
	"bytes"
	"context"
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"
	"unicode"
)

const (
	reportTemplateName      = "templates/report-v1.html"
	maximumRenderSourceSize = 1 << 20
	maximumHTMLRequestSize  = 2 << 20
	maximumPDFResponseSize  = 32 << 20
)

//go:embed templates/report-v1.html
var reportTemplates embed.FS

type GotenbergConfig struct {
	BaseURL      string
	Timeout      time.Duration
	RendererHash string
	Client       *http.Client
}

type GotenbergRenderer struct {
	endpoint     string
	timeout      time.Duration
	rendererHash string
	client       *http.Client
}

func NewGotenbergRenderer(config GotenbergConfig) (*GotenbergRenderer, error) {
	baseURL, err := url.Parse(strings.TrimSpace(config.BaseURL))
	if err != nil || baseURL.Scheme == "" || baseURL.Host == "" ||
		(baseURL.Scheme != "http" && baseURL.Scheme != "https") ||
		baseURL.User != nil || baseURL.RawQuery != "" || baseURL.Fragment != "" {
		return nil, fmt.Errorf("valid HTTP(S) Gotenberg base URL is required")
	}
	if config.Timeout <= 0 || config.Timeout > 2*time.Minute {
		return nil, fmt.Errorf("Gotenberg timeout must be positive and no greater than two minutes")
	}
	if !validSHA256(config.RendererHash) {
		return nil, fmt.Errorf("Gotenberg renderer image sha256 is required")
	}
	client := config.Client
	if client == nil {
		client = &http.Client{}
	}
	baseURL.Path = path.Join(strings.TrimSuffix(baseURL.Path, "/"), "/forms/chromium/convert/html")
	return &GotenbergRenderer{
		endpoint: baseURL.String(), timeout: config.Timeout,
		rendererHash: config.RendererHash, client: client,
	}, nil
}

func (renderer *GotenbergRenderer) Render(
	ctx context.Context,
	snapshot RenderSnapshot,
) (RenderedArtifact, error) {
	htmlBody, templateHash, sourceHash, err := renderReportHTML(snapshot)
	if err != nil {
		return RenderedArtifact{}, err
	}
	body := &bytes.Buffer{}
	form := multipart.NewWriter(body)
	file, err := form.CreateFormFile("files", "index.html")
	if err != nil {
		return RenderedArtifact{}, fmt.Errorf("create Gotenberg HTML part: %w", err)
	}
	if _, err := file.Write(htmlBody); err != nil {
		return RenderedArtifact{}, fmt.Errorf("write Gotenberg HTML part: %w", err)
	}
	metadata, err := deterministicPDFMetadata(snapshot)
	if err != nil {
		return RenderedArtifact{}, err
	}
	for name, value := range map[string]string{
		"preferCssPageSize":       "true",
		"printBackground":         "true",
		"failOnConsoleExceptions": "true",
		"metadata":                string(metadata),
	} {
		if err := form.WriteField(name, value); err != nil {
			return RenderedArtifact{}, fmt.Errorf("write Gotenberg field %s: %w", name, err)
		}
	}
	if err := form.Close(); err != nil {
		return RenderedArtifact{}, fmt.Errorf("close Gotenberg request: %w", err)
	}

	requestCtx, cancel := context.WithTimeout(ctx, renderer.timeout)
	defer cancel()
	request, err := http.NewRequestWithContext(
		requestCtx, http.MethodPost, renderer.endpoint, body,
	)
	if err != nil {
		return RenderedArtifact{}, fmt.Errorf("create Gotenberg request: %w", err)
	}
	request.Header.Set("Content-Type", form.FormDataContentType())
	request.Header.Set(
		"Gotenberg-Output-Filename",
		safePDFBaseName(snapshot.ReportID, snapshot.Version),
	)
	response, err := renderer.client.Do(request)
	if err != nil {
		return RenderedArtifact{}, fmt.Errorf("render PDF with Gotenberg: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 4<<10))
		return RenderedArtifact{}, fmt.Errorf(
			"render PDF with Gotenberg: provider returned status %d",
			response.StatusCode,
		)
	}
	pdf, err := io.ReadAll(io.LimitReader(response.Body, maximumPDFResponseSize+1))
	if err != nil {
		return RenderedArtifact{}, fmt.Errorf("read Gotenberg PDF: %w", err)
	}
	if len(pdf) > maximumPDFResponseSize {
		return RenderedArtifact{}, fmt.Errorf("Gotenberg PDF exceeds %d bytes", maximumPDFResponseSize)
	}
	if len(pdf) < len("%PDF-") || !bytes.Equal(pdf[:len("%PDF-")], []byte("%PDF-")) {
		return RenderedArtifact{}, fmt.Errorf("Gotenberg response is not a PDF")
	}
	return RenderedArtifact{
		FileName:     safePDFBaseName(snapshot.ReportID, snapshot.Version) + ".pdf",
		MediaType:    "application/pdf",
		Body:         pdf,
		RendererHash: renderer.rendererHash,
		TemplateHash: templateHash,
		SourceHash:   sourceHash,
	}, nil
}

func renderReportHTML(snapshot RenderSnapshot) ([]byte, string, string, error) {
	if err := validateRenderSnapshot(snapshot); err != nil {
		return nil, "", "", err
	}
	source, err := json.Marshal(snapshot)
	if err != nil {
		return nil, "", "", fmt.Errorf("encode report render source: %w", err)
	}
	if len(source) > maximumRenderSourceSize {
		return nil, "", "", fmt.Errorf(
			"encoded report render source exceeds %d bytes",
			maximumRenderSourceSize,
		)
	}
	templateSource, err := reportTemplates.ReadFile(reportTemplateName)
	if err != nil {
		return nil, "", "", fmt.Errorf("read server-owned report template: %w", err)
	}
	parsed, err := template.New("report-v1").Parse(string(templateSource))
	if err != nil {
		return nil, "", "", fmt.Errorf("parse server-owned report template: %w", err)
	}
	rendered := boundedHTMLBuffer{maximum: maximumHTMLRequestSize}
	if err := parsed.Execute(&rendered, snapshot); err != nil {
		return nil, "", "", fmt.Errorf("render server-owned report template: %w", err)
	}
	return rendered.Bytes(), digest(templateSource), digest(source), nil
}

func validateRenderSnapshot(snapshot RenderSnapshot) error {
	required := []string{
		snapshot.ReportVersionID,
		snapshot.ReportID,
		snapshot.OrganizationID,
		snapshot.AuditID,
		snapshot.ContentHash,
		snapshot.CreatedBySubject,
	}
	for _, value := range required {
		if strings.TrimSpace(value) == "" {
			return fmt.Errorf("complete immutable report render source is required")
		}
	}
	sourceSize := int64(len(snapshot.Kind))
	for _, value := range required {
		sourceSize += int64(len(value))
	}
	for _, findingID := range snapshot.FindingIDs {
		sourceSize += int64(len(findingID))
	}
	if sourceSize > maximumRenderSourceSize {
		return fmt.Errorf(
			"report render source exceeds %d bytes",
			maximumRenderSourceSize,
		)
	}
	if snapshot.Version <= 0 {
		return fmt.Errorf("positive immutable report version is required")
	}
	switch snapshot.Kind {
	case "PRELIMINARY", "FINAL", "CLOSURE":
	default:
		return fmt.Errorf("supported Preliminary, Final, or Closure report kind is required")
	}
	if !validSHA256(snapshot.ContentHash) {
		return fmt.Errorf("report content sha256 is required")
	}
	for _, findingID := range snapshot.FindingIDs {
		if strings.TrimSpace(findingID) == "" {
			return fmt.Errorf("report Finding identities cannot be empty")
		}
	}
	return nil
}

func deterministicPDFMetadata(snapshot RenderSnapshot) ([]byte, error) {
	metadata := struct {
		Author       string   `json:"Author"`
		CreationDate string   `json:"CreationDate"`
		Creator      string   `json:"Creator"`
		Keywords     []string `json:"Keywords"`
		ModDate      string   `json:"ModDate"`
		PDFVersion   float64  `json:"PDFVersion"`
		Producer     string   `json:"Producer"`
		Subject      string   `json:"Subject"`
		Title        string   `json:"Title"`
	}{
		Author: "AviaSurveil360", CreationDate: "1970-01-01T00:00:00Z",
		Creator: "AviaSurveil360",
		Keywords: []string{
			snapshot.Kind, snapshot.ReportVersionID, snapshot.ContentHash,
		},
		ModDate: "1970-01-01T00:00:00Z", PDFVersion: 1.7,
		Producer: "Gotenberg",
		Subject:  snapshot.Kind + " report generated from an immutable source snapshot",
		Title:    fmt.Sprintf("%s version %d", snapshot.ReportID, snapshot.Version),
	}
	body, err := json.Marshal(metadata)
	if err != nil {
		return nil, fmt.Errorf("encode deterministic PDF metadata: %w", err)
	}
	return body, nil
}

func safePDFBaseName(reportID string, version int64) string {
	var sanitized strings.Builder
	for _, character := range strings.TrimSpace(reportID) {
		if unicode.IsLetter(character) || unicode.IsDigit(character) ||
			character == '-' || character == '_' {
			sanitized.WriteRune(character)
		}
	}
	if sanitized.Len() == 0 {
		sanitized.WriteString("report")
	}
	return fmt.Sprintf("%s-v%d", sanitized.String(), version)
}

func validSHA256(value string) bool {
	if !strings.HasPrefix(value, "sha256:") || len(value) != len("sha256:")+64 {
		return false
	}
	_, err := hex.DecodeString(strings.TrimPrefix(value, "sha256:"))
	return err == nil
}

func digest(body []byte) string {
	sum := sha256.Sum256(body)
	return "sha256:" + hex.EncodeToString(sum[:])
}

type boundedHTMLBuffer struct {
	bytes.Buffer
	maximum int
}

func (buffer *boundedHTMLBuffer) Write(body []byte) (int, error) {
	if len(body) > buffer.maximum-buffer.Len() {
		return 0, fmt.Errorf(
			"report HTML request exceeds %d bytes",
			buffer.maximum,
		)
	}
	return buffer.Buffer.Write(body)
}
