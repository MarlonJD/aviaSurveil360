-- name: ListPlannedInspections :many
SELECT id, organization_id, title, inspection_type, status, due_date, revision
FROM inspections
ORDER BY due_date, id
LIMIT $1 OFFSET $2;
