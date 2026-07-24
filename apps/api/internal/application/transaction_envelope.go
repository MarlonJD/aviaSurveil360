package application

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

type transactionEnvelopeRecord struct {
	OperationID      string
	CorrelationID    string
	IdempotencyKey   string
	IdempotencyScope string
	SemanticHash     string
	ResponseBody     []byte
	ActorSubjectID   string
	ActorRole        string
	OrganizationID   string
	Action           string
	EntityType       string
	EntityID         string
	EntityVersion    int64
	BeforeStatus     string
	AfterStatus      string
	Reason           string
	ClosureBasis     string
	SyncKind         string
	OutboxTopic      string
	AuditEventID     string
	OutboxMessageID  string
	OccurredAt       time.Time
}

func persistCommandTransaction(
	ctx context.Context,
	transaction pgx.Tx,
	record transactionEnvelopeRecord,
) error {
	if _, err := transaction.Exec(ctx, `
		INSERT INTO audit_events (
			event_id, occurred_at, actor_subject_id, actor_role, organization_id,
			action, entity_type, entity_id, entity_version, before_status, after_status,
			reason, operation_id, correlation_id, closure_basis, request_id, details
		) VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9, $10, $11,
			NULLIF($12, ''), $13, $14, NULLIF($15, ''), $14, '{}'::jsonb
		)
	`, record.AuditEventID, record.OccurredAt, record.ActorSubjectID, record.ActorRole,
		record.OrganizationID, record.Action, record.EntityType, record.EntityID,
		record.EntityVersion, record.BeforeStatus, record.AfterStatus, record.Reason,
		record.OperationID, record.CorrelationID, record.ClosureBasis); err != nil {
		return fmt.Errorf("append audit event: %w", err)
	}

	var changeSequenceID int64
	if err := transaction.QueryRow(ctx, `
		INSERT INTO authorized_sync_changes (
			subject_id, organization_id, kind, entity_id, entity_revision,
			payload, changed_at, operation_id, correlation_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING sequence_id
	`, record.ActorSubjectID, record.OrganizationID, record.SyncKind, record.EntityID,
		record.EntityVersion, record.ResponseBody, record.OccurredAt, record.OperationID,
		record.CorrelationID).Scan(&changeSequenceID); err != nil {
		return fmt.Errorf("append authorized sync change: %w", err)
	}

	if _, err := transaction.Exec(ctx, `
		INSERT INTO outbox_messages (
			id, topic, aggregate_type, aggregate_id, payload, available_at,
			idempotency_key, operation_id, correlation_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, record.OutboxMessageID, record.OutboxTopic, record.EntityType, record.EntityID,
		record.ResponseBody, record.OccurredAt,
		"command:"+record.IdempotencyScope+":idempotency:"+record.IdempotencyKey,
		record.OperationID, record.CorrelationID); err != nil {
		return fmt.Errorf("enqueue server outbox: %w", err)
	}

	if _, err := transaction.Exec(ctx, `
		INSERT INTO idempotency_responses (
			scope, operation_id, semantic_hash, response_status,
			response_headers, response_body, created_at
		) VALUES ($1, $2, $3, 200, '{}'::jsonb, $4, $5)
	`, record.IdempotencyScope, record.OperationID, record.SemanticHash,
		record.ResponseBody, record.OccurredAt); err != nil {
		return fmt.Errorf("store idempotent response: %w", err)
	}

	if _, err := transaction.Exec(ctx, `
		INSERT INTO command_transaction_links (
			operation_id, idempotency_scope, audit_event_id,
			change_sequence_id, outbox_message_id, created_at
		) VALUES ($1, $2, $3, $4, $5, $6)
	`, record.OperationID, record.IdempotencyScope, record.AuditEventID,
		changeSequenceID, record.OutboxMessageID, record.OccurredAt); err != nil {
		return fmt.Errorf("link command transaction records: %w", err)
	}
	return nil
}
