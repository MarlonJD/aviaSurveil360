-- name: GetSessionForAuthentication :one
SELECT id, subject_id, organization_id, roles, expires_at, absolute_expires_at, revoked_at,
       csrf_token_hash, provider_session_id
FROM session_references
WHERE session_token_hash = $1
FOR UPDATE;

-- name: GetIdentityReference :one
SELECT subject_id, issuer, display_name, created_at
FROM identity_references
WHERE subject_id = $1;
