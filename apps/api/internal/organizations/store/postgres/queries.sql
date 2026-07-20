-- name: GetOrganization :one
SELECT id, legal_name, organization_type, status, revision, created_at, updated_at
FROM organizations
WHERE id = $1;

-- name: ListOrganizations :many
SELECT id, legal_name, organization_type, status, revision, created_at, updated_at
FROM organizations
ORDER BY legal_name, id
LIMIT $1 OFFSET $2;
