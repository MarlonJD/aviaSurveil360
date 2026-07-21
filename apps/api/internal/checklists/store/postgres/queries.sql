-- name: GetInspectionChecklist :one
SELECT inspection_id, status, revision, submitted_at, reopened_at, reopen_reason
FROM inspection_checklists
WHERE inspection_id = $1;

-- name: GetChecklistResponse :one
SELECT id, inspection_id, package_id, question_id, assigned_inspector_subject_id,
       response_value, comment_to_auditee, internal_caa_note, revision, updated_at
FROM checklist_responses
WHERE inspection_id = $1 AND question_id = $2;

-- name: ListQuestionAssignments :many
SELECT inspection_id, question_id, subject_id, assignment_revision
FROM inspection_question_assignments
WHERE inspection_id = $1
ORDER BY question_id, subject_id;
