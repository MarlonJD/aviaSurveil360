package integration_test

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/documents"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/objectstore"
)

const (
	integrationRendererHash = "sha256:1111111111111111111111111111111111111111111111111111111111111111"
	integrationTemplateHash = "sha256:2222222222222222222222222222222222222222222222222222222222222222"
)

func TestDocumentPipelinePersistsExactImmutableProvenanceAndRecoversAfterExternalEffect(t *testing.T) {
	pool := canonicalDatabase(t, "gotenberg_document_crash_recovery")
	snapshot := documentRenderSnapshot("FINAL", 3)
	seedDocumentRenderJob(t, pool, "render-final-v3", "document-final", snapshot)
	objects := newMemoryObjectStore()
	now := canonicalNow
	crash := true
	service := documents.NewService(pool, objects, documents.Dependencies{
		Renderer: scriptedDocumentRenderer{render: validDocumentArtifact},
		Bucket:   "generated-documents", Clock: func() time.Time { return now },
		WorkerID: "document-worker-test",
		AfterExternalEffect: func() error {
			if crash {
				crash = false
				return errors.New("simulated worker crash after immutable object write")
			}
			return nil
		},
	})

	processed, err := service.ProcessNext(context.Background())
	if !processed || err == nil || !strings.Contains(err.Error(), "simulated worker crash") {
		t.Fatalf("first render after external effect = processed %t, err %v", processed, err)
	}
	var versions int
	if err := pool.QueryRow(
		context.Background(),
		"SELECT count(*) FROM document_versions WHERE document_id = 'document-final'",
	).Scan(&versions); err != nil || versions != 0 {
		t.Fatalf("versions before crash recovery = %d, err %v", versions, err)
	}

	now = now.Add(61 * time.Second)
	processed, err = service.ProcessNext(context.Background())
	if err != nil || !processed {
		t.Fatalf("recovered render = processed %t, err %v", processed, err)
	}
	processed, err = service.ProcessNext(context.Background())
	if err != nil || processed {
		t.Fatalf("duplicate render = processed %t, err %v", processed, err)
	}

	var documentVersionID, rendererHash, templateHash, sourceHash, pdfHash string
	var version, versionCount, auditCount int
	if err := pool.QueryRow(context.Background(), `
		SELECT id, version, renderer_hash, template_hash, source_hash, sha256,
		       count(*) OVER ()
		FROM document_versions
		WHERE document_id = 'document-final'
	`).Scan(
		&documentVersionID, &version, &rendererHash, &templateHash,
		&sourceHash, &pdfHash, &versionCount,
	); err != nil {
		t.Fatalf("read immutable rendered version provenance: %v", err)
	}
	if version != 3 || versionCount != 1 ||
		rendererHash != integrationRendererHash ||
		templateHash != integrationTemplateHash ||
		sourceHash != renderSourceHash(t, snapshot) ||
		!strings.HasPrefix(pdfHash, "sha256:") {
		t.Fatalf(
			"immutable render provenance = version %d count %d renderer %q template %q source %q PDF %q",
			version, versionCount, rendererHash, templateHash, sourceHash, pdfHash,
		)
	}
	if err := pool.QueryRow(context.Background(), `
		SELECT count(*) FROM audit_events
		WHERE action = 'document.render_completed'
		  AND entity_id = $1
		  AND details->>'rendererHash' = $2
		  AND details->>'templateHash' = $3
		  AND details->>'sourceHash' = $4
		  AND details->>'reportVersionId' = $5
	`, documentVersionID, rendererHash, templateHash, sourceHash, snapshot.ReportVersionID).Scan(&auditCount); err != nil ||
		auditCount != 1 {
		t.Fatalf("render audit provenance count = %d, err %v", auditCount, err)
	}

	key := fmt.Sprintf(
		"organizations/%s/documents/%s/version-%d.pdf",
		snapshot.OrganizationID, "render-final-v3", snapshot.Version,
	)
	reader, info, err := objects.Open(context.Background(), "generated-documents", key)
	if err != nil {
		t.Fatalf("open private rendered object: %v", err)
	}
	body, readErr := io.ReadAll(reader)
	closeErr := reader.Close()
	if readErr != nil || closeErr != nil ||
		!strings.HasPrefix(string(body), "%PDF-") ||
		info.Metadata["sha256"] != pdfHash ||
		info.Metadata["renderer-sha256"] != rendererHash ||
		info.Metadata["template-sha256"] != templateHash ||
		info.Metadata["source-sha256"] != sourceHash {
		t.Fatalf(
			"private rendered object = info %+v body prefix %q, read %v close %v",
			info, string(body[:min(len(body), 8)]), readErr, closeErr,
		)
	}

	auditee := principal(
		"auditee-xyz", "airline-xyz", "session-auditee", identity.RoleAuditee,
	)
	download, err := service.AuthorizeDownload(
		context.Background(), auditee, documentVersionID,
	)
	if err != nil || !strings.HasPrefix(download.URL, "memory://download/") ||
		download.SHA256 != pdfHash {
		t.Fatalf("authorized exact-version download = %+v, err %v", download, err)
	}
	other := principal(
		"auditee-other", "airline-other", "session-other", identity.RoleAuditee,
	)
	if _, err := service.AuthorizeDownload(
		context.Background(), other, documentVersionID,
	); !errors.Is(err, documents.ErrForbidden) {
		t.Fatalf("cross-organization rendered download error = %v", err)
	}

	var approvalStatus string
	if err := pool.QueryRow(
		context.Background(),
		"SELECT status FROM report_approval_states WHERE report_version_id = $1",
		snapshot.ReportVersionID,
	).Scan(&approvalStatus); err != nil || approvalStatus != "DEPARTMENT_REVIEW" {
		t.Fatalf("render changed report approval = %q, err %v", approvalStatus, err)
	}
}

func TestDocumentPipelineRetriesRendererFailureAndRejectsInvalidPDF(t *testing.T) {
	t.Run("retry after renderer timeout", func(t *testing.T) {
		pool := canonicalDatabase(t, "gotenberg_document_retry")
		snapshot := documentRenderSnapshot("PRELIMINARY", 1)
		seedDocumentRenderJob(t, pool, "render-preliminary-v1", "document-preliminary", snapshot)
		now := canonicalNow
		renderer := &sequenceDocumentRenderer{
			results: []documentRenderResult{
				{err: context.DeadlineExceeded},
				{artifact: validDocumentArtifact(snapshot)},
			},
		}
		service := documents.NewService(
			pool,
			newMemoryObjectStore(),
			documents.Dependencies{
				Renderer: renderer, Bucket: "generated-documents",
				Clock: func() time.Time { return now }, WorkerID: "document-retry-test",
			},
		)
		processed, err := service.ProcessNext(context.Background())
		if !processed || !errors.Is(err, context.DeadlineExceeded) {
			t.Fatalf("timed-out render = processed %t, err %v", processed, err)
		}
		var status, lastError string
		var attempts int
		if err := pool.QueryRow(context.Background(), `
			SELECT status, attempt_count, last_error
			FROM document_render_jobs WHERE id = 'render-preliminary-v1'
		`).Scan(&status, &attempts, &lastError); err != nil ||
			status != "FAILED" || attempts != 1 ||
			!strings.Contains(lastError, "deadline exceeded") {
			t.Fatalf(
				"failed render state = %q attempts %d error %q, query %v",
				status, attempts, lastError, err,
			)
		}
		now = now.Add(6 * time.Second)
		processed, err = service.ProcessNext(context.Background())
		if err != nil || !processed || renderer.Calls() != 2 {
			t.Fatalf(
				"retried render = processed %t, calls %d, err %v",
				processed, renderer.Calls(), err,
			)
		}
	})

	t.Run("invalid PDF fails closed", func(t *testing.T) {
		pool := canonicalDatabase(t, "gotenberg_document_invalid_pdf")
		snapshot := documentRenderSnapshot("CLOSURE", 2)
		seedDocumentRenderJob(t, pool, "render-closure-v2", "document-closure", snapshot)
		artifact := validDocumentArtifact(snapshot)
		artifact.Body = []byte("not a PDF")
		service := documents.NewService(
			pool,
			newMemoryObjectStore(),
			documents.Dependencies{
				Renderer: scriptedDocumentRenderer{
					render: func(documents.RenderSnapshot) documents.RenderedArtifact {
						return artifact
					},
				},
				Bucket: "generated-documents", Clock: func() time.Time { return canonicalNow },
			},
		)
		processed, err := service.ProcessNext(context.Background())
		if !processed || err == nil || !strings.Contains(err.Error(), "PDF") {
			t.Fatalf("invalid PDF render = processed %t, err %v", processed, err)
		}
		var versions int
		if queryErr := pool.QueryRow(
			context.Background(),
			"SELECT count(*) FROM document_versions WHERE document_id = 'document-closure'",
		).Scan(&versions); queryErr != nil || versions != 0 {
			t.Fatalf("invalid PDF versions = %d, query %v", versions, queryErr)
		}
	})
}

func TestLiveGotenbergMinIODocumentPipeline(t *testing.T) {
	renderer := liveGotenbergRenderer(t, 30*time.Second)
	objects := liveDocumentObjectStore(t)
	if err := objects.EnsurePrivateBuckets(
		context.Background(),
		[]string{"generated-documents"},
		[]string{"http://127.0.0.1:4174"},
	); err != nil {
		t.Fatalf("initialize live generated-document bucket: %v", err)
	}

	for index, kind := range []string{"PRELIMINARY", "FINAL", "CLOSURE"} {
		t.Run(strings.ToLower(kind), func(t *testing.T) {
			version := int64(index + 1)
			pool := canonicalDatabase(
				t,
				fmt.Sprintf("live_gotenberg_%s", strings.ToLower(kind)),
			)
			snapshot := documentRenderSnapshot(kind, version)
			suffix := fmt.Sprintf(
				"%s-%d", strings.ToLower(kind), time.Now().UnixNano(),
			)
			jobID := "live-gotenberg-" + suffix
			documentID := "live-document-" + suffix
			seedDocumentRenderJob(t, pool, jobID, documentID, snapshot)
			service := documents.NewService(
				pool,
				objects,
				documents.Dependencies{
					Renderer: renderer, Bucket: "generated-documents",
					Clock:    func() time.Time { return canonicalNow },
					WorkerID: "live-gotenberg-worker-" + suffix,
				},
			)
			processed, err := service.ProcessNext(context.Background())
			if err != nil || !processed {
				t.Fatalf("process live %s render = %t, err %v", kind, processed, err)
			}
			processed, err = service.ProcessNext(context.Background())
			if err != nil || processed {
				t.Fatalf("duplicate live %s render = %t, err %v", kind, processed, err)
			}

			var documentVersionID, pdfHash, rendererHash, templateHash, sourceHash string
			var versionCount int
			if err := pool.QueryRow(context.Background(), `
				SELECT id, sha256, renderer_hash, template_hash, source_hash,
				       count(*) OVER ()
				FROM document_versions
				WHERE document_id = $1
			`, documentID).Scan(
				&documentVersionID, &pdfHash, &rendererHash, &templateHash,
				&sourceHash, &versionCount,
			); err != nil {
				t.Fatalf("read live %s DocumentVersion: %v", kind, err)
			}
			if versionCount != 1 ||
				rendererHash != os.Getenv("AVIA_TEST_GOTENBERG_RENDERER_HASH") ||
				!strings.HasPrefix(templateHash, "sha256:") ||
				sourceHash != renderSourceHash(t, snapshot) ||
				!strings.HasPrefix(pdfHash, "sha256:") {
				t.Fatalf(
					"live %s provenance = count %d PDF %q renderer %q template %q source %q",
					kind, versionCount, pdfHash, rendererHash, templateHash, sourceHash,
				)
			}
			download, err := service.AuthorizeDownload(
				context.Background(),
				principal(
					"auditee-xyz", "airline-xyz", "session-auditee",
					identity.RoleAuditee,
				),
				documentVersionID,
			)
			if err != nil {
				t.Fatalf("authorize live %s generated Document: %v", kind, err)
			}
			response, err := http.Get(download.URL)
			if err != nil {
				t.Fatalf("download live %s generated Document: %v", kind, err)
			}
			body, readErr := io.ReadAll(response.Body)
			closeErr := response.Body.Close()
			if response.StatusCode != http.StatusOK || readErr != nil ||
				closeErr != nil || !bytes.HasPrefix(body, []byte("%PDF-")) ||
				documentDigest(body) != pdfHash {
				t.Fatalf(
					"live %s download = status %d bytes %d read %v close %v hash %q",
					kind, response.StatusCode, len(body), readErr, closeErr,
					documentDigest(body),
				)
			}
		})
	}
}

func TestLiveGotenbergDocumentPipelineFailsClosedDuringInjectedLoss(t *testing.T) {
	failureMode := os.Getenv("AVIA_TEST_GOTENBERG_FAILURE_MODE")
	if failureMode == "" {
		t.Skip("AVIA_TEST_GOTENBERG_FAILURE_MODE is required for the live renderer-loss gate")
	}
	renderer := liveGotenbergRenderer(t, 250*time.Millisecond)
	pool := canonicalDatabase(t, "live_gotenberg_loss_"+failureMode)
	snapshot := documentRenderSnapshot("FINAL", 1)
	seedDocumentRenderJob(
		t, pool, "live-gotenberg-loss", "live-gotenberg-loss-document", snapshot,
	)
	service := documents.NewService(
		pool,
		newMemoryObjectStore(),
		documents.Dependencies{
			Renderer: renderer, Bucket: "generated-documents",
			Clock: func() time.Time { return canonicalNow },
		},
	)
	processed, err := service.ProcessNext(context.Background())
	if !processed || err == nil {
		t.Fatalf("live Gotenberg %s result = %t, %v", failureMode, processed, err)
	}
	if failureMode == "timeout" && !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("live Gotenberg timeout error = %v", err)
	}
	var status string
	var versions int
	if queryErr := pool.QueryRow(context.Background(), `
		SELECT status,
		       (SELECT count(*) FROM document_versions
		        WHERE document_id = 'live-gotenberg-loss-document')
		FROM document_render_jobs
		WHERE id = 'live-gotenberg-loss'
	`).Scan(&status, &versions); queryErr != nil ||
		status != "FAILED" || versions != 0 {
		t.Fatalf(
			"live Gotenberg loss state = %q versions %d, query %v",
			status, versions, queryErr,
		)
	}
}

func liveGotenbergRenderer(
	t *testing.T,
	timeout time.Duration,
) *documents.GotenbergRenderer {
	t.Helper()
	baseURL := os.Getenv("AVIA_TEST_GOTENBERG_URL")
	rendererHash := os.Getenv("AVIA_TEST_GOTENBERG_RENDERER_HASH")
	if baseURL == "" || rendererHash == "" {
		t.Skip("live Gotenberg URL and renderer hash are required")
	}
	renderer, err := documents.NewGotenbergRenderer(documents.GotenbergConfig{
		BaseURL: baseURL, Timeout: timeout, RendererHash: rendererHash,
	})
	if err != nil {
		t.Fatalf("create live Gotenberg renderer: %v", err)
	}
	return renderer
}

func liveDocumentObjectStore(t *testing.T) *objectstore.MinIOStore {
	t.Helper()
	endpoint := os.Getenv("AVIA_TEST_OBJECT_STORE_ENDPOINT")
	accessKey := os.Getenv("AVIA_TEST_OBJECT_STORE_ACCESS_KEY")
	secretKey := os.Getenv("AVIA_TEST_OBJECT_STORE_SECRET_KEY")
	if endpoint == "" || accessKey == "" || secretKey == "" {
		t.Skip("live document object-store endpoint and credentials are required")
	}
	store, err := objectstore.NewMinIOStore(objectstore.MinIOConfig{
		Endpoint: endpoint, PublicEndpoint: endpoint,
		AccessKey: accessKey, SecretKey: secretKey, Region: "local",
		AllowServerManagedCORS: true,
		Clock:                  func() time.Time { return canonicalNow },
	})
	if err != nil {
		t.Fatalf("create live document object store: %v", err)
	}
	if err := store.Check(context.Background()); err != nil {
		t.Fatalf("live document object-store readiness: %v", err)
	}
	return store
}

type scriptedDocumentRenderer struct {
	render func(documents.RenderSnapshot) documents.RenderedArtifact
}

func (renderer scriptedDocumentRenderer) Render(
	_ context.Context,
	snapshot documents.RenderSnapshot,
) (documents.RenderedArtifact, error) {
	return renderer.render(snapshot), nil
}

type documentRenderResult struct {
	artifact documents.RenderedArtifact
	err      error
}

type sequenceDocumentRenderer struct {
	mu      sync.Mutex
	results []documentRenderResult
	calls   int
}

func (renderer *sequenceDocumentRenderer) Render(
	_ context.Context,
	_ documents.RenderSnapshot,
) (documents.RenderedArtifact, error) {
	renderer.mu.Lock()
	defer renderer.mu.Unlock()
	renderer.calls++
	if len(renderer.results) == 0 {
		return documents.RenderedArtifact{}, errors.New("unexpected renderer call")
	}
	result := renderer.results[0]
	renderer.results = renderer.results[1:]
	return result.artifact, result.err
}

func (renderer *sequenceDocumentRenderer) Calls() int {
	renderer.mu.Lock()
	defer renderer.mu.Unlock()
	return renderer.calls
}

func documentRenderSnapshot(kind string, version int64) documents.RenderSnapshot {
	suffix := strings.ToLower(kind)
	return documents.RenderSnapshot{
		ReportVersionID:  fmt.Sprintf("report-%s-v%d", suffix, version),
		ReportID:         fmt.Sprintf("RPT-%s-2026-001", kind),
		Kind:             kind,
		OrganizationID:   "airline-xyz",
		AuditID:          "audit-cabin-001",
		FindingIDs:       nil,
		ContentHash:      documentDigest([]byte(fmt.Sprintf("%s-v%d", kind, version))),
		Version:          version,
		CreatedBySubject: "executive-001",
	}
}

func seedDocumentRenderJob(
	t *testing.T,
	pool *database.Pool,
	jobID string,
	documentID string,
	snapshot documents.RenderSnapshot,
) {
	t.Helper()
	encoded, err := json.Marshal(snapshot)
	if err != nil {
		t.Fatalf("encode render snapshot: %v", err)
	}
	statements := []struct {
		sql  string
		args []any
	}{
		{
			sql: `
				INSERT INTO report_versions (
					id, report_id, inspection_id, version, status, snapshot, created_at
				) VALUES (
					$1, $2, $3, $4, 'DEPARTMENT_REVIEW',
					jsonb_build_object(
						'kind', $5::text, 'ready', true,
						'findingIds', '[]'::jsonb, 'contentHash', $6::text
					),
					$7
				)
			`,
			args: []any{
				snapshot.ReportVersionID, snapshot.ReportID, snapshot.AuditID,
				snapshot.Version, snapshot.Kind, snapshot.ContentHash, canonicalNow,
			},
		},
		{
			sql: `
				INSERT INTO report_approval_states (
					report_version_id, status, revision, updated_at
				) VALUES ($1, 'DEPARTMENT_REVIEW', 1, $2)
			`,
			args: []any{snapshot.ReportVersionID, canonicalNow},
		},
		{
			sql: `
				INSERT INTO document_records (
					id, organization_id, kind, title, revision
				) VALUES ($1, $2, 'REPORT', $3, 1)
			`,
			args: []any{
				documentID, snapshot.OrganizationID, "Report " + snapshot.ReportID,
			},
		},
		{
			sql: `
				INSERT INTO document_render_jobs (
					id, document_id, organization_id, requested_version, status,
					idempotency_key, input_snapshot, created_at, updated_at
				) VALUES (
					$1, $2, $3, $4, 'PENDING', 'report-render:' || $5, $6, $7, $7
				)
			`,
			args: []any{
				jobID, documentID, snapshot.OrganizationID, snapshot.Version,
				snapshot.ReportVersionID, encoded, canonicalNow,
			},
		},
		{
			sql: `
				INSERT INTO outbox_messages (
					id, topic, aggregate_type, aggregate_id, payload, available_at,
					event_version, idempotency_key, operation_id, correlation_id,
					created_at
				) VALUES (
					$1 || '-outbox', 'document.render_requested', 'report_version',
					$2, jsonb_build_object('renderJobId', $1::text), $3, 1,
					'document.render_requested:' || $2, $1, $1, $3
				)
			`,
			args: []any{jobID, snapshot.ReportVersionID, canonicalNow},
		},
	}
	for _, statement := range statements {
		if _, err := pool.Exec(
			context.Background(), statement.sql, statement.args...,
		); err != nil {
			t.Fatalf("seed document render job: %v", err)
		}
	}
}

func validDocumentArtifact(
	snapshot documents.RenderSnapshot,
) documents.RenderedArtifact {
	body := validPDF(snapshot.ReportVersionID)
	return documents.RenderedArtifact{
		FileName:  fmt.Sprintf("%s-v%d.pdf", snapshot.ReportID, snapshot.Version),
		MediaType: "application/pdf", Body: body,
		RendererHash: integrationRendererHash,
		TemplateHash: integrationTemplateHash,
		SourceHash:   renderSourceHashValue(snapshot),
	}
}

func renderSourceHash(t *testing.T, snapshot documents.RenderSnapshot) string {
	t.Helper()
	return renderSourceHashValue(snapshot)
}

func renderSourceHashValue(snapshot documents.RenderSnapshot) string {
	body, err := json.Marshal(snapshot)
	if err != nil {
		panic(err)
	}
	return documentDigest(body)
}

func documentDigest(body []byte) string {
	sum := sha256.Sum256(body)
	return "sha256:" + hex.EncodeToString(sum[:])
}
