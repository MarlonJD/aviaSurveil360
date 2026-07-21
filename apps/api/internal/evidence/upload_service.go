package evidence

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/idempotency"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/objectstore"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/uploadpolicy"
	"github.com/jackc/pgx/v5"
)

var (
	ErrEvidenceForbidden = errors.New("evidence access forbidden")
	ErrInvalidUpload     = errors.New("invalid evidence upload")
	ErrObjectMismatch    = errors.New("uploaded object does not match declaration")
	ErrEvidenceNotReady  = errors.New("evidence is not ready")
)

const (
	UploadStatePending   = "PENDING"
	UploadStateUploaded  = "UPLOADED"
	ScanStatePending     = "PENDING"
	ScanStateClean       = "CLEAN"
	ScanStateQuarantined = "QUARANTINED"
	ScanStateFailed      = "FAILED"
	ReviewStateNotReady  = "NOT_READY"
	ReviewStatePending   = "PENDING_CAA_REVIEW"
)

type UploadServiceConfig struct {
	QuarantineBucket string
	CanonicalBucket  string
	MaximumByteSize  int64
	InstructionTTL   time.Duration
	Clock            func() time.Time
	IDGenerator      func(string) string
}

type UploadService struct {
	pool             *database.Pool
	objects          objectstore.Store
	quarantineBucket string
	canonicalBucket  string
	maximumByteSize  int64
	instructionTTL   time.Duration
	clock            func() time.Time
	idGenerator      func(string) string
}

func NewUploadService(pool *database.Pool, objects objectstore.Store, config UploadServiceConfig) *UploadService {
	clock := config.Clock
	if clock == nil {
		clock = time.Now
	}
	idGenerator := config.IDGenerator
	if idGenerator == nil {
		idGenerator = uploadRandomID
	}
	return &UploadService{
		pool: pool, objects: objects, quarantineBucket: config.QuarantineBucket,
		canonicalBucket: config.CanonicalBucket, maximumByteSize: config.MaximumByteSize,
		instructionTTL: config.InstructionTTL, clock: clock, idGenerator: idGenerator,
	}
}

type RequiredHeaders struct {
	ContentType string
	SHA256      string
}

func (headers RequiredHeaders) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]string{"Content-Type": headers.ContentType, "x-amz-meta-sha256": headers.SHA256})
}

func (headers *RequiredHeaders) UnmarshalJSON(value []byte) error {
	var decoded map[string]string
	if err := json.Unmarshal(value, &decoded); err != nil {
		return err
	}
	headers.ContentType = decoded["Content-Type"]
	headers.SHA256 = decoded["x-amz-meta-sha256"]
	return nil
}

type BeginUploadInput struct {
	OperationID             string `json:"operationId"`
	CorrelationID           string `json:"correlationId"`
	FindingID               string `json:"findingId"`
	ExpectedFindingRevision int64  `json:"expectedFindingRevision"`
	FileName                string `json:"fileName"`
	DeclaredMediaType       string `json:"declaredMediaType"`
	ByteSize                int64  `json:"byteSize"`
	SHA256                  string `json:"sha256"`
}

type BeginUploadOutput struct {
	UploadID         string          `json:"uploadId"`
	StagingObjectKey string          `json:"stagingObjectKey"`
	UploadURL        string          `json:"uploadUrl"`
	RequiredHeaders  RequiredHeaders `json:"requiredHeaders"`
	ExpiresAt        time.Time       `json:"expiresAt"`
	MaximumByteSize  int64           `json:"maximumByteSize"`
}

func (service *UploadService) Begin(ctx context.Context, actor identity.Principal, input BeginUploadInput) (BeginUploadOutput, error) {
	if !actor.HasRole(identity.RoleAuditee) || actor.SubjectID == "" || actor.OrganizationID == "" {
		return BeginUploadOutput{}, ErrEvidenceForbidden
	}
	if input.OperationID == "" || input.CorrelationID == "" || input.FindingID == "" || input.ExpectedFindingRevision < 1 {
		return BeginUploadOutput{}, fmt.Errorf("%w: command metadata and Finding revision are required", ErrInvalidUpload)
	}
	if err := uploadpolicy.ValidateDeclaration(input.FileName, input.DeclaredMediaType, input.ByteSize, service.maximumByteSize, input.SHA256); err != nil {
		return BeginUploadOutput{}, fmt.Errorf("%w: %v", ErrInvalidUpload, err)
	}
	semanticHash, err := idempotency.SemanticHash(input)
	if err != nil {
		return BeginUploadOutput{}, err
	}
	scope := actor.SubjectID + ":begin_evidence_upload"
	var output BeginUploadOutput
	err = database.WithinTransaction(ctx, service.pool, func(ctx context.Context, transaction pgx.Tx) error {
		replayed, err := loadIdempotent(ctx, transaction, scope, input.OperationID, semanticHash, &output)
		if err != nil || replayed {
			return err
		}
		var organizationID, status string
		var revision int64
		if err := transaction.QueryRow(ctx, `SELECT organization_id, status, revision FROM findings WHERE id = $1 FOR UPDATE`, input.FindingID).Scan(&organizationID, &status, &revision); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrEvidenceForbidden
			}
			return err
		}
		if organizationID != actor.OrganizationID {
			return ErrEvidenceForbidden
		}
		if revision != input.ExpectedFindingRevision || (status != "EVIDENCE_REQUIRED" && status != "EVIDENCE_MORE_INFORMATION_REQUESTED") {
			return fmt.Errorf("%w: Finding is not at an Evidence submission boundary", ErrInvalidUpload)
		}
		now := service.clock().UTC()
		expiresAt := now.Add(service.instructionTTL)
		uploadID := service.idGenerator("upload")
		objectKey := fmt.Sprintf("organizations/%s/evidence/%s/%s", organizationID, input.FindingID, uploadID)
		requiredHeaders := map[string]string{"Content-Type": input.DeclaredMediaType, "x-amz-meta-sha256": input.SHA256}
		instruction, err := service.objects.CreatePutInstruction(ctx, objectstore.PutRequest{
			Bucket: service.quarantineBucket, Key: objectKey, RequiredHeaders: requiredHeaders, ExpiresAt: expiresAt,
		})
		if err != nil {
			return fmt.Errorf("create private Evidence upload instruction: %w", err)
		}
		output = BeginUploadOutput{
			UploadID: uploadID, StagingObjectKey: objectKey, UploadURL: instruction.URL,
			RequiredHeaders: RequiredHeaders{ContentType: input.DeclaredMediaType, SHA256: input.SHA256},
			ExpiresAt:       expiresAt, MaximumByteSize: service.maximumByteSize,
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO upload_sessions (
				id, upload_kind, aggregate_id, organization_id, initiated_by_subject_id, bucket_name,
				staging_object_key, file_name, declared_media_type, declared_size_bytes, declared_sha256,
				expected_aggregate_revision, upload_state, expires_at, created_at
			) VALUES ($1, 'EVIDENCE', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING', $12, $13)
		`, uploadID, input.FindingID, organizationID, actor.SubjectID, service.quarantineBucket, objectKey,
			input.FileName, input.DeclaredMediaType, input.ByteSize, input.SHA256, revision, expiresAt, now); err != nil {
			return fmt.Errorf("record Evidence upload session: %w", err)
		}
		return saveIdempotent(ctx, transaction, scope, input.OperationID, semanticHash, output, now)
	})
	return output, err
}

type CompleteUploadInput struct {
	OperationID   string `json:"operationId"`
	CorrelationID string `json:"correlationId"`
	UploadID      string `json:"uploadId"`
	SHA256        string `json:"sha256"`
	ByteSize      int64  `json:"byteSize"`
}

type CompleteUploadOutput struct {
	EvidenceVersionID string `json:"evidenceVersionId"`
	Version           int64  `json:"version"`
	UploadState       string `json:"uploadState"`
	ScanState         string `json:"scanState"`
	ReviewState       string `json:"reviewState"`
}

func (service *UploadService) Complete(ctx context.Context, actor identity.Principal, input CompleteUploadInput) (CompleteUploadOutput, error) {
	if !actor.HasRole(identity.RoleAuditee) || actor.SubjectID == "" || input.OperationID == "" || input.CorrelationID == "" || input.UploadID == "" {
		return CompleteUploadOutput{}, ErrEvidenceForbidden
	}
	semanticHash, err := idempotency.SemanticHash(input)
	if err != nil {
		return CompleteUploadOutput{}, err
	}
	scope := actor.SubjectID + ":complete_evidence_upload"
	var output CompleteUploadOutput
	err = database.WithinTransaction(ctx, service.pool, func(ctx context.Context, transaction pgx.Tx) error {
		replayed, err := loadIdempotent(ctx, transaction, scope, input.OperationID, semanticHash, &output)
		if err != nil || replayed {
			return err
		}
		var findingID, organizationID, initiatedBy, bucket, key, fileName, mediaType, declaredSHA, uploadState string
		var declaredSize, expectedRevision int64
		var expiresAt time.Time
		if err := transaction.QueryRow(ctx, `
			SELECT aggregate_id, organization_id, initiated_by_subject_id, bucket_name, staging_object_key,
			       file_name, declared_media_type, declared_size_bytes, declared_sha256,
			       expected_aggregate_revision, upload_state, expires_at
			FROM upload_sessions WHERE id = $1 AND upload_kind = 'EVIDENCE' FOR UPDATE
		`, input.UploadID).Scan(&findingID, &organizationID, &initiatedBy, &bucket, &key, &fileName, &mediaType,
			&declaredSize, &declaredSHA, &expectedRevision, &uploadState, &expiresAt); err != nil {
			return ErrEvidenceForbidden
		}
		now := service.clock().UTC()
		if initiatedBy != actor.SubjectID || organizationID != actor.OrganizationID || uploadState != "PENDING" || now.After(expiresAt) {
			return ErrEvidenceForbidden
		}
		if input.SHA256 != declaredSHA || input.ByteSize != declaredSize {
			return ErrObjectMismatch
		}
		reader, info, err := service.objects.Open(ctx, bucket, key)
		if err != nil {
			return fmt.Errorf("%w: %v", ErrObjectMismatch, err)
		}
		defer reader.Close()
		observation, err := uploadpolicy.Observe(reader, service.maximumByteSize)
		if err != nil || info.Size != declaredSize || !uploadpolicy.MatchesDeclaration(observation, mediaType, declaredSHA, declaredSize) {
			return ErrObjectMismatch
		}
		var findingStatus string
		var findingRevision int64
		if err := transaction.QueryRow(ctx, `SELECT status, revision FROM findings WHERE id = $1 AND organization_id = $2 FOR UPDATE`, findingID, organizationID).Scan(&findingStatus, &findingRevision); err != nil {
			return ErrEvidenceForbidden
		}
		if findingRevision != expectedRevision || (findingStatus != "EVIDENCE_REQUIRED" && findingStatus != "EVIDENCE_MORE_INFORMATION_REQUESTED") {
			return fmt.Errorf("%w: Finding changed after upload began", ErrInvalidUpload)
		}
		objectMetadataID := service.idGenerator("object")
		if _, err := transaction.Exec(ctx, `
			INSERT INTO object_metadata (
				id, aggregate_type, aggregate_id, organization_id, bucket_name, object_key, filename,
				declared_media_type, detected_media_type, sha256, size_bytes, scan_status, object_state,
				upload_id, created_at
			) VALUES ($1, 'evidence_upload', $2, $3, $4, $5, $6, $7, $7, $8, $9, 'PENDING', 'QUARANTINED', $10, $11)
		`, objectMetadataID, findingID, organizationID, bucket, key, fileName, mediaType, declaredSHA, declaredSize, input.UploadID, now); err != nil {
			return fmt.Errorf("record quarantined Evidence object: %w", err)
		}
		var evidenceID string
		var version int64
		err = transaction.QueryRow(ctx, `
			SELECT evidence_id, version FROM evidence_versions WHERE finding_id = $1 ORDER BY version DESC LIMIT 1
		`, findingID).Scan(&evidenceID, &version)
		if errors.Is(err, pgx.ErrNoRows) {
			evidenceID = service.idGenerator("evidence")
			version = 0
		} else if err != nil {
			return err
		}
		version++
		evidenceVersionID := service.idGenerator("evidence-version")
		if _, err := transaction.Exec(ctx, `
			INSERT INTO evidence_versions (
				id, evidence_id, finding_id, organization_id, version, object_metadata_id, filename,
				media_type, sha256, size_bytes, status, submitted_by_subject_id, submitted_at, revision
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11, $12, 1)
		`, evidenceVersionID, evidenceID, findingID, organizationID, version, objectMetadataID, fileName,
			mediaType, declaredSHA, declaredSize, actor.SubjectID, now); err != nil {
			return fmt.Errorf("append immutable Evidence version: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO evidence_version_states (
				evidence_version_id, upload_state, scan_state, review_state, revision, updated_at
			) VALUES ($1, 'UPLOADED', 'PENDING', 'NOT_READY', 1, $2)
		`, evidenceVersionID, now); err != nil {
			return fmt.Errorf("record Evidence processing state: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			UPDATE upload_sessions SET upload_state = 'COMPLETED', object_metadata_id = $2, completed_at = $3 WHERE id = $1
		`, input.UploadID, objectMetadataID, now); err != nil {
			return err
		}
		nextFindingRevision := findingRevision + 1
		if _, err := transaction.Exec(ctx, `
			UPDATE findings SET status = 'EVIDENCE_SUBMITTED', next_action = 'Evidence security scan', revision = $2, updated_at = $3 WHERE id = $1
		`, findingID, nextFindingRevision, now); err != nil {
			return err
		}
		output = CompleteUploadOutput{EvidenceVersionID: evidenceVersionID, Version: version, UploadState: UploadStateUploaded, ScanState: ScanStatePending, ReviewState: ReviewStateNotReady}
		responseBody, _ := json.Marshal(output)
		role := string(identity.RoleAuditee)
		if _, err := transaction.Exec(ctx, `
			INSERT INTO audit_events (
				sequence_id, event_id, occurred_at, actor_subject_id, actor_role, organization_id, action,
				entity_type, entity_id, entity_version, before_status, after_status, operation_id,
				correlation_id, request_id, details
			) VALUES (nextval(pg_get_serial_sequence('audit_events', 'sequence_id')), $1, $2, $3, $4, $5,
				'evidence.uploaded', 'evidence_version', $6, 1, 'PENDING', 'UPLOADED', $7, $8, $8, '{}'::jsonb)
		`, service.idGenerator("audit"), now, actor.SubjectID, role, organizationID, evidenceVersionID, input.OperationID, input.CorrelationID); err != nil {
			return fmt.Errorf("append Evidence upload audit: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO authorized_sync_changes (subject_id, organization_id, kind, entity_id, entity_revision, payload, changed_at)
			VALUES ($1, $2, 'evidence_version', $3, 1, $4, $5)
		`, actor.SubjectID, organizationID, evidenceVersionID, responseBody, now); err != nil {
			return err
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO outbox_messages (
				id, topic, aggregate_type, aggregate_id, payload, available_at, event_version, idempotency_key
			) VALUES ($1, 'evidence.scan_requested', 'evidence_version', $2, $3, $4, 1, $5)
		`, service.idGenerator("outbox"), evidenceVersionID, responseBody, now, "evidence.scan_requested:"+evidenceVersionID); err != nil {
			return fmt.Errorf("enqueue Evidence scan: %w", err)
		}
		return saveIdempotent(ctx, transaction, scope, input.OperationID, semanticHash, output, now)
	})
	return output, err
}

type VersionView struct {
	ID             string    `json:"id"`
	FindingID      string    `json:"findingId"`
	OrganizationID string    `json:"organizationId"`
	Version        int64     `json:"version"`
	FileName       string    `json:"fileName"`
	SubmittedAt    time.Time `json:"submittedAt"`
	UploadState    string    `json:"uploadState"`
	ScanState      string    `json:"scanState"`
	ReviewState    string    `json:"reviewState"`
	Revision       int64     `json:"revision"`
}

func (service *UploadService) ListVersions(ctx context.Context, actor identity.Principal, findingID string) ([]VersionView, error) {
	if actor.SubjectID == "" {
		return nil, ErrEvidenceForbidden
	}
	rows, err := service.pool.Query(ctx, `
		SELECT version.id, version.finding_id, version.organization_id, version.version, version.filename,
		       version.submitted_at, state.upload_state, state.scan_state, state.review_state, state.revision
		FROM evidence_versions version
		JOIN evidence_version_states state ON state.evidence_version_id = version.id
		WHERE version.finding_id = $1 ORDER BY version.version
	`, findingID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	views := []VersionView{}
	for rows.Next() {
		var view VersionView
		if err := rows.Scan(&view.ID, &view.FindingID, &view.OrganizationID, &view.Version, &view.FileName,
			&view.SubmittedAt, &view.UploadState, &view.ScanState, &view.ReviewState, &view.Revision); err != nil {
			return nil, err
		}
		if actor.HasRole(identity.RoleAuditee) && !actor.BelongsTo(view.OrganizationID) {
			return nil, ErrEvidenceForbidden
		}
		if !actor.HasRole(identity.RoleAuditee) && !actor.IsCAA() {
			return nil, ErrEvidenceForbidden
		}
		views = append(views, view)
	}
	return views, rows.Err()
}

func (service *UploadService) Download(ctx context.Context, actor identity.Principal, evidenceVersionID string) (objectstore.GetInstruction, error) {
	var organizationID, scanState, bucket, key string
	if err := service.pool.QueryRow(ctx, `
		SELECT version.organization_id, state.scan_state, metadata.bucket_name, metadata.object_key
		FROM evidence_versions version
		JOIN evidence_version_states state ON state.evidence_version_id = version.id
		JOIN object_metadata metadata ON metadata.id = state.canonical_object_metadata_id
		WHERE version.id = $1
	`, evidenceVersionID).Scan(&organizationID, &scanState, &bucket, &key); err != nil {
		return objectstore.GetInstruction{}, ErrEvidenceNotReady
	}
	if scanState != ScanStateClean {
		return objectstore.GetInstruction{}, ErrEvidenceNotReady
	}
	if actor.HasRole(identity.RoleAuditee) {
		if !actor.BelongsTo(organizationID) {
			return objectstore.GetInstruction{}, ErrEvidenceForbidden
		}
	} else if !actor.IsCAA() {
		return objectstore.GetInstruction{}, ErrEvidenceForbidden
	}
	return service.objects.CreateGetInstruction(ctx, objectstore.GetRequest{Bucket: bucket, Key: key, ExpiresAt: service.clock().UTC().Add(5 * time.Minute)})
}

func (service *UploadService) ReconcileExpired(ctx context.Context) (int64, error) {
	result, err := service.pool.Exec(ctx, `
		UPDATE upload_sessions SET upload_state = 'EXPIRED'
		WHERE upload_kind = 'EVIDENCE' AND upload_state = 'PENDING' AND expires_at < $1
	`, service.clock().UTC())
	if err != nil {
		return 0, err
	}
	return result.RowsAffected(), nil
}

func loadIdempotent(ctx context.Context, transaction pgx.Tx, scope, operationID, semanticHash string, output any) (bool, error) {
	if _, err := transaction.Exec(ctx, "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", scope+":"+operationID); err != nil {
		return false, err
	}
	var storedHash string
	var response []byte
	err := transaction.QueryRow(ctx, `SELECT semantic_hash, response_body FROM idempotency_responses WHERE scope = $1 AND operation_id = $2`, scope, operationID).Scan(&storedHash, &response)
	if err == nil {
		if storedHash != semanticHash {
			return false, idempotency.ErrOperationIDReuse
		}
		return true, json.Unmarshal(response, output)
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return false, err
	}
	return false, nil
}

func saveIdempotent(ctx context.Context, transaction pgx.Tx, scope, operationID, semanticHash string, output any, now time.Time) error {
	body, err := json.Marshal(output)
	if err != nil {
		return err
	}
	_, err = transaction.Exec(ctx, `
		INSERT INTO idempotency_responses (scope, operation_id, semantic_hash, response_status, response_headers, response_body, created_at)
		VALUES ($1, $2, $3, 200, '{}'::jsonb, $4, $5)
	`, scope, operationID, semanticHash, body, now)
	return err
}

func uploadRandomID(prefix string) string {
	value := make([]byte, 16)
	if _, err := rand.Read(value); err != nil {
		panic(fmt.Sprintf("generate upload identifier: %v", err))
	}
	return prefix + "-" + hex.EncodeToString(value)
}
