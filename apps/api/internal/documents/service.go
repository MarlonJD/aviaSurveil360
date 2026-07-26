package documents

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/objectstore"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/telemetry"
	"github.com/jackc/pgx/v5"
)

type Dependencies struct {
	Renderer            Renderer
	Bucket              string
	Clock               func() time.Time
	WorkerID            string
	AfterExternalEffect func() error
}

type Service struct {
	pool                *database.Pool
	objects             objectstore.Store
	renderer            Renderer
	bucket              string
	clock               func() time.Time
	workerID            string
	afterExternalEffect func() error
}

func NewService(pool *database.Pool, objects objectstore.Store, dependencies Dependencies) *Service {
	clock := dependencies.Clock
	if clock == nil {
		clock = time.Now
	}
	workerID := strings.TrimSpace(dependencies.WorkerID)
	if workerID == "" {
		workerID = "document-worker"
	}
	return &Service{
		pool: pool, objects: objects, renderer: dependencies.Renderer,
		bucket: dependencies.Bucket, clock: clock, workerID: workerID,
		afterExternalEffect: dependencies.AfterExternalEffect,
	}
}

type claimedJob struct {
	OutboxID       string
	JobID          string
	DocumentID     string
	OrganizationID string
	Version        int64
	AttemptCount   int
	Snapshot       RenderSnapshot
	TraceParent    string
	CorrelationID  string
	AvailableAt    time.Time
}

func (service *Service) ProcessNext(
	ctx context.Context,
) (processed bool, resultErr error) {
	if service.pool == nil || service.objects == nil || service.renderer == nil ||
		strings.TrimSpace(service.bucket) == "" {
		return false, fmt.Errorf("%w: document renderer dependencies are incomplete", ErrNotReady)
	}
	claimed, found, err := service.claimNext(ctx)
	if err != nil || !found {
		return found, err
	}
	jobContext, span := telemetry.StartPersistedJob(
		ctx,
		claimed.TraceParent,
		claimed.CorrelationID,
		"document",
		"gotenberg",
	)
	telemetry.RecordPersistedOutboxReadyAge(
		jobContext,
		"document",
		"document",
		claimed.AvailableAt,
		service.clock().UTC(),
	)
	defer func() {
		telemetry.FinishPersistedJob(
			jobContext,
			span,
			"document",
			"gotenberg",
			resultErr,
		)
	}()
	artifact, err := service.renderer.Render(jobContext, claimed.Snapshot)
	if err != nil {
		return true, service.recordFailure(jobContext, claimed, err)
	}
	if err := validateRenderedArtifact(claimed.Snapshot, artifact); err != nil {
		return true, service.recordFailure(jobContext, claimed, err)
	}
	digest := sha256.Sum256(artifact.Body)
	hash := "sha256:" + hex.EncodeToString(digest[:])
	key := fmt.Sprintf(
		"organizations/%s/documents/%s/version-%d.pdf",
		claimed.OrganizationID, claimed.JobID, claimed.Version,
	)
	_, writeErr := service.objects.Write(jobContext, objectstore.WriteRequest{
		Bucket: service.bucket, Key: key, ContentType: artifact.MediaType,
		Size: int64(len(artifact.Body)), Metadata: map[string]string{
			"sha256":          hash,
			"renderer-sha256": artifact.RendererHash,
			"template-sha256": artifact.TemplateHash,
			"source-sha256":   artifact.SourceHash,
		},
		Body: bytes.NewReader(artifact.Body),
	})
	if writeErr != nil && !errors.Is(writeErr, objectstore.ErrObjectAlreadyExists) {
		return true, service.recordFailure(jobContext, claimed, writeErr)
	}
	if writeErr != nil {
		reader, info, openErr := service.objects.Open(jobContext, service.bucket, key)
		if openErr != nil {
			return true, service.recordFailure(jobContext, claimed, openErr)
		}
		existing, readErr := io.ReadAll(io.LimitReader(
			reader, int64(len(artifact.Body))+1,
		))
		closeErr := reader.Close()
		if readErr != nil || closeErr != nil ||
			info.Size != int64(len(artifact.Body)) ||
			info.ContentType != artifact.MediaType ||
			!bytes.Equal(existing, artifact.Body) ||
			info.Metadata["sha256"] != hash ||
			info.Metadata["renderer-sha256"] != artifact.RendererHash ||
			info.Metadata["template-sha256"] != artifact.TemplateHash ||
			info.Metadata["source-sha256"] != artifact.SourceHash {
			return true, service.recordFailure(
				jobContext,
				claimed,
				errors.Join(
					readErr,
					closeErr,
					errors.New("existing rendered object does not match the immutable output"),
				),
			)
		}
	} else if service.afterExternalEffect != nil {
		if err := service.afterExternalEffect(); err != nil {
			return true, err
		}
	}
	if err := service.finalize(jobContext, claimed, artifact, key, hash); err != nil {
		return true, err
	}
	return true, nil
}

func (service *Service) claimNext(ctx context.Context) (claimedJob, bool, error) {
	var claimed claimedJob
	var encoded []byte
	var found bool
	now := service.clock().UTC()
	err := database.WithinTransaction(ctx, service.pool, func(ctx context.Context, transaction pgx.Tx) error {
		err := transaction.QueryRow(ctx, `
			SELECT outbox.id, job.id, job.document_id, job.organization_id,
			       job.requested_version, job.attempt_count, job.input_snapshot,
			       COALESCE(outbox.traceparent, ''),
			       COALESCE(outbox.correlation_id, ''),
			       outbox.available_at
			FROM outbox_messages outbox
			JOIN document_render_jobs job
			  ON job.idempotency_key = 'report-render:' || outbox.aggregate_id
			WHERE outbox.topic = 'document.render_requested'
			  AND outbox.delivered_at IS NULL
			  AND outbox.terminal_state IS NULL
			  AND outbox.available_at <= $1
			  AND (outbox.lease_expires_at IS NULL OR outbox.lease_expires_at <= $1)
			  AND job.status IN ('PENDING', 'RUNNING', 'FAILED')
			ORDER BY outbox.available_at, outbox.created_at, outbox.id
			FOR UPDATE OF outbox, job SKIP LOCKED
			LIMIT 1
		`, now).Scan(
			&claimed.OutboxID, &claimed.JobID, &claimed.DocumentID,
			&claimed.OrganizationID, &claimed.Version, &claimed.AttemptCount, &encoded,
			&claimed.TraceParent,
			&claimed.CorrelationID,
			&claimed.AvailableAt,
		)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		if err != nil {
			return fmt.Errorf("claim document render job: %w", err)
		}
		if err := json.Unmarshal(encoded, &claimed.Snapshot); err != nil {
			return fmt.Errorf("decode document render snapshot: %w", err)
		}
		claimed.AttemptCount++
		found = true
		if _, err := transaction.Exec(ctx, `
			UPDATE outbox_messages
			SET lease_owner = $2, lease_expires_at = $3, claimed_at = $1,
			    attempt_count = attempt_count + 1
			WHERE id = $4
		`, now, service.workerID, now.Add(time.Minute), claimed.OutboxID); err != nil {
			return err
		}
		_, err = transaction.Exec(ctx, `
			UPDATE document_render_jobs
			SET status = 'RUNNING', attempt_count = $2, last_error = NULL, updated_at = $3
			WHERE id = $1
		`, claimed.JobID, claimed.AttemptCount, now)
		return err
	})
	return claimed, found, err
}

func (service *Service) finalize(
	ctx context.Context,
	claimed claimedJob,
	artifact RenderedArtifact,
	key string,
	hash string,
) error {
	now := service.clock().UTC()
	documentVersionID := claimed.JobID + "-version"
	objectMetadataID := claimed.JobID + "-object"
	return database.WithinTransaction(ctx, service.pool, func(ctx context.Context, transaction pgx.Tx) error {
		var status string
		var outputID *string
		err := transaction.QueryRow(ctx, `
			SELECT status, output_document_version_id
			FROM document_render_jobs WHERE id = $1 FOR UPDATE
		`, claimed.JobID).Scan(&status, &outputID)
		if errors.Is(err, pgx.ErrNoRows) {
			// The canonical test reset may remove a claimed test-only job.
			// Production workflows never delete render jobs.
			return nil
		}
		if err != nil {
			return err
		}
		if status == string(JobSucceeded) {
			return service.markDelivered(ctx, transaction, claimed.OutboxID, now)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO object_metadata (
				id, aggregate_type, aggregate_id, organization_id, bucket_name,
				object_key, filename, declared_media_type, detected_media_type,
				sha256, size_bytes, scan_status, object_state, created_at
			) VALUES (
				$1, 'document_version', $2, $3, $4, $5, $6, $7, $7,
				$8, $9, 'CLEAN', 'CANONICAL', $10
			)
			ON CONFLICT (object_key) DO NOTHING
		`, objectMetadataID, documentVersionID, claimed.OrganizationID,
			service.bucket, key, artifact.FileName, artifact.MediaType, hash,
			len(artifact.Body), now); err != nil {
			return fmt.Errorf("record rendered private object: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO document_versions (
				id, document_id, organization_id, version, visibility, status,
				file_name, media_type, sha256, size_bytes, object_metadata_id,
				created_by_subject_id, created_at, renderer_hash, template_hash,
				source_hash
			) VALUES (
				$1, $2, $3, $4, 'AUDITEE_VISIBLE', 'RELEASED',
				$5, $6, $7, $8, $9, $10, $11, $12, $13, $14
			)
			ON CONFLICT (document_id, version) DO NOTHING
		`, documentVersionID, claimed.DocumentID, claimed.OrganizationID,
			claimed.Version, artifact.FileName, artifact.MediaType, hash,
			len(artifact.Body), objectMetadataID, claimed.Snapshot.CreatedBySubject, now,
			artifact.RendererHash, artifact.TemplateHash, artifact.SourceHash); err != nil {
			return fmt.Errorf("append immutable DocumentVersion: %w", err)
		}
		result, err := transaction.Exec(ctx, `
			UPDATE document_render_jobs
			SET status = 'SUCCEEDED', output_document_version_id = $2,
			    last_error = NULL, updated_at = $3
			WHERE id = $1 AND status = 'RUNNING'
		`, claimed.JobID, documentVersionID, now)
		if err != nil {
			return err
		}
		if result.RowsAffected() != 1 {
			return errors.New("document render job state changed before completion")
		}
		operationID := "render:" + claimed.JobID
		if _, err := transaction.Exec(ctx, `
			INSERT INTO audit_events (
				event_id, occurred_at, actor_subject_id, actor_role, organization_id,
				action, entity_type, entity_id, entity_version, before_status,
				after_status, operation_id, correlation_id, request_id, details
			) VALUES (
				$1, $2, $3, 'system', $4, 'document.render_completed',
				'document_version', $5, $6, 'PENDING', 'RELEASED',
				$7, $7, $7, jsonb_build_object(
					'sha256', $8::text,
					'rendererHash', $9::text,
					'templateHash', $10::text,
					'sourceHash', $11::text,
					'reportVersionId', $12::text
				)
			)
			ON CONFLICT (event_id) DO NOTHING
		`, claimed.JobID+"-audit", now, claimed.Snapshot.CreatedBySubject,
			claimed.OrganizationID, documentVersionID, claimed.Version,
			operationID, hash, artifact.RendererHash, artifact.TemplateHash,
			artifact.SourceHash, claimed.Snapshot.ReportVersionID); err != nil {
			return fmt.Errorf("append document render audit: %w", err)
		}
		projection, err := json.Marshal(map[string]any{
			"documentVersionId": documentVersionID, "documentId": claimed.DocumentID,
			"version": claimed.Version, "sha256": hash, "status": "RELEASED",
			"rendererHash":    artifact.RendererHash,
			"templateHash":    artifact.TemplateHash,
			"sourceHash":      artifact.SourceHash,
			"reportVersionId": claimed.Snapshot.ReportVersionID,
		})
		if err != nil {
			return err
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO authorized_sync_changes (
				subject_id, organization_id, kind, entity_id, entity_revision,
				payload, changed_at, operation_id, correlation_id
			) VALUES ($1, $2, 'document_version', $3, $4, $5, $6, $7, $7)
		`, claimed.Snapshot.CreatedBySubject, claimed.OrganizationID,
			documentVersionID, claimed.Version, projection, now, operationID); err != nil {
			return fmt.Errorf("append document render change: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO outbox_messages (
				id, topic, aggregate_type, aggregate_id, payload, available_at,
				event_version, idempotency_key, operation_id, correlation_id
			) VALUES (
				$1, 'document.render_completed', 'document_version', $2, $3, $4,
				1, $5, $6, $6
			)
			ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
		`, claimed.JobID+"-completed-outbox", documentVersionID, projection, now,
			"document.render_completed:"+claimed.JobID, operationID); err != nil {
			return fmt.Errorf("enqueue document render completion: %w", err)
		}
		return service.markDelivered(ctx, transaction, claimed.OutboxID, now)
	})
}

func validateRenderedArtifact(
	snapshot RenderSnapshot,
	artifact RenderedArtifact,
) error {
	if strings.TrimSpace(artifact.FileName) == "" ||
		strings.ContainsAny(artifact.FileName, `/\`) ||
		!strings.HasSuffix(strings.ToLower(artifact.FileName), ".pdf") {
		return fmt.Errorf("rendered PDF filename is invalid")
	}
	if artifact.MediaType != "application/pdf" ||
		len(artifact.Body) < len("%PDF-") ||
		!bytes.Equal(artifact.Body[:len("%PDF-")], []byte("%PDF-")) {
		return fmt.Errorf("renderer did not return a PDF artifact")
	}
	if len(artifact.Body) > maximumPDFResponseSize {
		return fmt.Errorf("rendered PDF exceeds %d bytes", maximumPDFResponseSize)
	}
	if !validSHA256(artifact.RendererHash) ||
		!validSHA256(artifact.TemplateHash) ||
		!validSHA256(artifact.SourceHash) {
		return fmt.Errorf("complete renderer, template, and source sha256 provenance is required")
	}
	source, err := json.Marshal(snapshot)
	if err != nil {
		return fmt.Errorf("encode immutable render source: %w", err)
	}
	if artifact.SourceHash != digest(source) {
		return fmt.Errorf("rendered source sha256 does not match the immutable snapshot")
	}
	return nil
}

func (service *Service) recordFailure(ctx context.Context, claimed claimedJob, cause error) error {
	now := service.clock().UTC()
	_, err := service.pool.Exec(ctx, `
		UPDATE document_render_jobs
		SET status = 'FAILED', attempt_count = $2, last_error = $3, updated_at = $4
		WHERE id = $1
	`, claimed.JobID, claimed.AttemptCount, cause.Error(), now)
	if err != nil {
		return errors.Join(cause, err)
	}
	_, err = service.pool.Exec(ctx, `
		UPDATE outbox_messages
		SET last_error = $2, available_at = $3, lease_owner = NULL, lease_expires_at = NULL
		WHERE id = $1
	`, claimed.OutboxID, cause.Error(), now.Add(5*time.Second))
	return errors.Join(cause, err)
}

func (service *Service) markDelivered(
	ctx context.Context,
	transaction pgx.Tx,
	outboxID string,
	now time.Time,
) error {
	result, err := transaction.Exec(ctx, `
		UPDATE outbox_messages
		SET delivered_at = $3, lease_owner = NULL, lease_expires_at = NULL
		WHERE id = $1 AND delivered_at IS NULL AND lease_owner = $2
	`, outboxID, service.workerID, now)
	if err != nil {
		return err
	}
	if result.RowsAffected() != 1 {
		return errors.New("document render outbox lease was lost")
	}
	return nil
}

func (service *Service) AuthorizeDownload(
	ctx context.Context,
	actor identity.Principal,
	documentVersionID string,
) (Download, error) {
	var organizationID, visibility, status, fileName, mediaType, hash, kind string
	var size int64
	var bucket, key, objectState, scanStatus *string
	var sourceSnapshot []byte
	err := service.pool.QueryRow(ctx, `
		SELECT version.organization_id, version.visibility, version.status,
		       version.file_name, version.media_type, version.sha256, version.size_bytes,
		       record.kind, metadata.bucket_name, metadata.object_key,
		       metadata.object_state, metadata.scan_status, job.input_snapshot
		FROM document_versions version
		JOIN document_records record ON record.id = version.document_id
		LEFT JOIN object_metadata metadata ON metadata.id = version.object_metadata_id
		LEFT JOIN document_render_jobs job
		  ON job.output_document_version_id = version.id
		WHERE version.id = $1
	`, documentVersionID).Scan(
		&organizationID, &visibility, &status, &fileName, &mediaType, &hash, &size,
		&kind, &bucket, &key, &objectState, &scanStatus, &sourceSnapshot,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Download{}, ErrNotFound
	}
	if err != nil {
		return Download{}, err
	}
	if actor.HasRole(identity.RoleAuditee) {
		if actor.OrganizationID != organizationID ||
			visibility != "AUDITEE_VISIBLE" || status != "RELEASED" {
			return Download{}, ErrForbidden
		}
		if kind == "REPORT" {
			var snapshot RenderSnapshot
			if len(sourceSnapshot) == 0 || json.Unmarshal(sourceSnapshot, &snapshot) != nil ||
				snapshot.OrganizationID != organizationID ||
				snapshot.AuditID == "" {
				return Download{}, ErrForbidden
			}
			if len(snapshot.FindingIDs) > 0 {
				var authorizedFindingCount int
				if err := service.pool.QueryRow(ctx, `
					SELECT count(*)
					FROM findings
					WHERE id = ANY($1::text[])
					  AND organization_id = $2
					  AND inspection_id = $3
				`, snapshot.FindingIDs, organizationID, snapshot.AuditID).Scan(&authorizedFindingCount); err != nil {
					return Download{}, err
				}
				if authorizedFindingCount != len(snapshot.FindingIDs) {
					return Download{}, ErrForbidden
				}
			}
		}
	} else if !actor.IsCAA() {
		return Download{}, ErrForbidden
	}
	if bucket == nil || key == nil || objectState == nil || scanStatus == nil ||
		*objectState != "CANONICAL" || *scanStatus != "CLEAN" {
		return Download{}, ErrNotReady
	}
	expiresAt := service.clock().UTC().Add(5 * time.Minute)
	instruction, err := service.objects.CreateGetInstruction(ctx, objectstore.GetRequest{
		Bucket: *bucket, Key: *key, DownloadFileName: fileName,
		ExpiresAt: expiresAt,
	})
	if err != nil {
		return Download{}, err
	}
	return Download{
		DocumentVersionID: documentVersionID, FileName: fileName,
		MediaType: mediaType, SHA256: hash, SizeBytes: size,
		URL: instruction.URL, ExpiresAt: instruction.ExpiresAt,
	}, nil
}
