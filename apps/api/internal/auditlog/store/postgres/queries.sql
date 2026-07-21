-- name: ListAuditEventsForEntity :many
SELECT sequence_id, event_id, occurred_at, actor_subject_id, actor_role, organization_id,
       action, entity_type, entity_id, request_id, details, entity_version, before_status,
       after_status, reason, operation_id, correlation_id, closure_basis
FROM audit_events
WHERE entity_type = $1 AND entity_id = $2
ORDER BY sequence_id;
