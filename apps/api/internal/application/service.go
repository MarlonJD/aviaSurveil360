package application

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	findingstore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/findings/store/postgres"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	inspectionstore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/inspections/store/postgres"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/idempotency"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/potentialfindings"
	potentialstore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/potentialfindings/store/postgres"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/reports"
	reportstore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/reports/store/postgres"
	"github.com/jackc/pgx/v5"
)

var (
	ErrForbidden = errors.New("forbidden")
	ErrConflict  = errors.New("conflict")
	ErrInvalid   = errors.New("invalid command")
	ErrNotFound  = errors.New("not found")
)

type Dependencies struct {
	Clock                     func() time.Time
	IDGenerator               func(string) string
	FindingReferenceGenerator func() string
}

type Service struct {
	pool                      *database.Pool
	clock                     func() time.Time
	idGenerator               func(string) string
	findingReferenceGenerator func() string
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
	return &Service{pool: pool, clock: clock, idGenerator: idGenerator, findingReferenceGenerator: dependencies.FindingReferenceGenerator}
}

type commandEnvelope struct {
	OperationID   string
	CorrelationID string
	Kind          string
	EntityID      string
	Semantic      any
}

type transition[T any] struct {
	Response       T
	OrganizationID string
	Action         string
	EntityType     string
	EntityID       string
	EntityVersion  int64
	BeforeStatus   string
	AfterStatus    string
	Reason         string
	ClosureBasis   string
	SyncKind       string
	OutboxTopic    string
}

func executeTransition[T any](ctx context.Context, service *Service, actor identity.Principal, envelope commandEnvelope, handler func(context.Context, pgx.Tx) (transition[T], error)) (T, error) {
	var zero T
	if actor.SubjectID == "" || envelope.OperationID == "" || envelope.CorrelationID == "" || envelope.Kind == "" || envelope.EntityID == "" {
		return zero, fmt.Errorf("%w: actor, operation, correlation, kind, and entity are required", ErrInvalid)
	}
	semanticHash, err := idempotency.SemanticHash(struct {
		Kind     string `json:"kind"`
		EntityID string `json:"entityId"`
		Payload  any    `json:"payload"`
	}{Kind: envelope.Kind, EntityID: envelope.EntityID, Payload: envelope.Semantic})
	if err != nil {
		return zero, fmt.Errorf("hash command: %w", err)
	}
	scope := actor.SubjectID + ":" + envelope.Kind
	var response T
	err = database.WithinTransaction(ctx, service.pool, func(ctx context.Context, transaction pgx.Tx) error {
		lockKey := scope + ":" + envelope.OperationID
		if _, err := transaction.Exec(ctx, "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", lockKey); err != nil {
			return fmt.Errorf("lock idempotent command: %w", err)
		}
		var storedHash string
		var storedBody []byte
		err := transaction.QueryRow(ctx, `
			SELECT semantic_hash, response_body
			FROM idempotency_responses
			WHERE scope = $1 AND operation_id = $2
		`, scope, envelope.OperationID).Scan(&storedHash, &storedBody)
		if err == nil {
			if storedHash != semanticHash {
				return idempotency.ErrOperationIDReuse
			}
			if err := json.Unmarshal(storedBody, &response); err != nil {
				return fmt.Errorf("decode idempotent response: %w", err)
			}
			return nil
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return fmt.Errorf("read idempotent response: %w", err)
		}

		result, err := handler(ctx, transaction)
		if err != nil {
			return err
		}
		response = result.Response
		responseBody, err := json.Marshal(response)
		if err != nil {
			return fmt.Errorf("encode command response: %w", err)
		}
		now := service.clock().UTC()
		role := ""
		if len(actor.Roles) > 0 {
			role = string(actor.Roles[0])
		}
		if result.BeforeStatus != result.AfterStatus {
			if _, err := transaction.Exec(ctx, `
				INSERT INTO audit_events (
					sequence_id, event_id, occurred_at, actor_subject_id, actor_role, organization_id,
					action, entity_type, entity_id, entity_version, before_status, after_status,
					reason, operation_id, correlation_id, closure_basis, request_id, details
				) VALUES (
					nextval(pg_get_serial_sequence('audit_events', 'sequence_id')), $1, $2, $3, $4, $5,
					$6, $7, $8, $9, $10, $11, NULLIF($12, ''), $13, $14, NULLIF($15, ''), $14, '{}'::jsonb
				)
			`, service.idGenerator("audit"), now, actor.SubjectID, role, result.OrganizationID, result.Action, result.EntityType, result.EntityID, result.EntityVersion, result.BeforeStatus, result.AfterStatus, result.Reason, envelope.OperationID, envelope.CorrelationID, result.ClosureBasis); err != nil {
				return fmt.Errorf("append audit event: %w", err)
			}
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO authorized_sync_changes (subject_id, organization_id, kind, entity_id, entity_revision, payload, changed_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, actor.SubjectID, result.OrganizationID, result.SyncKind, result.EntityID, result.EntityVersion, responseBody, now); err != nil {
			return fmt.Errorf("append authorized sync change: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO outbox_messages (id, topic, aggregate_type, aggregate_id, payload, available_at)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, service.idGenerator("outbox"), result.OutboxTopic, result.EntityType, result.EntityID, responseBody, now); err != nil {
			return fmt.Errorf("enqueue server outbox: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO idempotency_responses (
				scope, operation_id, semantic_hash, response_status, response_headers, response_body, created_at
			) VALUES ($1, $2, $3, 200, '{}'::jsonb, $4, $5)
		`, scope, envelope.OperationID, semanticHash, responseBody, now); err != nil {
			return fmt.Errorf("store idempotent response: %w", err)
		}
		return nil
	})
	if err != nil {
		return zero, err
	}
	return response, nil
}

type ConvertPotentialFindingCommand struct {
	OperationID           string
	CorrelationID         string
	PotentialFindingID    string
	ExpectedRevision      int64
	Severity              potentialfindings.Severity
	CAPRequired           bool
	EvidenceRequired      bool
	DueDate               *time.Time
	RequirementsSpecified bool
}

type ConvertPotentialFindingResult struct {
	PotentialFindingID       string `json:"potentialFindingId"`
	PotentialFindingStatus   string `json:"potentialFindingStatus"`
	PotentialFindingRevision int64  `json:"potentialFindingRevision"`
	FindingID                string `json:"findingId"`
	FindingReference         string `json:"findingReference"`
	FindingStatus            string `json:"findingStatus"`
}

func (service *Service) ConvertPotentialFinding(ctx context.Context, actor identity.Principal, command ConvertPotentialFindingCommand) (ConvertPotentialFindingResult, error) {
	capRequired := command.CAPRequired
	evidenceRequired := command.EvidenceRequired
	if !command.RequirementsSpecified {
		capRequired = true
		evidenceRequired = true
	}
	semantic := struct {
		ExpectedRevision int64                      `json:"expectedRevision"`
		Severity         potentialfindings.Severity `json:"severity"`
		CAPRequired      bool                       `json:"capRequired"`
		EvidenceRequired bool                       `json:"evidenceRequired"`
		DueDate          *time.Time                 `json:"dueDate"`
	}{ExpectedRevision: command.ExpectedRevision, Severity: command.Severity, CAPRequired: capRequired, EvidenceRequired: evidenceRequired, DueDate: command.DueDate}
	return executeTransition(ctx, service, actor, commandEnvelope{
		OperationID: command.OperationID, CorrelationID: command.CorrelationID, Kind: "convert_potential_finding",
		EntityID: command.PotentialFindingID, Semantic: semantic,
	}, func(ctx context.Context, transaction pgx.Tx) (transition[ConvertPotentialFindingResult], error) {
		if !actor.HasRole(identity.RoleLeadInspector) {
			return transition[ConvertPotentialFindingResult]{}, fmt.Errorf("%w: Lead Inspector role required", ErrForbidden)
		}
		record, err := potentialstore.New(transaction).GetPotentialFindingForUpdate(ctx, command.PotentialFindingID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return transition[ConvertPotentialFindingResult]{}, ErrNotFound
			}
			return transition[ConvertPotentialFindingResult]{}, err
		}
		potentialStatus := record.Status
		revision := record.Revision
		inspectionID := record.InspectionID
		organizationID := record.OrganizationID
		decision, err := potentialfindings.Decide(potentialfindings.DecideInput{
			Actor: actor, Status: potentialfindings.Status(potentialStatus), Revision: revision, ExpectedRevision: command.ExpectedRevision,
			Decision: potentialfindings.DecisionConvert, Severity: command.Severity,
		})
		if err != nil {
			return transition[ConvertPotentialFindingResult]{}, fmt.Errorf("%w: %v", ErrConflict, err)
		}
		findingID := service.idGenerator("finding")
		findingReference := ""
		if service.findingReferenceGenerator != nil {
			findingReference = service.findingReferenceGenerator()
		} else {
			var publicSequence int64
			if err := transaction.QueryRow(ctx, "SELECT nextval('finding_public_number_sequence')").Scan(&publicSequence); err != nil {
				return transition[ConvertPotentialFindingResult]{}, err
			}
			findingReference = fmt.Sprintf("OPS-%d-%03d", service.clock().UTC().Year(), publicSequence)
		}
		findingStatus := "WAITING_FOR_CAP"
		nextAction := "Auditee to submit CAP"
		if !capRequired {
			findingStatus = "PENDING_CLOSURE"
			nextAction = "CAA verifies closure path"
		}
		now := service.clock().UTC()
		if _, err := transaction.Exec(ctx, `
			INSERT INTO findings (
				id, reference, potential_finding_id, inspection_id, organization_id, severity, status,
				owner_subject_id, next_action, due_date, revision, cap_required, evidence_required,
				issued_at, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9, 1, $10, $11, $12, $12, $12)
		`, findingID, findingReference, command.PotentialFindingID, inspectionID, organizationID,
			string(command.Severity), findingStatus, nextAction, command.DueDate, capRequired,
			evidenceRequired, now); err != nil {
			return transition[ConvertPotentialFindingResult]{}, fmt.Errorf("create canonical Finding: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			UPDATE potential_findings
			SET status = $2, revision = $3, converted_finding_id = $4, updated_at = $5
			WHERE id = $1
		`, command.PotentialFindingID, string(decision.Status), decision.Revision, findingID, service.clock().UTC()); err != nil {
			return transition[ConvertPotentialFindingResult]{}, fmt.Errorf("record Potential Finding conversion: %w", err)
		}
		response := ConvertPotentialFindingResult{
			PotentialFindingID: command.PotentialFindingID, PotentialFindingStatus: string(decision.Status),
			PotentialFindingRevision: decision.Revision, FindingID: findingID, FindingReference: findingReference,
			FindingStatus: findingStatus,
		}
		return transition[ConvertPotentialFindingResult]{
			Response: response, OrganizationID: organizationID, Action: "potential_finding.converted",
			EntityType: "potential_finding", EntityID: command.PotentialFindingID, EntityVersion: decision.Revision,
			BeforeStatus: potentialStatus, AfterStatus: string(decision.Status), SyncKind: "potential_finding", OutboxTopic: "potential_finding.converted",
		}, nil
	})
}

type FindingProjection struct {
	ID             string `json:"id"`
	Reference      string `json:"reference"`
	OrganizationID string `json:"organizationId"`
	RelatedAuditID string `json:"relatedAuditId"`
	Severity       string `json:"severity"`
	Status         string `json:"status"`
	Owner          string `json:"owner"`
	NextAction     string `json:"nextAction"`
	DueDate        string `json:"dueDate"`
	Revision       int64  `json:"revision"`
}

func (service *Service) ListFindings(ctx context.Context, actor identity.Principal) ([]FindingProjection, error) {
	store := findingstore.New(service.pool)
	var records []findingstore.Finding
	var err error
	if actor.HasRole(identity.RoleAuditee) {
		records, err = store.ListFindingsByOrganization(ctx, actor.OrganizationID)
	} else if !actor.IsCAA() {
		return nil, ErrForbidden
	} else {
		records, err = store.ListFindings(ctx)
	}
	if err != nil {
		return nil, err
	}
	items := make([]FindingProjection, 0, len(records))
	for _, record := range records {
		items = append(items, findingProjection(record))
	}
	return items, nil
}

func (service *Service) GetFinding(ctx context.Context, actor identity.Principal, findingID string) (FindingProjection, error) {
	record, err := findingstore.New(service.pool).GetFinding(ctx, findingID)
	if errors.Is(err, pgx.ErrNoRows) {
		return FindingProjection{}, ErrNotFound
	}
	if err != nil {
		return FindingProjection{}, err
	}
	if actor.HasRole(identity.RoleAuditee) {
		if actor.OrganizationID != record.OrganizationID {
			return FindingProjection{}, ErrNotFound
		}
	} else if !actor.IsCAA() {
		return FindingProjection{}, ErrForbidden
	}
	return findingProjection(record), nil
}

func findingProjection(record findingstore.Finding) FindingProjection {
	owner := ""
	if record.OwnerSubjectID != nil {
		owner = *record.OwnerSubjectID
	}
	dueDate := ""
	if record.DueDate.Valid {
		dueDate = record.DueDate.Time.UTC().Format("2006-01-02")
	}
	return FindingProjection{
		ID: record.ID, Reference: record.Reference, OrganizationID: record.OrganizationID,
		RelatedAuditID: record.InspectionID, Severity: record.Severity, Status: record.Status,
		Owner: owner, NextAction: record.NextAction, DueDate: dueDate, Revision: record.Revision,
	}
}

type DecideReportCommand struct {
	OperationID      string
	CorrelationID    string
	ReportVersionID  string
	ExpectedRevision int64
	Decision         reports.Decision
	Reason           string
}

type DecideReportResult struct {
	ReportVersionID string         `json:"reportVersionId"`
	Status          reports.Status `json:"status"`
	Revision        int64          `json:"revision"`
	IssuedAt        *time.Time     `json:"issuedAt"`
}

func (service *Service) DecideReport(ctx context.Context, actor identity.Principal, command DecideReportCommand) (DecideReportResult, error) {
	semantic := struct {
		ExpectedRevision int64            `json:"expectedRevision"`
		Decision         reports.Decision `json:"decision"`
		Reason           string           `json:"reason"`
	}{command.ExpectedRevision, command.Decision, command.Reason}
	return executeTransition(ctx, service, actor, commandEnvelope{
		OperationID: command.OperationID, CorrelationID: command.CorrelationID, Kind: "decide_report",
		EntityID: command.ReportVersionID, Semantic: semantic,
	}, func(ctx context.Context, transaction pgx.Tx) (transition[DecideReportResult], error) {
		store := reportstore.New(transaction)
		state, err := store.GetReportApprovalState(ctx, command.ReportVersionID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return transition[DecideReportResult]{}, ErrNotFound
			}
			return transition[DecideReportResult]{}, err
		}
		version, err := store.GetReportVersion(ctx, command.ReportVersionID)
		if err != nil {
			return transition[DecideReportResult]{}, err
		}
		inspection, err := inspectionstore.New(transaction).GetInspection(ctx, version.InspectionID)
		if err != nil {
			return transition[DecideReportResult]{}, err
		}
		status := state.Status
		revision := state.Revision
		organizationID := inspection.OrganizationID
		decision, err := reports.Decide(reports.DecideInput{
			Actor: actor, Status: reports.Status(status), Version: revision, ExpectedVersion: command.ExpectedRevision,
			Decision: command.Decision, Reason: command.Reason,
		})
		if err != nil {
			if !actor.HasRole(identity.RoleDepartmentManager, identity.RoleGeneralManager, identity.RoleExecutiveDirector) {
				return transition[DecideReportResult]{}, fmt.Errorf("%w: %v", ErrForbidden, err)
			}
			return transition[DecideReportResult]{}, fmt.Errorf("%w: %v", ErrConflict, err)
		}
		nextRevision := revision + 1
		var issuedAt *time.Time
		if decision.Status == reports.StatusLocked {
			value := service.clock().UTC()
			issuedAt = &value
		}
		if _, err := transaction.Exec(ctx, `
			UPDATE report_approval_states SET status = $2, revision = $3, issued_at = $4, updated_at = $5 WHERE report_version_id = $1
		`, command.ReportVersionID, string(decision.Status), nextRevision, issuedAt, service.clock().UTC()); err != nil {
			return transition[DecideReportResult]{}, err
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO report_decisions (id, report_version_id, expected_version, decision, reason, decided_by_subject_id, decided_at)
			VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6, $7)
		`, service.idGenerator("report-decision"), command.ReportVersionID, command.ExpectedRevision, string(command.Decision), command.Reason, actor.SubjectID, service.clock().UTC()); err != nil {
			return transition[DecideReportResult]{}, err
		}
		response := DecideReportResult{ReportVersionID: command.ReportVersionID, Status: decision.Status, Revision: nextRevision, IssuedAt: issuedAt}
		return transition[DecideReportResult]{
			Response: response, OrganizationID: organizationID, Action: "report.decision_recorded", EntityType: "report_version",
			EntityID: command.ReportVersionID, EntityVersion: nextRevision, BeforeStatus: status, AfterStatus: string(decision.Status),
			Reason: command.Reason, SyncKind: "report_version", OutboxTopic: "report.decision_recorded",
		}, nil
	})
}

func randomID(prefix string) string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		panic(fmt.Sprintf("generate random ID: %v", err))
	}
	return prefix + "-" + hex.EncodeToString(bytes)
}
