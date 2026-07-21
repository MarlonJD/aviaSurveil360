package evidenceworker

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/objectstore"
	"github.com/jackc/pgx/v5"
)

type ScanResult struct {
	Clean  bool
	Reason string
}

type Scanner interface {
	Scan(context.Context, io.Reader) (ScanResult, error)
}

// SignatureScanner is deterministic and intentionally narrow. It is suitable
// for the local candidate profile; production must provide an approved scanner.
type SignatureScanner struct{}

func (SignatureScanner) Scan(_ context.Context, reader io.Reader) (ScanResult, error) {
	body, err := io.ReadAll(reader)
	if err != nil {
		return ScanResult{}, err
	}
	if bytes.Contains(body, []byte("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) {
		return ScanResult{Clean: false, Reason: "deterministic test signature detected"}, nil
	}
	return ScanResult{Clean: true}, nil
}

type Config struct {
	WorkerID            string
	CanonicalBucket     string
	LeaseDuration       time.Duration
	RetryDelay          time.Duration
	ScanTimeout         time.Duration
	MaximumAttempts     int
	Clock               func() time.Time
	IDGenerator         func(string) string
	AfterExternalEffect func() error
}

type Worker struct {
	pool                *database.Pool
	objects             objectstore.Store
	scanner             Scanner
	workerID            string
	canonicalBucket     string
	leaseDuration       time.Duration
	retryDelay          time.Duration
	scanTimeout         time.Duration
	maximumAttempts     int
	clock               func() time.Time
	idGenerator         func(string) string
	afterExternalEffect func() error
}

func New(pool *database.Pool, objects objectstore.Store, scanner Scanner, config Config) *Worker {
	clock := config.Clock
	if clock == nil {
		clock = time.Now
	}
	leaseDuration := config.LeaseDuration
	if leaseDuration <= 0 {
		leaseDuration = time.Minute
	}
	retryDelay := config.RetryDelay
	if retryDelay <= 0 {
		retryDelay = 5 * time.Second
	}
	scanTimeout := config.ScanTimeout
	if scanTimeout <= 0 {
		scanTimeout = 2 * time.Minute
	}
	maximumAttempts := config.MaximumAttempts
	if maximumAttempts <= 0 {
		maximumAttempts = 3
	}
	return &Worker{
		pool: pool, objects: objects, scanner: scanner, workerID: config.WorkerID,
		canonicalBucket: config.CanonicalBucket, leaseDuration: leaseDuration,
		retryDelay: retryDelay, scanTimeout: scanTimeout, maximumAttempts: maximumAttempts, clock: clock,
		idGenerator: config.IDGenerator, afterExternalEffect: config.AfterExternalEffect,
	}
}

type claim struct {
	ID           string
	Topic        string
	AggregateID  string
	AttemptCount int
}

func (worker *Worker) ProcessNext(ctx context.Context) (bool, error) {
	claimed, ok, err := worker.claimNext(ctx)
	if err != nil || !ok {
		return ok, err
	}
	var processErr error
	switch claimed.Topic {
	case "evidence.scan_requested":
		processErr = worker.processEvidence(ctx, claimed)
	case "inspection_attachment.scan_requested":
		processErr = worker.processAttachment(ctx, claimed)
	default:
		processErr = fmt.Errorf("unsupported scan topic %q", claimed.Topic)
	}
	if processErr != nil {
		var crashWindow afterExternalEffectError
		if errors.As(processErr, &crashWindow) {
			return true, processErr
		}
		if err := worker.recordFailure(ctx, claimed, processErr); err != nil {
			return true, errors.Join(processErr, err)
		}
		return true, processErr
	}
	return true, nil
}

func (worker *Worker) claimNext(ctx context.Context) (claim, bool, error) {
	var claimed claim
	var found bool
	now := worker.clock().UTC()
	err := database.WithinTransaction(ctx, worker.pool, func(ctx context.Context, transaction pgx.Tx) error {
		err := transaction.QueryRow(ctx, `
			SELECT id, topic, aggregate_id, attempt_count
			FROM outbox_messages
			WHERE topic IN ('evidence.scan_requested', 'inspection_attachment.scan_requested')
			  AND delivered_at IS NULL AND terminal_state IS NULL AND available_at <= $1
			  AND (lease_expires_at IS NULL OR lease_expires_at <= $1)
			ORDER BY available_at, created_at, id
			FOR UPDATE SKIP LOCKED LIMIT 1
		`, now).Scan(&claimed.ID, &claimed.Topic, &claimed.AggregateID, &claimed.AttemptCount)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		if err != nil {
			return err
		}
		claimed.AttemptCount++
		found = true
		_, err = transaction.Exec(ctx, `
			UPDATE outbox_messages
			SET lease_owner = $2, lease_expires_at = $3, claimed_at = $1, attempt_count = attempt_count + 1
			WHERE id = $4
		`, now, worker.workerID, now.Add(worker.leaseDuration), claimed.ID)
		return err
	})
	return claimed, found, err
}

type objectRecord struct {
	OrganizationID string
	SubjectID      string
	SourceMetadata string
	SourceBucket   string
	SourceKey      string
	FileName       string
	MediaType      string
	SHA256         string
	Size           int64
	UploadID       *string
}

func (worker *Worker) processEvidence(ctx context.Context, claimed claim) error {
	var record objectRecord
	var currentScan string
	if err := worker.pool.QueryRow(ctx, `
		SELECT version.organization_id, version.submitted_by_subject_id, metadata.id, metadata.bucket_name,
		       metadata.object_key, metadata.filename, metadata.declared_media_type, metadata.sha256,
		       metadata.size_bytes, metadata.upload_id, state.scan_state
		FROM evidence_versions version
		JOIN object_metadata metadata ON metadata.id = version.object_metadata_id
		JOIN evidence_version_states state ON state.evidence_version_id = version.id
		WHERE version.id = $1
	`, claimed.AggregateID).Scan(
		&record.OrganizationID, &record.SubjectID, &record.SourceMetadata, &record.SourceBucket,
		&record.SourceKey, &record.FileName, &record.MediaType, &record.SHA256, &record.Size,
		&record.UploadID, &currentScan,
	); err != nil {
		return fmt.Errorf("load Evidence scan input: %w", err)
	}
	if currentScan == "CLEAN" || currentScan == "QUARANTINED" {
		return worker.markDelivered(ctx, claimed.ID)
	}
	reader, _, err := worker.objects.Open(ctx, record.SourceBucket, record.SourceKey)
	if err != nil {
		return fmt.Errorf("open quarantined Evidence: %w", err)
	}
	result, scanErr := worker.scan(ctx, reader)
	closeErr := reader.Close()
	if scanErr != nil || closeErr != nil {
		return errors.Join(scanErr, closeErr)
	}
	destinationKey := fmt.Sprintf("organizations/%s/canonical-evidence/%s", record.OrganizationID, claimed.AggregateID)
	if result.Clean {
		err := worker.objects.Copy(ctx, objectstore.CopyRequest{
			SourceBucket: record.SourceBucket, SourceKey: record.SourceKey,
			DestinationBucket: worker.canonicalBucket, DestinationKey: destinationKey,
		})
		if err != nil && !errors.Is(err, objectstore.ErrObjectAlreadyExists) {
			return fmt.Errorf("promote clean Evidence object: %w", err)
		}
		if worker.afterExternalEffect != nil {
			if err := worker.afterExternalEffect(); err != nil {
				return afterExternalEffectError{cause: err}
			}
		}
	}
	return worker.finalizeEvidence(ctx, claimed, record, destinationKey, result)
}

type afterExternalEffectError struct {
	cause error
}

func (failure afterExternalEffectError) Error() string { return failure.cause.Error() }
func (failure afterExternalEffectError) Unwrap() error { return failure.cause }

func (worker *Worker) finalizeEvidence(ctx context.Context, claimed claim, record objectRecord, destinationKey string, result ScanResult) error {
	now := worker.clock().UTC()
	return database.WithinTransaction(ctx, worker.pool, func(ctx context.Context, transaction pgx.Tx) error {
		var currentScan, findingID, findingStatus string
		var findingRevision int64
		if err := transaction.QueryRow(ctx, `
			SELECT state.scan_state, version.finding_id, finding.status, finding.revision
			FROM evidence_version_states state
			JOIN evidence_versions version ON version.id = state.evidence_version_id
			JOIN findings finding ON finding.id = version.finding_id
			WHERE state.evidence_version_id = $1
			FOR UPDATE OF state, finding
		`, claimed.AggregateID).Scan(&currentScan, &findingID, &findingStatus, &findingRevision); err != nil {
			return err
		}
		if currentScan == "CLEAN" || currentScan == "QUARANTINED" {
			return markDeliveredTx(ctx, transaction, claimed.ID, worker.workerID, now)
		}
		nextFindingRevision := findingRevision + 1
		if result.Clean {
			canonicalMetadataID := worker.nextID("canonical-object")
			if err := transaction.QueryRow(ctx, `
				INSERT INTO object_metadata (
					id, aggregate_type, aggregate_id, organization_id, bucket_name, object_key, filename,
					declared_media_type, detected_media_type, sha256, size_bytes, scan_status, object_state,
					upload_id, created_at
				) VALUES ($1, 'evidence_version', $2, $3, $4, $5, $6, $7, $7, $8, $9, 'CLEAN', 'CANONICAL', $10, $11)
				ON CONFLICT (object_key) DO UPDATE SET scan_status = 'CLEAN'
				RETURNING id
			`, canonicalMetadataID, claimed.AggregateID, record.OrganizationID, worker.canonicalBucket,
				destinationKey, record.FileName, record.MediaType, record.SHA256, record.Size, record.UploadID, now).Scan(&canonicalMetadataID); err != nil {
				return fmt.Errorf("record canonical Evidence object: %w", err)
			}
			if _, err := transaction.Exec(ctx, `
				UPDATE evidence_version_states SET scan_state = 'CLEAN', review_state = 'PENDING_CAA_REVIEW',
				       canonical_object_metadata_id = $2, scan_reason = NULL, revision = revision + 1, updated_at = $3
				WHERE evidence_version_id = $1
			`, claimed.AggregateID, canonicalMetadataID, now); err != nil {
				return err
			}
			if _, err := transaction.Exec(ctx, `
				UPDATE findings SET status = 'PENDING_CAA_REVIEW', next_action = 'CAA reviews Evidence',
				       revision = $2, updated_at = $3 WHERE id = $1 AND status = 'EVIDENCE_SUBMITTED'
			`, findingID, nextFindingRevision, now); err != nil {
				return err
			}
		} else {
			if _, err := transaction.Exec(ctx, `
				UPDATE evidence_version_states SET scan_state = 'QUARANTINED', review_state = 'NOT_READY',
				       scan_reason = $2, revision = revision + 1, updated_at = $3
				WHERE evidence_version_id = $1
			`, claimed.AggregateID, result.Reason, now); err != nil {
				return err
			}
			if _, err := transaction.Exec(ctx, `
				UPDATE findings SET status = 'EVIDENCE_MORE_INFORMATION_REQUESTED',
				       next_action = 'Auditee submits replacement Evidence', revision = $2, updated_at = $3
				WHERE id = $1 AND status = 'EVIDENCE_SUBMITTED'
			`, findingID, nextFindingRevision, now); err != nil {
				return err
			}
		}
		scanState := "QUARANTINED"
		reviewState := "NOT_READY"
		afterFindingStatus := "EVIDENCE_MORE_INFORMATION_REQUESTED"
		if result.Clean {
			scanState = "CLEAN"
			reviewState = "PENDING_CAA_REVIEW"
			afterFindingStatus = "PENDING_CAA_REVIEW"
		}
		if _, err := transaction.Exec(ctx, `UPDATE object_metadata SET scan_status = $2 WHERE id = $1`, record.SourceMetadata, scanState); err != nil {
			return err
		}
		details, _ := json.Marshal(map[string]string{"scanState": scanState, "reviewState": reviewState})
		operationID := "scan:" + claimed.AggregateID
		if _, err := transaction.Exec(ctx, `
			INSERT INTO audit_events (
				sequence_id, event_id, occurred_at, actor_subject_id, actor_role, organization_id, action,
				entity_type, entity_id, entity_version, before_status, after_status, operation_id,
				correlation_id, request_id, details
			) VALUES (nextval(pg_get_serial_sequence('audit_events', 'sequence_id')), $1, $2, NULL, 'system', $3,
				'evidence.scan_completed', 'evidence_version', $4, 2, 'PENDING', $5, $6, $6, $6, $7)
		`, worker.nextID("worker-audit"), now, record.OrganizationID, claimed.AggregateID, scanState, operationID, details); err != nil {
			return fmt.Errorf("append Evidence scan audit: %w", err)
		}
		projection, _ := json.Marshal(map[string]any{
			"evidenceVersionId": claimed.AggregateID, "scanState": scanState,
			"reviewState": reviewState, "findingStatus": afterFindingStatus,
		})
		if _, err := transaction.Exec(ctx, `
			INSERT INTO authorized_sync_changes (subject_id, organization_id, kind, entity_id, entity_revision, payload, changed_at)
			VALUES ($1, $2, 'evidence_version', $3, 2, $4, $5)
		`, record.SubjectID, record.OrganizationID, claimed.AggregateID, projection, now); err != nil {
			return err
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO outbox_messages (
				id, topic, aggregate_type, aggregate_id, payload, available_at, event_version, idempotency_key
			) VALUES ($1, 'evidence.scan_completed', 'evidence_version', $2, $3, $4, 1, $5)
			ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
		`, worker.nextID("worker-outbox"), claimed.AggregateID, projection, now, "evidence.scan_completed:"+claimed.AggregateID); err != nil {
			return err
		}
		return markDeliveredTx(ctx, transaction, claimed.ID, worker.workerID, now)
	})
}

func (worker *Worker) processAttachment(ctx context.Context, claimed claim) error {
	var record objectRecord
	var scanState string
	if err := worker.pool.QueryRow(ctx, `
		SELECT attachment.organization_id, attachment.created_by_subject_id, metadata.id, metadata.bucket_name,
		       metadata.object_key, metadata.filename, metadata.declared_media_type, metadata.sha256,
		       metadata.size_bytes, metadata.upload_id, attachment.scan_state
		FROM inspection_attachments attachment
		JOIN object_metadata metadata ON metadata.id = attachment.object_metadata_id
		WHERE attachment.id = $1
	`, claimed.AggregateID).Scan(
		&record.OrganizationID, &record.SubjectID, &record.SourceMetadata, &record.SourceBucket,
		&record.SourceKey, &record.FileName, &record.MediaType, &record.SHA256, &record.Size,
		&record.UploadID, &scanState,
	); err != nil {
		return err
	}
	if scanState == "CLEAN" || scanState == "QUARANTINED" {
		return worker.markDelivered(ctx, claimed.ID)
	}
	reader, _, err := worker.objects.Open(ctx, record.SourceBucket, record.SourceKey)
	if err != nil {
		return err
	}
	result, scanErr := worker.scan(ctx, reader)
	closeErr := reader.Close()
	if scanErr != nil || closeErr != nil {
		return errors.Join(scanErr, closeErr)
	}
	destinationKey := fmt.Sprintf("organizations/%s/canonical-inspection-attachments/%s", record.OrganizationID, claimed.AggregateID)
	if result.Clean {
		err := worker.objects.Copy(ctx, objectstore.CopyRequest{
			SourceBucket: record.SourceBucket, SourceKey: record.SourceKey,
			DestinationBucket: worker.canonicalBucket, DestinationKey: destinationKey,
		})
		if err != nil && !errors.Is(err, objectstore.ErrObjectAlreadyExists) {
			return err
		}
	}
	now := worker.clock().UTC()
	return database.WithinTransaction(ctx, worker.pool, func(ctx context.Context, transaction pgx.Tx) error {
		state := "QUARANTINED"
		if result.Clean {
			state = "CLEAN"
		}
		if _, err := transaction.Exec(ctx, `
			UPDATE inspection_attachments SET scan_state = $2, revision = revision + 1, updated_at = $3
			WHERE id = $1 AND scan_state = 'PENDING'
		`, claimed.AggregateID, state, now); err != nil {
			return err
		}
		if _, err := transaction.Exec(ctx, `UPDATE object_metadata SET scan_status = $2 WHERE id = $1`, record.SourceMetadata, state); err != nil {
			return err
		}
		return markDeliveredTx(ctx, transaction, claimed.ID, worker.workerID, now)
	})
}

func (worker *Worker) recordFailure(ctx context.Context, claimed claim, processErr error) error {
	now := worker.clock().UTC()
	if claimed.AttemptCount >= worker.maximumAttempts {
		return database.WithinTransaction(ctx, worker.pool, func(ctx context.Context, transaction pgx.Tx) error {
			if _, err := transaction.Exec(ctx, `
				UPDATE outbox_messages SET terminal_state = 'FAILED', last_error = $2,
				       lease_owner = NULL, lease_expires_at = NULL WHERE id = $1 AND delivered_at IS NULL
			`, claimed.ID, processErr.Error()); err != nil {
				return err
			}
			switch claimed.Topic {
			case "evidence.scan_requested":
				return worker.recordEvidenceTerminalFailure(ctx, transaction, claimed, processErr, now)
			case "inspection_attachment.scan_requested":
				return worker.recordAttachmentTerminalFailure(ctx, transaction, claimed, processErr, now)
			default:
				return nil
			}
		})
	}
	_, err := worker.pool.Exec(ctx, `
		UPDATE outbox_messages SET last_error = $2, available_at = $3,
		       lease_owner = NULL, lease_expires_at = NULL WHERE id = $1 AND delivered_at IS NULL
	`, claimed.ID, processErr.Error(), now.Add(worker.retryDelay))
	return err
}

func (worker *Worker) scan(ctx context.Context, reader io.Reader) (ScanResult, error) {
	scanContext, cancel := context.WithTimeout(ctx, worker.scanTimeout)
	defer cancel()
	return worker.scanner.Scan(scanContext, reader)
}

func (worker *Worker) recordEvidenceTerminalFailure(
	ctx context.Context,
	transaction pgx.Tx,
	claimed claim,
	processErr error,
	now time.Time,
) error {
	var organizationID, subjectID, findingID, metadataID, scanState, findingStatus string
	var stateRevision, findingRevision int64
	if err := transaction.QueryRow(ctx, `
		SELECT version.organization_id, version.submitted_by_subject_id, version.finding_id,
		       metadata.id, state.scan_state, state.revision, finding.status, finding.revision
		FROM evidence_versions version
		JOIN object_metadata metadata ON metadata.id = version.object_metadata_id
		JOIN evidence_version_states state ON state.evidence_version_id = version.id
		JOIN findings finding ON finding.id = version.finding_id
		WHERE version.id = $1 FOR UPDATE OF state, finding, metadata
	`, claimed.AggregateID).Scan(
		&organizationID, &subjectID, &findingID, &metadataID, &scanState, &stateRevision,
		&findingStatus, &findingRevision,
	); err != nil {
		return err
	}
	if scanState != "PENDING" {
		return nil
	}
	if _, err := transaction.Exec(ctx, `
		UPDATE evidence_version_states SET scan_state = 'FAILED', review_state = 'NOT_READY',
		       scan_reason = $2, revision = revision + 1, updated_at = $3
		WHERE evidence_version_id = $1 AND scan_state = 'PENDING'
	`, claimed.AggregateID, processErr.Error(), now); err != nil {
		return err
	}
	if _, err := transaction.Exec(ctx, `UPDATE object_metadata SET scan_status = 'FAILED' WHERE id = $1`, metadataID); err != nil {
		return err
	}
	if findingStatus == "EVIDENCE_SUBMITTED" {
		findingStatus = "EVIDENCE_MORE_INFORMATION_REQUESTED"
		findingRevision++
		if _, err := transaction.Exec(ctx, `
			UPDATE findings SET status = $2, next_action = 'Auditee submits replacement Evidence',
			       revision = $3, updated_at = $4 WHERE id = $1
		`, findingID, findingStatus, findingRevision, now); err != nil {
			return err
		}
	}
	details, _ := json.Marshal(map[string]string{"scanState": "FAILED", "reviewState": "NOT_READY", "reason": processErr.Error()})
	operationID := "scan:" + claimed.AggregateID
	if _, err := transaction.Exec(ctx, `
		INSERT INTO audit_events (
			sequence_id, event_id, occurred_at, actor_subject_id, actor_role, organization_id, action,
			entity_type, entity_id, entity_version, before_status, after_status, operation_id,
			correlation_id, request_id, details
		) VALUES (nextval(pg_get_serial_sequence('audit_events', 'sequence_id')), $1, $2, NULL, 'system', $3,
			'evidence.scan_failed', 'evidence_version', $4, $5, 'PENDING', 'FAILED', $6, $6, $6, $7)
	`, worker.nextID("worker-audit"), now, organizationID, claimed.AggregateID, stateRevision+1, operationID, details); err != nil {
		return err
	}
	projection, _ := json.Marshal(map[string]any{
		"evidenceVersionId": claimed.AggregateID, "scanState": "FAILED", "reviewState": "NOT_READY",
		"findingStatus": findingStatus, "reason": processErr.Error(),
	})
	if _, err := transaction.Exec(ctx, `
		INSERT INTO authorized_sync_changes (subject_id, organization_id, kind, entity_id, entity_revision, payload, changed_at)
		VALUES ($1, $2, 'evidence_version', $3, $4, $5, $6)
	`, subjectID, organizationID, claimed.AggregateID, stateRevision+1, projection, now); err != nil {
		return err
	}
	_, err := transaction.Exec(ctx, `
		INSERT INTO outbox_messages (
			id, topic, aggregate_type, aggregate_id, payload, available_at, event_version, idempotency_key, terminal_state
		) VALUES ($1, 'evidence.scan_failed', 'evidence_version', $2, $3, $4, 1, $5, 'RECORDED')
		ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING
	`, worker.nextID("worker-outbox"), claimed.AggregateID, projection, now, "evidence.scan_failed:"+claimed.AggregateID)
	return err
}

func (worker *Worker) recordAttachmentTerminalFailure(
	ctx context.Context,
	transaction pgx.Tx,
	claimed claim,
	processErr error,
	now time.Time,
) error {
	var organizationID, subjectID, metadataID, scanState string
	var revision int64
	if err := transaction.QueryRow(ctx, `
		SELECT attachment.organization_id, attachment.created_by_subject_id, metadata.id,
		       attachment.scan_state, attachment.revision
		FROM inspection_attachments attachment
		JOIN object_metadata metadata ON metadata.id = attachment.object_metadata_id
		WHERE attachment.id = $1 FOR UPDATE OF attachment, metadata
	`, claimed.AggregateID).Scan(&organizationID, &subjectID, &metadataID, &scanState, &revision); err != nil {
		return err
	}
	if scanState != "PENDING" {
		return nil
	}
	if _, err := transaction.Exec(ctx, `
		UPDATE inspection_attachments SET scan_state = 'FAILED', revision = revision + 1, updated_at = $2
		WHERE id = $1 AND scan_state = 'PENDING'
	`, claimed.AggregateID, now); err != nil {
		return err
	}
	if _, err := transaction.Exec(ctx, `UPDATE object_metadata SET scan_status = 'FAILED' WHERE id = $1`, metadataID); err != nil {
		return err
	}
	details, _ := json.Marshal(map[string]string{"scanState": "FAILED", "reason": processErr.Error()})
	operationID := "scan:" + claimed.AggregateID
	if _, err := transaction.Exec(ctx, `
		INSERT INTO audit_events (
			sequence_id, event_id, occurred_at, actor_subject_id, actor_role, organization_id, action,
			entity_type, entity_id, entity_version, before_status, after_status, operation_id,
			correlation_id, request_id, details
		) VALUES (nextval(pg_get_serial_sequence('audit_events', 'sequence_id')), $1, $2, NULL, 'system', $3,
			'inspection_attachment.scan_failed', 'inspection_attachment', $4, $5, 'PENDING', 'FAILED', $6, $6, $6, $7)
	`, worker.nextID("worker-audit"), now, organizationID, claimed.AggregateID, revision+1, operationID, details); err != nil {
		return err
	}
	projection, _ := json.Marshal(map[string]any{
		"inspectionAttachmentId": claimed.AggregateID, "scanState": "FAILED", "reason": processErr.Error(),
	})
	_, err := transaction.Exec(ctx, `
		INSERT INTO authorized_sync_changes (subject_id, organization_id, kind, entity_id, entity_revision, payload, changed_at)
		VALUES ($1, $2, 'inspection_attachment', $3, $4, $5, $6)
	`, subjectID, organizationID, claimed.AggregateID, revision+1, projection, now)
	return err
}

func (worker *Worker) markDelivered(ctx context.Context, outboxID string) error {
	now := worker.clock().UTC()
	_, err := worker.pool.Exec(ctx, `
		UPDATE outbox_messages SET delivered_at = $2, lease_owner = NULL, lease_expires_at = NULL
		WHERE id = $1 AND delivered_at IS NULL
	`, outboxID, now)
	return err
}

func markDeliveredTx(ctx context.Context, transaction pgx.Tx, outboxID, workerID string, now time.Time) error {
	result, err := transaction.Exec(ctx, `
		UPDATE outbox_messages SET delivered_at = $3, lease_owner = NULL, lease_expires_at = NULL
		WHERE id = $1 AND delivered_at IS NULL AND lease_owner = $2
	`, outboxID, workerID, now)
	if err != nil {
		return err
	}
	if result.RowsAffected() != 1 {
		return errors.New("scan outbox lease was lost")
	}
	return nil
}

func (worker *Worker) nextID(prefix string) string {
	if worker.idGenerator == nil {
		return fmt.Sprintf("%s-%d", prefix, worker.clock().UTC().UnixNano())
	}
	return worker.idGenerator(prefix)
}
