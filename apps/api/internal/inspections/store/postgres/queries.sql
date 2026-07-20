-- name: GetInspection :one
SELECT
    id,
    organization_id,
    assigned_inspector_subject_id,
    title,
    inspection_type,
    status,
    due_date,
    revision,
    created_at,
    updated_at
FROM inspections
WHERE id = $1;

-- name: ListAssignedInspections :many
SELECT
    id,
    organization_id,
    assigned_inspector_subject_id,
    title,
    inspection_type,
    status,
    due_date,
    revision,
    created_at,
    updated_at
FROM inspections
WHERE assigned_inspector_subject_id = $1
ORDER BY due_date NULLS LAST, id
LIMIT $2;
