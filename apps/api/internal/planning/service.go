package planning

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/application"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	planningstore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/planning/store/postgres"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/idempotency"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

type Status string

const (
	StatusFinanceReview           Status = "FINANCE_REVIEW"
	StatusGeneralManagerReview    Status = "GM_REVIEW"
	StatusExecutiveDirectorReview Status = "EXECUTIVE_DIRECTOR_REVIEW"
	StatusGeneralManagerRelease   Status = "GM_RELEASE"
	StatusReleased                Status = "RELEASED"
	StatusReturned                Status = "RETURNED"
)

type Decision string

const (
	DecisionApproveBudget           Decision = "APPROVE_BUDGET"
	DecisionForwardForFinalApproval Decision = "FORWARD_FOR_FINAL_APPROVAL"
	DecisionApprovePlan             Decision = "APPROVE_PLAN"
	DecisionReleasePlan             Decision = "RELEASE_PLAN"
	DecisionReturnForRevision       Decision = "RETURN_FOR_REVISION"
)

type Item struct {
	ID               string        `json:"id"`
	Title            string        `json:"title"`
	PlanYear         int32         `json:"planYear"`
	OrganizationID   string        `json:"organizationId"`
	OrganizationName string        `json:"organizationName"`
	InspectionType   string        `json:"inspectionType"`
	ScheduledDate    string        `json:"scheduledDate"`
	EstimatedBudget  float64       `json:"estimatedBudget"`
	Status           Status        `json:"status"`
	CurrentOwnerRole identity.Role `json:"currentOwnerRole"`
	NextAction       string        `json:"nextAction"`
	Revision         int64         `json:"revision"`
}

type DecideCommand struct {
	OperationID      string
	PlanningItemID   string
	ExpectedRevision int64
	Decision         Decision
	Reason           string
}

type Dependencies struct {
	Clock       func() time.Time
	IDGenerator func(string) string
}

type Service struct {
	pool        *database.Pool
	clock       func() time.Time
	idGenerator func(string) string
}

func NewService(pool *database.Pool, dependencies Dependencies) *Service {
	clock := dependencies.Clock
	if clock == nil {
		clock = time.Now
	}
	idGenerator := dependencies.IDGenerator
	if idGenerator == nil {
		idGenerator = randomID
	}
	return &Service{pool: pool, clock: clock, idGenerator: idGenerator}
}

func (service *Service) List(ctx context.Context, actor identity.Principal, limit int32) ([]Item, error) {
	if !actor.HasRole(
		identity.RoleInspector,
		identity.RoleLeadInspector,
		identity.RoleDepartmentManager,
		identity.RoleFinance,
		identity.RoleGeneralManager,
		identity.RoleExecutiveDirector,
		identity.RoleAdmin,
	) {
		return nil, fmt.Errorf("%w: CAA planning access is required", application.ErrForbidden)
	}
	records, err := planningstore.New(service.pool).ListSurveillancePlanItems(ctx, boundedLimit(limit))
	if err != nil {
		return nil, err
	}
	items := make([]Item, 0, len(records))
	for _, record := range records {
		items = append(items, itemFromList(record))
	}
	return items, nil
}

func (service *Service) Decide(ctx context.Context, actor identity.Principal, command DecideCommand) (Item, error) {
	if strings.TrimSpace(command.OperationID) == "" || strings.TrimSpace(command.PlanningItemID) == "" || strings.TrimSpace(command.Reason) == "" {
		return Item{}, fmt.Errorf("%w: operation, planning item, and reason are required", application.ErrInvalid)
	}
	semanticHash, err := idempotency.SemanticHash(struct {
		PlanningItemID   string   `json:"planningItemId"`
		ExpectedRevision int64    `json:"expectedRevision"`
		Decision         Decision `json:"decision"`
		Reason           string   `json:"reason"`
	}{command.PlanningItemID, command.ExpectedRevision, command.Decision, strings.TrimSpace(command.Reason)})
	if err != nil {
		return Item{}, err
	}
	scope := actor.SubjectID + ":planning_decision"
	var output Item
	err = database.WithinTransaction(ctx, service.pool, func(ctx context.Context, transaction pgx.Tx) error {
		if _, err := transaction.Exec(ctx, "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", scope+":"+command.OperationID); err != nil {
			return err
		}
		var storedHash string
		var storedBody []byte
		err := transaction.QueryRow(ctx, `
			SELECT semantic_hash, response_body FROM idempotency_responses
			WHERE scope = $1 AND operation_id = $2
		`, scope, command.OperationID).Scan(&storedHash, &storedBody)
		if err == nil {
			if storedHash != semanticHash {
				return idempotency.ErrOperationIDReuse
			}
			return json.Unmarshal(storedBody, &output)
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}

		queries := planningstore.New(transaction)
		current, err := queries.GetSurveillancePlanItemForUpdate(ctx, command.PlanningItemID)
		if errors.Is(err, pgx.ErrNoRows) {
			return application.ErrNotFound
		}
		if err != nil {
			return err
		}
		if current.Revision != command.ExpectedRevision {
			return fmt.Errorf("%w: Planning item revision conflict", application.ErrConflict)
		}
		status, owner, nextAction, auditAction, err := decideTransition(actor, Status(current.Status), command.Decision)
		if err != nil {
			return err
		}
		now := service.clock().UTC()
		updated, err := queries.UpdateSurveillancePlanDecision(ctx, planningstore.UpdateSurveillancePlanDecisionParams{
			ID: current.ID, Status: string(status), CurrentOwnerRole: string(owner), NextAction: nextAction,
			UpdatedAt: pgtype.Timestamptz{Time: now, Valid: true}, Revision: current.Revision,
		})
		if errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("%w: Planning item revision conflict", application.ErrConflict)
		}
		if err != nil {
			return err
		}
		output = Item{
			ID: updated.ID, Title: updated.Title, PlanYear: updated.PlanYear,
			OrganizationID: updated.OrganizationID, OrganizationName: current.LegalName,
			InspectionType: updated.InspectionType, ScheduledDate: updated.ScheduledDate.Time.Format("2006-01-02"),
			EstimatedBudget: updated.EstimatedBudget, Status: Status(updated.Status),
			CurrentOwnerRole: identity.Role(updated.CurrentOwnerRole), NextAction: updated.NextAction,
			Revision: updated.Revision,
		}
		responseBody, err := json.Marshal(output)
		if err != nil {
			return err
		}
		actorRole := ""
		if len(actor.Roles) > 0 {
			actorRole = string(actor.Roles[0])
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO audit_events (
				event_id, occurred_at, actor_subject_id, actor_role, organization_id, action,
				entity_type, entity_id, entity_version, before_status, after_status, reason,
				operation_id, correlation_id, request_id, details
			) VALUES ($1, $2, $3, $4, $5, $6, 'SURVEILLANCE_PLAN', $7, $8, $9, $10, $11, $12, $12, $12, '{}'::jsonb)
		`, service.idGenerator("audit-plan"), now, actor.SubjectID, actorRole, current.OrganizationID,
			auditAction, current.ID, updated.Revision, current.Status, updated.Status,
			strings.TrimSpace(command.Reason), command.OperationID); err != nil {
			return err
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO outbox_messages (id, topic, aggregate_type, aggregate_id, payload, available_at)
			VALUES ($1, 'planning.decision.recorded', 'SURVEILLANCE_PLAN', $2, $3, $4)
		`, service.idGenerator("outbox-plan"), current.ID, responseBody, now); err != nil {
			return err
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO idempotency_responses (
				scope, operation_id, semantic_hash, response_status, response_headers, response_body, created_at
			) VALUES ($1, $2, $3, 200, '{}'::jsonb, $4, $5)
		`, scope, command.OperationID, semanticHash, responseBody, now); err != nil {
			return err
		}
		return nil
	})
	return output, err
}

func decideTransition(actor identity.Principal, status Status, decision Decision) (Status, identity.Role, string, string, error) {
	switch decision {
	case DecisionApproveBudget:
		if !actor.HasRole(identity.RoleFinance) {
			return "", "", "", "", fmt.Errorf("%w: Finance Review authority is required", application.ErrForbidden)
		}
		if status != StatusFinanceReview {
			return "", "", "", "", fmt.Errorf("%w: Planning item is not at Finance Review", application.ErrConflict)
		}
		return StatusGeneralManagerReview, identity.RoleGeneralManager, "General Manager to review operational scope", "PLANNING_BUDGET_APPROVED", nil
	case DecisionForwardForFinalApproval:
		if !actor.HasRole(identity.RoleGeneralManager) {
			return "", "", "", "", fmt.Errorf("%w: General Manager authority is required", application.ErrForbidden)
		}
		if status != StatusGeneralManagerReview {
			return "", "", "", "", fmt.Errorf("%w: Planning item is not at General Manager review", application.ErrConflict)
		}
		return StatusExecutiveDirectorReview, identity.RoleExecutiveDirector, "Executive Director to approve or return plan", "PLANNING_FORWARDED_FOR_FINAL_APPROVAL", nil
	case DecisionApprovePlan:
		if !actor.HasRole(identity.RoleExecutiveDirector) {
			return "", "", "", "", fmt.Errorf("%w: Executive Director authority is required", application.ErrForbidden)
		}
		if status != StatusExecutiveDirectorReview {
			return "", "", "", "", fmt.Errorf("%w: Planning item is not at Executive Director review", application.ErrConflict)
		}
		return StatusGeneralManagerRelease, identity.RoleGeneralManager, "General Manager to release approved plan", "PLANNING_APPROVED", nil
	case DecisionReleasePlan:
		if !actor.HasRole(identity.RoleGeneralManager) {
			return "", "", "", "", fmt.Errorf("%w: General Manager authority is required", application.ErrForbidden)
		}
		if status != StatusGeneralManagerRelease {
			return "", "", "", "", fmt.Errorf("%w: Planning item is not ready for General Manager release", application.ErrConflict)
		}
		return StatusReleased, identity.RoleDepartmentManager, "Department Manager to prepare the scheduled Audit", "PLANNING_RELEASED", nil
	case DecisionReturnForRevision:
		allowed := (actor.HasRole(identity.RoleFinance) && status == StatusFinanceReview) ||
			(actor.HasRole(identity.RoleGeneralManager) && (status == StatusGeneralManagerReview || status == StatusGeneralManagerRelease)) ||
			(actor.HasRole(identity.RoleExecutiveDirector) && status == StatusExecutiveDirectorReview)
		if !allowed {
			return "", "", "", "", fmt.Errorf("%w: current role and stage cannot return this item", application.ErrForbidden)
		}
		return StatusReturned, identity.RoleDepartmentManager, "Department Manager to revise and resubmit plan", "PLANNING_RETURNED_FOR_REVISION", nil
	default:
		return "", "", "", "", fmt.Errorf("%w: unsupported planning decision", application.ErrInvalid)
	}
}

func itemFromList(record planningstore.ListSurveillancePlanItemsRow) Item {
	return Item{
		ID: record.ID, Title: record.Title, PlanYear: record.PlanYear,
		OrganizationID: record.OrganizationID, OrganizationName: record.LegalName,
		InspectionType: record.InspectionType, ScheduledDate: record.ScheduledDate.Time.Format("2006-01-02"),
		EstimatedBudget: record.EstimatedBudget, Status: Status(record.Status),
		CurrentOwnerRole: identity.Role(record.CurrentOwnerRole), NextAction: record.NextAction,
		Revision: record.Revision,
	}
}

func boundedLimit(limit int32) int32 {
	if limit <= 0 || limit > 100 {
		return 100
	}
	return limit
}

func randomID(prefix string) string {
	bytes := make([]byte, 12)
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}
	return prefix + "-" + hex.EncodeToString(bytes)
}
