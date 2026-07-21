-- name: GetCAPRevision :one
SELECT id, cap_id, finding_id, organization_id, revision, status, root_cause, corrective_action,
       preventive_action, target_completion_date, submitted_by_subject_id, submitted_at,
       responsible_person, comment_to_caa
FROM cap_revisions
WHERE id = $1;

-- name: ListCAPRevisionsForFinding :many
SELECT id, cap_id, finding_id, organization_id, revision, status, root_cause, corrective_action,
       preventive_action, target_completion_date, submitted_by_subject_id, submitted_at,
       responsible_person, comment_to_caa
FROM cap_revisions
WHERE finding_id = $1
ORDER BY revision ASC;

-- name: GetLatestCAPRevisionForFinding :one
SELECT id, cap_id, finding_id, organization_id, revision, status, root_cause, corrective_action,
       preventive_action, target_completion_date, submitted_by_subject_id, submitted_at,
       responsible_person, comment_to_caa
FROM cap_revisions
WHERE finding_id = $1
ORDER BY revision DESC
LIMIT 1;
