-- name: ListRiskProjectionVersions :many
SELECT id, projection_kind, organization_id, version, source, snapshot,
       advisory_only, calculated_at
FROM risk_projection_versions
WHERE projection_kind = sqlc.arg(projection_kind)
  AND organization_id IS NOT DISTINCT FROM sqlc.narg(organization_id)::text
ORDER BY version DESC
LIMIT sqlc.arg(result_limit);

-- name: GetRiskProjectionVersion :one
SELECT id, projection_kind, organization_id, version, source, snapshot,
       advisory_only, calculated_at
FROM risk_projection_versions
WHERE id = $1;

-- name: CreateRiskProjectionVersion :one
INSERT INTO risk_projection_versions (
    id, projection_kind, organization_id, version, source, snapshot,
    advisory_only, calculated_at
) VALUES ($1, $2, $3, $4, $5, $6, true, $7)
RETURNING id, projection_kind, organization_id, version, source, snapshot,
          advisory_only, calculated_at;
