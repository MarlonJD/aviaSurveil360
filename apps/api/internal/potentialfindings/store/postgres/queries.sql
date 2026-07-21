-- name: GetPotentialFinding :one
SELECT id, inspection_id, checklist_response_id, organization_id, status, finding_basis,
       expected_evidence, comment_to_auditee, internal_caa_note, converted_finding_id,
       revision, created_at, updated_at, question_id, title, description, created_by_subject_id
FROM potential_findings
WHERE id = $1;

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
