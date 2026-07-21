-- name: GetPotentialFinding :one
SELECT id, inspection_id, checklist_response_id, organization_id, status, finding_basis,
       expected_evidence, comment_to_auditee, internal_caa_note, converted_finding_id,
       revision, created_at, updated_at, question_id, title, description, created_by_subject_id
FROM potential_findings
WHERE id = $1;

-- name: ListPotentialFindings :many
SELECT id, inspection_id, checklist_response_id, organization_id, status, finding_basis,
       expected_evidence, comment_to_auditee, internal_caa_note, converted_finding_id,
       revision, created_at, updated_at, question_id, title, description, created_by_subject_id
FROM potential_findings
WHERE (sqlc.arg(status_filter)::text = '' OR status = sqlc.arg(status_filter)::text)
ORDER BY id
LIMIT sqlc.arg(result_limit);

-- name: ListAssignedInspectorSubjectIDs :many
SELECT assignment.subject_id
FROM potential_findings potential
JOIN inspection_question_assignments assignment
  ON assignment.inspection_id = potential.inspection_id
 AND assignment.question_id = potential.question_id
WHERE potential.id = $1
ORDER BY assignment.subject_id;

-- name: GetPotentialFindingForUpdate :one
SELECT id, inspection_id, checklist_response_id, organization_id, status, finding_basis,
       expected_evidence, comment_to_auditee, internal_caa_note, converted_finding_id,
       revision, created_at, updated_at, question_id, title, description, created_by_subject_id
FROM potential_findings
WHERE id = $1
FOR UPDATE;

-- name: GetPotentialFindingByResponse :one
SELECT id, status, revision
FROM potential_findings
WHERE checklist_response_id = $1;
