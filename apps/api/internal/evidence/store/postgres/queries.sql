-- name: GetEvidenceVersion :one
SELECT id, evidence_id, finding_id, organization_id, version, object_metadata_id, filename,
       media_type, sha256, size_bytes, status, submitted_by_subject_id, submitted_at, revision
FROM evidence_versions
WHERE id = $1;

-- name: ListEvidenceVersions :many
SELECT id, evidence_id, finding_id, organization_id, version, object_metadata_id, filename,
       media_type, sha256, size_bytes, status, submitted_by_subject_id, submitted_at, revision
FROM evidence_versions
WHERE evidence_id = $1
ORDER BY version;
