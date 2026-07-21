-- name: GetReportApprovalState :one
SELECT report_version_id, status, revision, issued_at, updated_at
FROM report_approval_states
WHERE report_version_id = $1
FOR UPDATE;

-- name: GetReportVersion :one
SELECT id, report_id, inspection_id, version, status, snapshot, created_at
FROM report_versions
WHERE id = $1;
