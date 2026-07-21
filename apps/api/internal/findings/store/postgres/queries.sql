-- name: GetFinding :one
SELECT id, reference, potential_finding_id, inspection_id, organization_id, severity, status,
       owner_subject_id, next_action, due_date, closure_basis, closure_reason, revision, created_at, updated_at
FROM findings
WHERE id = $1;

-- name: GetFindingForUpdate :one
SELECT id, reference, potential_finding_id, inspection_id, organization_id, severity, status,
       owner_subject_id, next_action, due_date, closure_basis, closure_reason, revision, created_at, updated_at
FROM findings
WHERE id = $1
FOR UPDATE;

-- name: ListFindingsByOrganization :many
SELECT id, reference, potential_finding_id, inspection_id, organization_id, severity, status,
       owner_subject_id, next_action, due_date, closure_basis, closure_reason, revision, created_at, updated_at
FROM findings
WHERE organization_id = $1
ORDER BY reference;

-- name: ListFindings :many
SELECT id, reference, potential_finding_id, inspection_id, organization_id, severity, status,
       owner_subject_id, next_action, due_date, closure_basis, closure_reason, revision, created_at, updated_at
FROM findings
ORDER BY reference;
