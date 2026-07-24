package administration

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	administrationstore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/administration/store/postgres"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/idempotency"
	"github.com/jackc/pgx/v5"
)

type UserLifecycleAction string

const (
	UserLifecycleProvision   UserLifecycleAction = "PROVISION"
	UserLifecycleUpdateRoles UserLifecycleAction = "UPDATE_ROLES"
	UserLifecycleSuspend     UserLifecycleAction = "SUSPEND"
	UserLifecycleReactivate  UserLifecycleAction = "REACTIVATE"
)

type UserLifecycleStatus string

const (
	UserLifecyclePending UserLifecycleStatus = "PENDING"
	UserLifecycleRunning UserLifecycleStatus = "RUNNING"
	UserLifecycleSuccess UserLifecycleStatus = "SUCCEEDED"
	UserLifecycleFailed  UserLifecycleStatus = "FAILED"
)

type UserLifecycleRequest struct {
	ID              string              `json:"id"`
	SubjectID       string              `json:"subjectId"`
	Action          UserLifecycleAction `json:"action"`
	Roles           []identity.Role     `json:"roles"`
	OrganizationID  string              `json:"organizationId"`
	Status          UserLifecycleStatus `json:"status"`
	IdempotencyKey  string              `json:"idempotencyKey"`
	RequestedBy     string              `json:"requestedBySubjectId"`
	OutboxMessageID string              `json:"outboxMessageId"`
	FailureReason   string              `json:"failureReason,omitempty"`
	CreatedAt       time.Time           `json:"createdAt"`
	UpdatedAt       time.Time           `json:"updatedAt"`
}

type RequestUserLifecycleCommand struct {
	OperationID    string
	IdempotencyKey string
	SubjectID      string
	Action         UserLifecycleAction
	Roles          []identity.Role
	OrganizationID string
}

type UserServiceDependencies struct {
	Clock       func() time.Time
	IDGenerator func(string) string
}

type UserService struct {
	pool        *database.Pool
	clock       func() time.Time
	idGenerator func(string) string
}

func NewUserService(pool *database.Pool, dependencies UserServiceDependencies) *UserService {
	clock := dependencies.Clock
	if clock == nil {
		clock = time.Now
	}
	idGenerator := dependencies.IDGenerator
	if idGenerator == nil {
		idGenerator = randomUserID
	}
	return &UserService{pool: pool, clock: clock, idGenerator: idGenerator}
}

func (service *UserService) RequestLifecycle(
	ctx context.Context,
	actor identity.Principal,
	command RequestUserLifecycleCommand,
) (UserLifecycleRequest, error) {
	if !CanManageUsers(actor) {
		return UserLifecycleRequest{}, ErrForbidden
	}
	command = normalizeLifecycleCommand(command)
	if err := validateLifecycleCommand(command); err != nil {
		return UserLifecycleRequest{}, err
	}
	roles := make([]string, len(command.Roles))
	for index, role := range command.Roles {
		roles[index] = string(role)
	}
	semanticHash, err := idempotency.SemanticHash(struct {
		IdempotencyKey string              `json:"idempotencyKey"`
		SubjectID      string              `json:"subjectId"`
		Action         UserLifecycleAction `json:"action"`
		Roles          []string            `json:"roles"`
		OrganizationID string              `json:"organizationId"`
	}{command.IdempotencyKey, command.SubjectID, command.Action, roles, command.OrganizationID})
	if err != nil {
		return UserLifecycleRequest{}, err
	}
	scope := actor.SubjectID + ":user_lifecycle"
	var output UserLifecycleRequest
	err = database.WithinTransaction(ctx, service.pool, func(ctx context.Context, transaction pgx.Tx) error {
		if _, err := transaction.Exec(
			ctx, "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
			scope+":idempotency:"+command.IdempotencyKey,
		); err != nil {
			return err
		}
		if _, err := transaction.Exec(ctx, "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", scope+":"+command.OperationID); err != nil {
			return err
		}
		var storedHash string
		var responseBody []byte
		err := transaction.QueryRow(ctx, `
			SELECT semantic_hash, response_body
			FROM idempotency_responses
			WHERE scope = $1 AND operation_id = $2
		`, scope, command.OperationID).Scan(&storedHash, &responseBody)
		if err == nil {
			if storedHash != semanticHash {
				return idempotency.ErrOperationIDReuse
			}
			return json.Unmarshal(responseBody, &output)
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		if _, err := administrationstore.New(transaction).GetUserLifecycleRequestByIdempotencyKey(
			ctx, command.IdempotencyKey,
		); err == nil {
			return idempotency.ErrOperationIDReuse
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}

		now := service.clock().UTC()
		requestID := service.idGenerator("user-lifecycle")
		outboxID := service.idGenerator("outbox-user-lifecycle")
		output = UserLifecycleRequest{
			ID: requestID, SubjectID: command.SubjectID, Action: command.Action,
			Roles: append([]identity.Role(nil), command.Roles...), OrganizationID: command.OrganizationID,
			Status: UserLifecyclePending, IdempotencyKey: command.IdempotencyKey,
			RequestedBy: actor.SubjectID, OutboxMessageID: outboxID,
			CreatedAt: now, UpdatedAt: now,
		}
		responseBody, err = json.Marshal(output)
		if err != nil {
			return err
		}
		auditID := service.idGenerator("audit-user-lifecycle")
		actorRole := identity.RoleAdmin
		if _, err := transaction.Exec(ctx, `
			INSERT INTO audit_events (
				event_id, occurred_at, actor_subject_id, actor_role, organization_id,
				action, entity_type, entity_id, entity_version, after_status,
				operation_id, correlation_id, request_id, details
			) VALUES (
				$1, $2, $3, $4, NULLIF($5, ''), $6, 'USER_LIFECYCLE_REQUEST',
				$7, 1, 'PENDING', $8, $8, $8, '{}'::jsonb
			)
		`, auditID, now, actor.SubjectID, string(actorRole), command.OrganizationID,
			lifecycleAuditAction(command.Action), requestID, command.OperationID); err != nil {
			return fmt.Errorf("append user lifecycle audit event: %w", err)
		}
		var changeSequenceID int64
		if err := transaction.QueryRow(ctx, `
			INSERT INTO authorized_sync_changes (
				subject_id, organization_id, kind, entity_id, entity_revision,
				payload, changed_at, operation_id, correlation_id
			) VALUES ($1, NULLIF($2, ''), 'USER_LIFECYCLE_REQUEST', $3, 1, $4, $5, $6, $6)
			RETURNING sequence_id
		`, actor.SubjectID, command.OrganizationID, requestID, responseBody, now,
			command.OperationID).Scan(&changeSequenceID); err != nil {
			return fmt.Errorf("append user lifecycle change: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO outbox_messages (
				id, topic, aggregate_type, aggregate_id, payload, available_at,
				idempotency_key, operation_id, correlation_id
			) VALUES (
				$1, 'identity.user-lifecycle.requested', 'USER_LIFECYCLE_REQUEST',
				$2, $3, $4, $5, $6, $6
			)
		`, outboxID, requestID, responseBody, now,
			"command:"+scope+":"+command.OperationID, command.OperationID); err != nil {
			return fmt.Errorf("enqueue user lifecycle job: %w", err)
		}
		subjectID := command.SubjectID
		organizationID := command.OrganizationID
		outboxMessageID := outboxID
		if _, err := administrationstore.New(transaction).CreateUserLifecycleRequest(ctx,
			administrationstore.CreateUserLifecycleRequestParams{
				ID: requestID, SubjectID: &subjectID, RequestedAction: string(command.Action),
				RequestedRoles: roles, RequestedOrganizationID: &organizationID,
				IdempotencyKey: command.IdempotencyKey, RequestedBySubjectID: actor.SubjectID,
				OutboxMessageID: &outboxMessageID,
			},
		); err != nil {
			return fmt.Errorf("persist user lifecycle request: %w", err)
		}
		if command.Action == UserLifecycleSuspend || command.Action == UserLifecycleUpdateRoles {
			if _, err := transaction.Exec(ctx, `
				UPDATE session_references
				SET revoked_at = COALESCE(revoked_at, $2),
				    provider_tokens_ciphertext = NULL
				WHERE subject_id = $1
				  AND revoked_at IS NULL
			`, command.SubjectID, now); err != nil {
				return fmt.Errorf("invalidate target sessions: %w", err)
			}
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO idempotency_responses (
				scope, operation_id, semantic_hash, response_status,
				response_headers, response_body, created_at
			) VALUES ($1, $2, $3, 200, '{}'::jsonb, $4, $5)
		`, scope, command.OperationID, semanticHash, responseBody, now); err != nil {
			return fmt.Errorf("store user lifecycle idempotency response: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO command_transaction_links (
				operation_id, idempotency_scope, audit_event_id,
				change_sequence_id, outbox_message_id, created_at
			) VALUES ($1, $2, $3, $4, $5, $6)
		`, command.OperationID, scope, auditID, changeSequenceID, outboxID, now); err != nil {
			return fmt.Errorf("link user lifecycle command: %w", err)
		}
		return nil
	})
	return output, err
}

func validateLifecycleCommand(command RequestUserLifecycleCommand) error {
	if command.OperationID == "" || command.IdempotencyKey == "" ||
		command.SubjectID == "" || command.OrganizationID == "" {
		return ErrInvalid
	}
	switch command.Action {
	case UserLifecycleProvision, UserLifecycleUpdateRoles, UserLifecycleSuspend, UserLifecycleReactivate:
	default:
		return ErrInvalid
	}
	if len(command.Roles) == 0 {
		return ErrInvalid
	}
	for _, role := range command.Roles {
		switch role {
		case identity.RoleInspector, identity.RoleLeadInspector, identity.RoleDepartmentManager,
			identity.RoleGeneralManager, identity.RoleFinance, identity.RoleExecutiveDirector,
			identity.RoleAuditee, identity.RoleAdmin:
		default:
			return ErrInvalid
		}
	}
	return nil
}

func normalizeLifecycleCommand(command RequestUserLifecycleCommand) RequestUserLifecycleCommand {
	command.OperationID = strings.TrimSpace(command.OperationID)
	command.IdempotencyKey = strings.TrimSpace(command.IdempotencyKey)
	command.SubjectID = strings.TrimSpace(command.SubjectID)
	command.OrganizationID = strings.TrimSpace(command.OrganizationID)
	return command
}

func lifecycleAuditAction(action UserLifecycleAction) string {
	switch action {
	case UserLifecycleProvision:
		return "USER_PROVISION_REQUESTED"
	case UserLifecycleUpdateRoles:
		return "USER_ROLE_UPDATE_REQUESTED"
	case UserLifecycleSuspend:
		return "USER_SUSPENSION_REQUESTED"
	case UserLifecycleReactivate:
		return "USER_REACTIVATION_REQUESTED"
	default:
		return "USER_LIFECYCLE_REQUESTED"
	}
}

func randomUserID(prefix string) string {
	var bytes [12]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		panic(fmt.Sprintf("secure user lifecycle identifier generation failed: %v", err))
	}
	return prefix + "-" + hex.EncodeToString(bytes[:])
}
