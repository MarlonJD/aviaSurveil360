-- name: ListCommunicationMessages :many
SELECT id, thread_id, organization_id, visibility, sender_subject_id, audience,
       direction, subject, body, idempotency_key, revision, created_at
FROM communication_messages
WHERE organization_id = sqlc.arg(organization_id)
  AND visibility = sqlc.arg(visibility)
  AND (
      sqlc.narg(before_created_at)::timestamptz IS NULL
      OR (created_at, id) < (
          sqlc.narg(before_created_at)::timestamptz,
          sqlc.arg(before_id)::text
      )
  )
ORDER BY created_at DESC, id DESC
LIMIT sqlc.arg(result_limit);

-- name: ListInternalCommunicationMessages :many
SELECT id, thread_id, organization_id, visibility, sender_subject_id, audience,
       direction, subject, body, idempotency_key, revision, created_at
FROM communication_messages
WHERE visibility = 'INTERNAL_CAA'
ORDER BY created_at DESC, id DESC
LIMIT $1;

-- name: GetCommunicationMessage :one
SELECT id, thread_id, organization_id, visibility, sender_subject_id, audience,
       direction, subject, body, idempotency_key, revision, created_at
FROM communication_messages
WHERE id = $1;

-- name: CreateCommunicationThread :one
INSERT INTO communication_threads (
    id, organization_id, visibility, subject, revision
) VALUES ($1, $2, $3, $4, 1)
RETURNING id, organization_id, visibility, subject, revision, created_at, updated_at;

-- name: CreateCommunicationMessage :one
INSERT INTO communication_messages (
    id, thread_id, organization_id, visibility, sender_subject_id, audience,
    direction, subject, body, idempotency_key, revision, created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1, $11)
RETURNING id, thread_id, organization_id, visibility, sender_subject_id, audience,
          direction, subject, body, idempotency_key, revision, created_at;

-- name: CreateCommunicationAttachment :one
INSERT INTO communication_attachments (
    id, message_id, organization_id, object_metadata_id, file_name,
    media_type, size_bytes, sha256, created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, message_id, organization_id, object_metadata_id, file_name,
          media_type, size_bytes, sha256, created_at;

-- name: ListCommunicationAttachments :many
SELECT id, message_id, organization_id, object_metadata_id, file_name,
       media_type, size_bytes, sha256, created_at
FROM communication_attachments
WHERE message_id = $1
ORDER BY id;
