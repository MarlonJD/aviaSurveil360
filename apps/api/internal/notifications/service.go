package notifications

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/jackc/pgx/v5"
)

type EmailDelivery struct {
	JobID              string
	NotificationID     string
	RecipientSubjectID string
	OrganizationID     string
	Title              string
	Body               string
	RelatedEntityType  string
	RelatedEntityID    string
	Attempt            int
}

type DeliveryAdapter interface {
	Deliver(context.Context, EmailDelivery) error
}

type DeliveryDependencies struct {
	Clock       func() time.Time
	IDGenerator func(string) string
	Adapter     DeliveryAdapter
	WorkerID    string
	Lease       time.Duration
}

type DeliveryService struct {
	pool        *database.Pool
	clock       func() time.Time
	idGenerator func(string) string
	adapter     DeliveryAdapter
	workerID    string
	lease       time.Duration
}

func NewDeliveryService(
	pool *database.Pool,
	dependencies DeliveryDependencies,
) *DeliveryService {
	clock := dependencies.Clock
	if clock == nil {
		clock = time.Now
	}
	idGenerator := dependencies.IDGenerator
	if idGenerator == nil {
		idGenerator = deliveryRandomID
	}
	workerID := dependencies.WorkerID
	if workerID == "" {
		workerID = "notification-delivery-worker"
	}
	lease := dependencies.Lease
	if lease <= 0 {
		lease = time.Minute
	}
	return &DeliveryService{
		pool: pool, clock: clock, idGenerator: idGenerator,
		adapter: dependencies.Adapter, workerID: workerID, lease: lease,
	}
}

type claimedDelivery struct {
	EmailDelivery
	OutboxMessageID string
}

func (service *DeliveryService) ProcessNext(
	ctx context.Context,
) (bool, error) {
	if service.pool == nil || service.adapter == nil {
		return false, errors.New("notification delivery requires a database and adapter")
	}
	delivery, claimed, err := service.claimNext(ctx)
	if err != nil || !claimed {
		return claimed, err
	}
	providerErr := service.adapter.Deliver(ctx, delivery.EmailDelivery)
	if err := service.finalize(ctx, delivery, providerErr); err != nil {
		return true, err
	}
	return true, providerErr
}

func (service *DeliveryService) claimNext(
	ctx context.Context,
) (claimedDelivery, bool, error) {
	var delivery claimedDelivery
	claimed := false
	now := service.clock().UTC()
	err := database.WithinTransaction(
		ctx,
		service.pool,
		func(ctx context.Context, transaction pgx.Tx) error {
			err := transaction.QueryRow(ctx, `
				SELECT job.id, job.notification_id,
				       job.recipient_subject_id,
				       COALESCE(record.organization_id, ''),
				       record.title, record.body,
				       COALESCE(record.related_entity_type, ''),
				       COALESCE(record.related_entity_id, ''),
				       job.attempt_count, job.outbox_message_id
				FROM notification_delivery_jobs job
				JOIN notification_records record
				  ON record.id = job.notification_id
				JOIN outbox_messages outbox
				  ON outbox.id = job.outbox_message_id
				WHERE job.channel = 'EMAIL'
				  AND job.status IN ('PENDING', 'FAILED')
				  AND outbox.delivered_at IS NULL
				  AND outbox.terminal_state IS NULL
				  AND outbox.available_at <= $1
				  AND (
				      outbox.lease_expires_at IS NULL
				      OR outbox.lease_expires_at <= $1
				  )
				ORDER BY job.created_at, job.id
				FOR UPDATE OF job, outbox SKIP LOCKED
				LIMIT 1
			`, now).Scan(
				&delivery.JobID,
				&delivery.NotificationID,
				&delivery.RecipientSubjectID,
				&delivery.OrganizationID,
				&delivery.Title,
				&delivery.Body,
				&delivery.RelatedEntityType,
				&delivery.RelatedEntityID,
				&delivery.Attempt,
				&delivery.OutboxMessageID,
			)
			if errors.Is(err, pgx.ErrNoRows) {
				return nil
			}
			if err != nil {
				return err
			}
			claimed = true
			delivery.Attempt++
			if _, err := transaction.Exec(ctx, `
				UPDATE notification_delivery_jobs
				SET attempt_count = $2,
				    updated_at = $3
				WHERE id = $1
			`, delivery.JobID, delivery.Attempt, now); err != nil {
				return err
			}
			result, err := transaction.Exec(ctx, `
				UPDATE outbox_messages
				SET claimed_at = $2,
				    lease_owner = $3,
				    lease_expires_at = $4,
				    attempt_count = attempt_count + 1
				WHERE id = $1
				  AND delivered_at IS NULL
				  AND terminal_state IS NULL
			`, delivery.OutboxMessageID, now, service.workerID,
				now.Add(service.lease))
			if err != nil {
				return err
			}
			if result.RowsAffected() != 1 {
				return errors.New("notification delivery claim changed")
			}
			return nil
		},
	)
	return delivery, claimed, err
}

func (service *DeliveryService) finalize(
	ctx context.Context,
	delivery claimedDelivery,
	providerErr error,
) error {
	return database.WithinTransaction(
		ctx,
		service.pool,
		func(ctx context.Context, transaction pgx.Tx) error {
			now := service.clock().UTC()
			var leaseOwner string
			if err := transaction.QueryRow(ctx, `
				SELECT COALESCE(lease_owner, '')
				FROM outbox_messages
				WHERE id = $1
				  AND delivered_at IS NULL
				FOR UPDATE
			`, delivery.OutboxMessageID).Scan(&leaseOwner); err != nil {
				return err
			}
			if leaseOwner != service.workerID {
				return errors.New("notification delivery lease changed")
			}
			status := "DELIVERED"
			lastError := ""
			action := "NOTIFICATION_EMAIL_DELIVERED"
			if providerErr != nil {
				status = "FAILED"
				lastError = providerErr.Error()
				action = "NOTIFICATION_EMAIL_DELIVERY_FAILED"
			}
			result, err := transaction.Exec(ctx, `
				UPDATE notification_delivery_jobs
				SET status = $2,
				    last_error = NULLIF($3, ''),
				    updated_at = $4
				WHERE id = $1
				  AND attempt_count = $5
			`, delivery.JobID, status, lastError, now, delivery.Attempt)
			if err != nil {
				return err
			}
			if result.RowsAffected() != 1 {
				return errors.New("notification delivery job state changed")
			}
			if providerErr == nil {
				result, err = transaction.Exec(ctx, `
					UPDATE outbox_messages
					SET delivered_at = $2,
					    claimed_at = NULL,
					    lease_owner = NULL,
					    lease_expires_at = NULL,
					    last_error = NULL
					WHERE id = $1
					  AND lease_owner = $3
					  AND delivered_at IS NULL
				`, delivery.OutboxMessageID, now, service.workerID)
			} else {
				result, err = transaction.Exec(ctx, `
					UPDATE outbox_messages
					SET claimed_at = NULL,
					    lease_owner = NULL,
					    lease_expires_at = NULL,
					    last_error = $2,
					    available_at = $3
					WHERE id = $1
					  AND lease_owner = $4
					  AND delivered_at IS NULL
				`, delivery.OutboxMessageID, lastError, now, service.workerID)
			}
			if err != nil {
				return err
			}
			if result.RowsAffected() != 1 {
				return errors.New("notification delivery outbox state changed")
			}
			if _, err := transaction.Exec(ctx, `
				INSERT INTO audit_events (
					event_id, occurred_at, actor_role, organization_id,
					action, entity_type, entity_id, entity_version,
					before_status, after_status, request_id, details
				) VALUES (
					$1, $2, 'SYSTEM', NULLIF($3, ''), $4,
					'NOTIFICATION_DELIVERY', $5, $6,
					'', $7, $1,
					jsonb_build_object(
						'notificationId', $8::text,
						'recipientSubjectId', $9::text,
						'attempt', $6::bigint,
						'lastError', NULLIF($10::text, '')
					)
				)
			`, service.idGenerator("audit"), now,
				delivery.OrganizationID, action, delivery.JobID,
				delivery.Attempt, status, delivery.NotificationID,
				delivery.RecipientSubjectID, lastError); err != nil {
				return err
			}
			return nil
		},
	)
}

func deliveryRandomID(prefix string) string {
	var buffer [16]byte
	if _, err := rand.Read(buffer[:]); err != nil {
		panic(fmt.Sprintf("generate %s id: %v", prefix, err))
	}
	return prefix + "-" + hex.EncodeToString(buffer[:])
}
