-- name: ListDocumentVersions :many
SELECT id, document_id, organization_id, version, visibility, status, file_name,
       media_type, sha256, size_bytes, object_metadata_id, created_by_subject_id,
       created_at
FROM document_versions
WHERE organization_id = sqlc.arg(organization_id)
  AND visibility = sqlc.arg(visibility)
ORDER BY created_at DESC, id DESC
LIMIT sqlc.arg(result_limit);

-- name: GetDocumentVersion :one
SELECT id, document_id, organization_id, version, visibility, status, file_name,
       media_type, sha256, size_bytes, object_metadata_id, created_by_subject_id,
       created_at
FROM document_versions
WHERE id = $1;

-- name: CreateDocumentRecord :one
INSERT INTO document_records (
    id, organization_id, kind, title, revision
) VALUES ($1, $2, $3, $4, 1)
RETURNING id, organization_id, kind, title, revision, created_at, updated_at;

-- name: CreateDocumentVersion :one
INSERT INTO document_versions (
    id, document_id, organization_id, version, visibility, status, file_name,
    media_type, sha256, size_bytes, object_metadata_id, created_by_subject_id,
    created_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
)
RETURNING id, document_id, organization_id, version, visibility, status, file_name,
          media_type, sha256, size_bytes, object_metadata_id, created_by_subject_id,
          created_at;

-- name: CreateDocumentRenderJob :one
INSERT INTO document_render_jobs (
    id, document_id, organization_id, requested_version, status,
    idempotency_key, input_snapshot
) VALUES ($1, $2, $3, $4, 'PENDING', $5, $6)
RETURNING id, document_id, organization_id, requested_version, status,
          idempotency_key, input_snapshot, output_document_version_id,
          attempt_count, last_error, created_at, updated_at;

-- name: GetDocumentRenderJob :one
SELECT id, document_id, organization_id, requested_version, status,
       idempotency_key, input_snapshot, output_document_version_id,
       attempt_count, last_error, created_at, updated_at
FROM document_render_jobs
WHERE id = $1;

-- name: UpdateDocumentRenderJob :one
UPDATE document_render_jobs
SET status = $2,
    output_document_version_id = $3,
    attempt_count = $4,
    last_error = $5,
    updated_at = $6
WHERE id = $1
RETURNING id, document_id, organization_id, requested_version, status,
          idempotency_key, input_snapshot, output_document_version_id,
          attempt_count, last_error, created_at, updated_at;
