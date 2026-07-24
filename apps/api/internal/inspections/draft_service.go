package inspections

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/idempotency"
	"github.com/jackc/pgx/v5"
)

var (
	ErrPackageDraftForbidden = errors.New("inspection package draft forbidden")
	ErrPackageDraftConflict  = errors.New("inspection package draft conflict")
	ErrPackageDraftInvalid   = errors.New("invalid inspection package draft command")
	ErrPackageDraftNotFound  = errors.New("inspection package draft not found")
)

type PackageDraftQuestion struct {
	ID                  string   `json:"id"`
	Prompt              string   `json:"prompt"`
	WhyIncluded         string   `json:"whyIncluded"`
	ExpectedEvidence    []string `json:"expectedEvidence"`
	ConfiguredReference string   `json:"configuredReference"`
}

type PackageDraft struct {
	ID               string                 `json:"id"`
	SourceAuditID    string                 `json:"sourceAuditId"`
	OrganizationID   string                 `json:"organizationId"`
	OrganizationName string                 `json:"organizationName"`
	ApplicationType  string                 `json:"applicationType"`
	Domain           string                 `json:"domain"`
	Status           string                 `json:"status"`
	PackageVersion   int64                  `json:"packageVersion"`
	Revision         int64                  `json:"revision"`
	RiskFocus        []string               `json:"riskFocus"`
	Questions        []PackageDraftQuestion `json:"questions"`
	UpdatedAt        time.Time              `json:"updatedAt"`
}

type SavePackageDraftCommand struct {
	OperationID      string
	IdempotencyKey   string
	PackageDraftID   string
	ExpectedRevision int64
	RiskFocus        []string
}

type PackageDraftDependencies struct {
	Clock       func() time.Time
	IDGenerator func(string) string
}

type PackageDraftService struct {
	pool        *database.Pool
	clock       func() time.Time
	idGenerator func(string) string
}

func NewPackageDraftService(
	pool *database.Pool,
	dependencies PackageDraftDependencies,
) *PackageDraftService {
	clock := dependencies.Clock
	if clock == nil {
		clock = time.Now
	}
	idGenerator := dependencies.IDGenerator
	if idGenerator == nil {
		idGenerator = randomDraftID
	}
	return &PackageDraftService{pool: pool, clock: clock, idGenerator: idGenerator}
}

func (service *PackageDraftService) Get(
	ctx context.Context,
	actor identity.Principal,
	draftID string,
) (PackageDraft, error) {
	if !actor.HasRole(identity.RoleDepartmentManager) {
		return PackageDraft{}, fmt.Errorf("%w: Department Manager authority is required", ErrPackageDraftForbidden)
	}
	if strings.TrimSpace(draftID) == "" {
		return PackageDraft{}, ErrPackageDraftInvalid
	}
	return getPackageDraft(ctx, service.pool, draftID, false)
}

func (service *PackageDraftService) Save(
	ctx context.Context,
	actor identity.Principal,
	command SavePackageDraftCommand,
) (PackageDraft, error) {
	if !actor.HasRole(identity.RoleDepartmentManager) {
		return PackageDraft{}, fmt.Errorf("%w: Department Manager authority is required", ErrPackageDraftForbidden)
	}
	riskFocus := make([]string, 0, len(command.RiskFocus))
	for _, item := range command.RiskFocus {
		item = strings.TrimSpace(item)
		if item != "" {
			riskFocus = append(riskFocus, item)
		}
	}
	if command.OperationID == "" || command.IdempotencyKey == "" ||
		command.PackageDraftID == "" || command.ExpectedRevision <= 0 ||
		len(riskFocus) == 0 {
		return PackageDraft{}, ErrPackageDraftInvalid
	}
	semanticHash, err := idempotency.SemanticHash(struct {
		IdempotencyKey   string   `json:"idempotencyKey"`
		PackageDraftID   string   `json:"packageDraftId"`
		ExpectedRevision int64    `json:"expectedRevision"`
		RiskFocus        []string `json:"riskFocus"`
	}{command.IdempotencyKey, command.PackageDraftID, command.ExpectedRevision, riskFocus})
	if err != nil {
		return PackageDraft{}, err
	}
	scope := actor.SubjectID + ":save_inspection_package_draft"
	var output PackageDraft
	err = database.WithinTransaction(ctx, service.pool, func(ctx context.Context, transaction pgx.Tx) error {
		if _, err := transaction.Exec(ctx,
			"SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
			scope+":idempotency:"+command.IdempotencyKey,
		); err != nil {
			return err
		}
		if _, err := transaction.Exec(ctx,
			"SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
			scope+":operation:"+command.OperationID,
		); err != nil {
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
		idempotencyKey := "command:" + scope + ":idempotency:" + command.IdempotencyKey
		var reused bool
		if err := transaction.QueryRow(ctx, `
			SELECT EXISTS (
				SELECT 1 FROM outbox_messages WHERE idempotency_key = $1
			)
		`, idempotencyKey).Scan(&reused); err != nil {
			return err
		}
		if reused {
			return idempotency.ErrOperationIDReuse
		}
		current, err := getPackageDraft(ctx, transaction, command.PackageDraftID, true)
		if err != nil {
			return err
		}
		if current.Revision != command.ExpectedRevision {
			return ErrPackageDraftConflict
		}
		riskFocusJSON, err := json.Marshal(riskFocus)
		if err != nil {
			return err
		}
		now := service.clock().UTC()
		if err := transaction.QueryRow(ctx, `
			UPDATE inspection_package_drafts
			SET risk_focus = $2, revision = revision + 1, updated_at = $3
			WHERE id = $1 AND revision = $4 AND tombstoned_at IS NULL
			RETURNING revision
		`, command.PackageDraftID, riskFocusJSON, now, command.ExpectedRevision).Scan(
			&current.Revision,
		); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return ErrPackageDraftConflict
			}
			return err
		}
		current.RiskFocus = riskFocus
		current.UpdatedAt = now
		output = current
		responseBody, err = json.Marshal(output)
		if err != nil {
			return err
		}
		role := string(identity.RoleDepartmentManager)
		auditID := service.idGenerator("audit-package-draft")
		outboxID := service.idGenerator("outbox-package-draft")
		if _, err := transaction.Exec(ctx, `
			INSERT INTO audit_events (
				event_id, occurred_at, actor_subject_id, actor_role, organization_id,
				action, entity_type, entity_id, entity_version, before_status,
				after_status, operation_id, correlation_id, request_id, details
			) VALUES (
				$1, $2, $3, $4, $5, 'inspection_package_draft.saved',
				'inspection_package_draft', $6, $7, 'DRAFT', 'DRAFT',
				$8, $8, $8, '{}'::jsonb
			)
		`, auditID, now, actor.SubjectID, role, output.OrganizationID,
			output.ID, output.Revision, command.OperationID); err != nil {
			return err
		}
		var changeID int64
		if err := transaction.QueryRow(ctx, `
			INSERT INTO authorized_sync_changes (
				subject_id, organization_id, kind, entity_id, entity_revision,
				payload, changed_at, operation_id, correlation_id
			) VALUES (
				$1, $2, 'inspection_package_draft', $3, $4, $5, $6, $7, $7
			)
			RETURNING sequence_id
		`, actor.SubjectID, output.OrganizationID, output.ID, output.Revision,
			responseBody, now, command.OperationID).Scan(&changeID); err != nil {
			return err
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO outbox_messages (
				id, topic, aggregate_type, aggregate_id, payload, available_at,
				idempotency_key, operation_id, correlation_id
			) VALUES (
				$1, 'inspection_package_draft.saved', 'inspection_package_draft',
				$2, $3, $4, $5, $6, $6
			)
		`, outboxID, output.ID, responseBody, now, idempotencyKey,
			command.OperationID); err != nil {
			return err
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO idempotency_responses (
				scope, operation_id, semantic_hash, response_status,
				response_headers, response_body, created_at
			) VALUES ($1, $2, $3, 200, '{}'::jsonb, $4, $5)
		`, scope, command.OperationID, semanticHash, responseBody, now); err != nil {
			return err
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO command_transaction_links (
				operation_id, idempotency_scope, audit_event_id,
				change_sequence_id, outbox_message_id, created_at
			) VALUES ($1, $2, $3, $4, $5, $6)
		`, command.OperationID, scope, auditID, changeID, outboxID, now); err != nil {
			return err
		}
		return nil
	})
	return output, err
}

type draftRowQuerier interface {
	QueryRow(context.Context, string, ...any) pgx.Row
}

func getPackageDraft(
	ctx context.Context,
	querier draftRowQuerier,
	draftID string,
	lock bool,
) (PackageDraft, error) {
	query := `
		SELECT draft.id, draft.source_inspection_id, draft.organization_id,
		       organization.legal_name,
		       COALESCE(intake.values->>'applicationType', inspection.inspection_type),
		       COALESCE(intake.values->>'domain', inspection.inspection_type),
		       draft.status, draft.package_version, draft.revision,
		       draft.risk_focus, draft.question_snapshot, draft.updated_at
		FROM inspection_package_drafts draft
		JOIN inspections inspection ON inspection.id = draft.source_inspection_id
		JOIN organizations organization ON organization.id = draft.organization_id
		LEFT JOIN LATERAL (
			SELECT candidate.values
			FROM planning_intake_drafts candidate
			WHERE candidate.values->>'preparedAuditId' = draft.source_inspection_id
			  AND candidate.tombstoned_at IS NULL
			ORDER BY candidate.updated_at DESC, candidate.id
			LIMIT 1
		) intake ON true
		WHERE draft.id = $1
		  AND draft.tombstoned_at IS NULL
	`
	if lock {
		query += " FOR UPDATE OF draft"
	}
	var output PackageDraft
	var riskFocusJSON, questionsJSON []byte
	if err := querier.QueryRow(ctx, query, draftID).Scan(
		&output.ID, &output.SourceAuditID, &output.OrganizationID,
		&output.OrganizationName, &output.ApplicationType, &output.Domain,
		&output.Status, &output.PackageVersion, &output.Revision, &riskFocusJSON,
		&questionsJSON, &output.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return PackageDraft{}, ErrPackageDraftNotFound
		}
		return PackageDraft{}, err
	}
	if err := json.Unmarshal(riskFocusJSON, &output.RiskFocus); err != nil {
		return PackageDraft{}, err
	}
	if err := json.Unmarshal(questionsJSON, &output.Questions); err != nil {
		return PackageDraft{}, err
	}
	return output, nil
}

func randomDraftID(prefix string) string {
	var bytes [12]byte
	if _, err := rand.Read(bytes[:]); err != nil {
		panic(fmt.Sprintf("generate package draft identifier: %v", err))
	}
	return prefix + "-" + hex.EncodeToString(bytes[:])
}
