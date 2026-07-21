-- name: ListChecklistTemplateVersions :many
SELECT id, template_id, title, version, published_at,
       jsonb_array_length(snapshot->'questions')::bigint AS question_count
FROM checklist_template_versions
ORDER BY template_id, version DESC
LIMIT $1;

-- name: GetChecklistTemplateVersion :one
SELECT id, template_id, title, version, published_at, snapshot,
       jsonb_array_length(snapshot->'questions')::bigint AS question_count
FROM checklist_template_versions
WHERE id = $1;

-- name: ListReminderRules :many
SELECT id, label, offset_days, channel, status, revision
FROM reminder_rules
ORDER BY offset_days DESC, id
LIMIT $1;
