-- name: GetOfflineGrant :one
SELECT id, subject_id, device_id, package_id, inspection_id, assignment_revision, granted_at,
       expires_at, revoked_at, revoke_reason, session_id, package_version, package_digest,
       allowed_command_types, assignment_scope, protocol_version, grant_token_hash
FROM offline_grants
WHERE id = $1;

-- name: ListAuthorizedChanges :many
SELECT sequence_id, subject_id, organization_id, package_id, kind, entity_id, entity_revision,
       payload, changed_at
FROM authorized_sync_changes
WHERE subject_id = $1 AND sequence_id > $2
ORDER BY sequence_id
LIMIT $3;
