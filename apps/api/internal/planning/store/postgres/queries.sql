-- name: ListPlannedInspections :many
SELECT id, organization_id, title, inspection_type, status, due_date, revision
FROM inspections
ORDER BY due_date, id
LIMIT $1 OFFSET $2;

-- name: ListSurveillancePlanItems :many
SELECT plan.id, plan.title, plan.plan_year, plan.organization_id, organization.legal_name,
       plan.inspection_type, plan.scheduled_date, plan.estimated_budget::float8 AS estimated_budget, plan.status,
       plan.current_owner_role, plan.next_action, plan.revision
FROM surveillance_plan_items plan
JOIN organizations organization ON organization.id = plan.organization_id
ORDER BY plan.scheduled_date, plan.id
LIMIT $1;

-- name: GetSurveillancePlanItemForUpdate :one
SELECT plan.id, plan.title, plan.plan_year, plan.organization_id, organization.legal_name,
       plan.inspection_type, plan.scheduled_date, plan.estimated_budget::float8 AS estimated_budget, plan.status,
       plan.current_owner_role, plan.next_action, plan.revision
FROM surveillance_plan_items plan
JOIN organizations organization ON organization.id = plan.organization_id
WHERE plan.id = $1
FOR UPDATE OF plan;

-- name: UpdateSurveillancePlanDecision :one
UPDATE surveillance_plan_items
SET status = $2,
    current_owner_role = $3,
    next_action = $4,
    revision = revision + 1,
    updated_at = $5
WHERE id = $1 AND revision = $6
RETURNING id, title, plan_year, organization_id, inspection_type, scheduled_date,
          estimated_budget::float8 AS estimated_budget, status, current_owner_role, next_action, revision;
