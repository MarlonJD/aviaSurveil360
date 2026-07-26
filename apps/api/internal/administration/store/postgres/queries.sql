-- name: ListRegulatoryReferenceVersions :many
SELECT id, reference_id, version, title, status, effective_date, snapshot, created_at
FROM regulatory_reference_versions
WHERE (sqlc.arg(status_filter)::text = '' OR status = sqlc.arg(status_filter)::text)
ORDER BY effective_date DESC, reference_id, version DESC
LIMIT sqlc.arg(result_limit);

-- name: CreateRegulatoryReferenceVersion :one
INSERT INTO regulatory_reference_versions (
    id, reference_id, version, title, status, effective_date, snapshot
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, reference_id, version, title, status, effective_date, snapshot, created_at;

-- name: ListQuestionVersions :many
SELECT id, question_id, version, prompt, configured_reference,
       expected_evidence, created_by_subject_id, created_at
FROM question_versions
ORDER BY question_id, version DESC
LIMIT $1;

-- name: CreateQuestionVersion :one
INSERT INTO question_versions (
    id, question_id, version, prompt, configured_reference,
    expected_evidence, created_by_subject_id
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, question_id, version, prompt, configured_reference,
          expected_evidence, created_by_subject_id, created_at;

-- name: ListTemplateMasters :many
SELECT id, title, owner_role, published_template_version_id, revision,
       created_at, updated_at
FROM template_masters
WHERE tombstoned_at IS NULL
ORDER BY title, id
LIMIT $1;

-- name: GetTemplateMaster :one
SELECT id, title, owner_role, published_template_version_id, revision,
       created_at, updated_at
FROM template_masters
WHERE id = $1 AND tombstoned_at IS NULL;

-- name: CreateTemplateMaster :one
INSERT INTO template_masters (
    id, title, owner_role, published_template_version_id, revision
) VALUES ($1, $2, $3, $4, 1)
RETURNING id, title, owner_role, published_template_version_id, revision,
          created_at, updated_at;

-- name: AddTemplateVersionQuestion :one
INSERT INTO template_version_questions (
    template_version_id, question_version_id, position
) VALUES ($1, $2, $3)
RETURNING template_version_id, question_version_id, position, created_at;

-- name: ListReportDefinitionVersions :many
SELECT id, definition_id, version, title, description, definition,
       created_by_subject_id, created_at
FROM report_definition_versions
ORDER BY definition_id, version DESC
LIMIT $1;

-- name: CreateReportDefinitionVersion :one
INSERT INTO report_definition_versions (
    id, definition_id, version, title, description, definition,
    created_by_subject_id
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, definition_id, version, title, description, definition,
          created_by_subject_id, created_at;

-- name: ListUserLifecycleRequests :many
SELECT id, subject_id, requested_action, requested_roles,
       requested_organization_id, requested_email, requested_display_name,
       status, idempotency_key,
       requested_by_subject_id, outbox_message_id, failure_reason,
       created_at, updated_at
FROM user_lifecycle_requests
WHERE (sqlc.arg(status_filter)::text = '' OR status = sqlc.arg(status_filter)::text)
ORDER BY created_at, id
LIMIT sqlc.arg(result_limit);

-- name: GetUserLifecycleRequestByIdempotencyKey :one
SELECT id, subject_id, requested_action, requested_roles,
       requested_organization_id, requested_email, requested_display_name,
       status, idempotency_key,
       requested_by_subject_id, outbox_message_id, failure_reason,
       created_at, updated_at
FROM user_lifecycle_requests
WHERE idempotency_key = $1;

-- name: CreateUserLifecycleRequest :one
INSERT INTO user_lifecycle_requests (
    id, subject_id, requested_action, requested_roles,
    requested_organization_id, requested_email, requested_display_name,
    status, idempotency_key, requested_by_subject_id, outbox_message_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9, $10)
RETURNING id, subject_id, requested_action, requested_roles,
          requested_organization_id, requested_email, requested_display_name,
          status, idempotency_key,
          requested_by_subject_id, outbox_message_id, failure_reason,
          created_at, updated_at;

-- name: UpdateUserLifecycleRequest :one
UPDATE user_lifecycle_requests
SET status = $2,
    failure_reason = $3,
    updated_at = $4
WHERE id = $1
RETURNING id, subject_id, requested_action, requested_roles,
          requested_organization_id, requested_email, requested_display_name,
          status, idempotency_key,
          requested_by_subject_id, outbox_message_id, failure_reason,
          created_at, updated_at;
