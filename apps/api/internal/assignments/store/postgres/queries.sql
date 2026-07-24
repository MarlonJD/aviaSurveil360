-- name: ListAuditAssignments :many
SELECT id, inspection_id, organization_id, lead_subject_id, status,
       scheduled_start_date, scheduled_end_date, revision
FROM audit_assignments
WHERE organization_id = sqlc.arg(organization_id)
  AND (sqlc.arg(status_filter)::text = '' OR status = sqlc.arg(status_filter)::text)
  AND tombstoned_at IS NULL
ORDER BY scheduled_start_date, id
LIMIT sqlc.arg(result_limit);

-- name: GetAuditAssignment :one
SELECT id, inspection_id, organization_id, lead_subject_id, status,
       scheduled_start_date, scheduled_end_date, revision
FROM audit_assignments
WHERE id = $1 AND tombstoned_at IS NULL;

-- name: CreateAuditAssignment :one
INSERT INTO audit_assignments (
    id, inspection_id, organization_id, lead_subject_id, status,
    scheduled_start_date, scheduled_end_date, revision
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, 1
)
RETURNING id, inspection_id, organization_id, lead_subject_id, status,
          scheduled_start_date, scheduled_end_date, revision;

-- name: UpdateAuditAssignment :one
UPDATE audit_assignments
SET lead_subject_id = $2,
    status = $3,
    scheduled_start_date = $4,
    scheduled_end_date = $5,
    revision = revision + 1,
    updated_at = $6
WHERE id = $1 AND revision = $7 AND tombstoned_at IS NULL
RETURNING id, inspection_id, organization_id, lead_subject_id, status,
          scheduled_start_date, scheduled_end_date, revision;

-- name: ListAuditTeamMembers :many
SELECT assignment_id, subject_id, member_role, revision
FROM audit_team_members
WHERE assignment_id = $1 AND removed_at IS NULL
ORDER BY member_role, subject_id;

-- name: AddAuditTeamMember :one
INSERT INTO audit_team_members (
    assignment_id, subject_id, member_role, revision
) VALUES ($1, $2, $3, 1)
RETURNING assignment_id, subject_id, member_role, revision;

-- name: ListAuditQuestionAssignments :many
SELECT assignment_id, question_id, subject_id, revision
FROM audit_question_assignments
WHERE assignment_id = $1
ORDER BY question_id, subject_id;

-- name: AddAuditQuestionAssignment :one
INSERT INTO audit_question_assignments (
    assignment_id, question_id, subject_id, revision
) VALUES ($1, $2, $3, 1)
RETURNING assignment_id, question_id, subject_id, revision;
