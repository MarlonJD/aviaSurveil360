-- name: ListNotifications :many
SELECT id, recipient_subject_id, organization_id, title, body,
       related_entity_type, related_entity_id, deduplication_key,
       read_at, revision, created_at
FROM notification_records
WHERE recipient_subject_id = $1 AND tombstoned_at IS NULL
ORDER BY created_at DESC, id DESC
LIMIT $2;

-- name: GetNotification :one
SELECT id, recipient_subject_id, organization_id, title, body,
       related_entity_type, related_entity_id, deduplication_key,
       read_at, revision, created_at
FROM notification_records
WHERE id = $1 AND recipient_subject_id = $2 AND tombstoned_at IS NULL;

-- name: CreateNotification :one
INSERT INTO notification_records (
    id, recipient_subject_id, organization_id, title, body,
    related_entity_type, related_entity_id, deduplication_key, revision,
    created_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9)
RETURNING id, recipient_subject_id, organization_id, title, body,
          related_entity_type, related_entity_id, deduplication_key,
          read_at, revision, created_at;

-- name: MarkNotificationRead :one
UPDATE notification_records
SET read_at = $3,
    revision = revision + 1
WHERE id = $1
  AND recipient_subject_id = $2
  AND revision = $4
  AND read_at IS NULL
  AND tombstoned_at IS NULL
RETURNING id, recipient_subject_id, organization_id, title, body,
          related_entity_type, related_entity_id, deduplication_key,
          read_at, revision, created_at;

-- name: CreateNotificationDeliveryJob :one
INSERT INTO notification_delivery_jobs (
    id, notification_id, recipient_subject_id, channel, status,
    idempotency_key, outbox_message_id
) VALUES ($1, $2, $3, $4, 'PENDING', $5, $6)
RETURNING id, notification_id, recipient_subject_id, channel, status,
          idempotency_key, outbox_message_id, attempt_count, last_error,
          created_at, updated_at;

-- name: UpdateNotificationDeliveryJob :one
UPDATE notification_delivery_jobs
SET status = $2,
    attempt_count = $3,
    last_error = $4,
    updated_at = $5
WHERE id = $1
RETURNING id, notification_id, recipient_subject_id, channel, status,
          idempotency_key, outbox_message_id, attempt_count, last_error,
          created_at, updated_at;

-- name: CreateReminderDispatch :one
INSERT INTO reminder_dispatches (
    id, reminder_rule_id, entity_type, entity_id, recipient_subject_id,
    due_date, due_state, notification_id, dispatched_at
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, reminder_rule_id, entity_type, entity_id, recipient_subject_id,
          due_date, due_state, notification_id, dispatched_at;
