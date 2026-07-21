package application

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/caps"
	capstore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/caps/store/postgres"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/evidence"
	evidencestore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/evidence/store/postgres"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/findings"
	findingstore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/findings/store/postgres"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/jackc/pgx/v5"
)

type SubmitCAPCommand struct {
	OperationID             string
	CorrelationID           string
	FindingID               string
	ExpectedFindingRevision int64
	RootCause               string
	CorrectiveAction        string
	PreventiveAction        string
	ResponsiblePerson       string
	TargetCompletionDate    time.Time
	CommentToCAA            string
}

type SubmitCAPResult struct {
	CAPRevisionID   string          `json:"capRevisionId"`
	CAPID           string          `json:"capId"`
	CAPRevision     int64           `json:"capRevision"`
	CAPStatus       caps.Status     `json:"capStatus"`
	FindingID       string          `json:"findingId"`
	FindingStatus   findings.Status `json:"findingStatus"`
	FindingRevision int64           `json:"findingRevision"`
}

func (service *Service) SubmitCAP(ctx context.Context, actor identity.Principal, command SubmitCAPCommand) (SubmitCAPResult, error) {
	semantic := struct {
		ExpectedFindingRevision int64     `json:"expectedFindingRevision"`
		RootCause               string    `json:"rootCause"`
		CorrectiveAction        string    `json:"correctiveAction"`
		PreventiveAction        string    `json:"preventiveAction"`
		ResponsiblePerson       string    `json:"responsiblePerson"`
		TargetCompletionDate    time.Time `json:"targetCompletionDate"`
		CommentToCAA            string    `json:"commentToCAA"`
	}{
		ExpectedFindingRevision: command.ExpectedFindingRevision,
		RootCause:               strings.TrimSpace(command.RootCause),
		CorrectiveAction:        strings.TrimSpace(command.CorrectiveAction),
		PreventiveAction:        strings.TrimSpace(command.PreventiveAction),
		ResponsiblePerson:       strings.TrimSpace(command.ResponsiblePerson),
		TargetCompletionDate:    command.TargetCompletionDate.UTC(),
		CommentToCAA:            strings.TrimSpace(command.CommentToCAA),
	}
	return executeTransition(ctx, service, actor, commandEnvelope{
		OperationID: command.OperationID, CorrelationID: command.CorrelationID,
		Kind: "submit_cap", EntityID: command.FindingID, Semantic: semantic,
	}, func(ctx context.Context, transaction pgx.Tx) (transition[SubmitCAPResult], error) {
		if !actor.HasRole(identity.RoleAuditee) {
			return transition[SubmitCAPResult]{}, fmt.Errorf("%w: Auditee role required", ErrForbidden)
		}
		if semantic.RootCause == "" || semantic.CorrectiveAction == "" || semantic.PreventiveAction == "" || semantic.ResponsiblePerson == "" || command.TargetCompletionDate.IsZero() {
			return transition[SubmitCAPResult]{}, fmt.Errorf("%w: complete CAP content and target date are required", ErrInvalid)
		}

		finding, err := findingstore.New(transaction).GetFindingForUpdate(ctx, command.FindingID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return transition[SubmitCAPResult]{}, ErrNotFound
			}
			return transition[SubmitCAPResult]{}, err
		}
		status := finding.Status
		revision := finding.Revision
		organizationID := finding.OrganizationID
		if !actor.BelongsTo(organizationID) {
			return transition[SubmitCAPResult]{}, fmt.Errorf("%w: Finding is outside the Auditee organization", ErrForbidden)
		}
		decision, err := caps.Submit(caps.SubmitInput{
			Actor: actor, FindingOrganizationID: organizationID, FindingStatus: findings.Status(status),
			FindingRevision: revision, ExpectedFindingRevision: command.ExpectedFindingRevision,
		})
		if err != nil {
			return transition[SubmitCAPResult]{}, fmt.Errorf("%w: %v", ErrConflict, err)
		}

		capID := ""
		var latestRevision int64
		latestCAP, err := capstore.New(transaction).GetLatestCAPRevisionForFinding(ctx, command.FindingID)
		if errors.Is(err, pgx.ErrNoRows) {
			capID = service.idGenerator("cap")
			latestRevision = 0
		} else if err != nil {
			return transition[SubmitCAPResult]{}, fmt.Errorf("read current CAP revision: %w", err)
		} else {
			capID = latestCAP.CapID
			latestRevision = int64(latestCAP.Revision)
		}
		capRevision := latestRevision + 1
		capRevisionID := service.idGenerator("cap-revision")
		now := service.clock().UTC()
		if _, err := transaction.Exec(ctx, `
			INSERT INTO cap_revisions (
				id, cap_id, finding_id, organization_id, revision, status, root_cause, corrective_action,
				preventive_action, target_completion_date, submitted_by_subject_id, submitted_at,
				responsible_person, comment_to_caa
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NULLIF($14, ''))
		`, capRevisionID, capID, command.FindingID, organizationID, capRevision, string(decision.CAPStatus),
			semantic.RootCause, semantic.CorrectiveAction, semantic.PreventiveAction, command.TargetCompletionDate.UTC(),
			actor.SubjectID, now, semantic.ResponsiblePerson, semantic.CommentToCAA); err != nil {
			return transition[SubmitCAPResult]{}, fmt.Errorf("append CAP revision: %w", err)
		}
		findingRevision := revision + 1
		if _, err := transaction.Exec(ctx, `
			UPDATE findings
			SET status = $2, next_action = 'CAA reviews CAP', revision = $3, updated_at = $4
			WHERE id = $1
		`, command.FindingID, string(decision.FindingStatus), findingRevision, now); err != nil {
			return transition[SubmitCAPResult]{}, fmt.Errorf("advance Finding after CAP submission: %w", err)
		}

		response := SubmitCAPResult{
			CAPRevisionID: capRevisionID, CAPID: capID, CAPRevision: capRevision,
			CAPStatus: decision.CAPStatus, FindingID: command.FindingID,
			FindingStatus: decision.FindingStatus, FindingRevision: findingRevision,
		}
		return transition[SubmitCAPResult]{
			Response: response, OrganizationID: organizationID, Action: "cap.submitted",
			EntityType: "finding", EntityID: command.FindingID, EntityVersion: findingRevision,
			BeforeStatus: status, AfterStatus: string(decision.FindingStatus),
			SyncKind: "cap_revision", OutboxTopic: "cap.submitted",
		}, nil
	})
}

type ReviewCAPCommand struct {
	OperationID             string
	CorrelationID           string
	CAPRevisionID           string
	ExpectedCAPRevision     int64
	FindingID               string
	ExpectedFindingRevision int64
	Decision                caps.ReviewDecision
	CommentToAuditee        string
	InternalCAANote         string
}

type ReviewCAPResult struct {
	CAPRevisionID   string          `json:"capRevisionId"`
	CAPStatus       caps.Status     `json:"capStatus"`
	FindingID       string          `json:"findingId"`
	FindingStatus   findings.Status `json:"findingStatus"`
	FindingRevision int64           `json:"findingRevision"`
}

func (service *Service) ReviewCAP(ctx context.Context, actor identity.Principal, command ReviewCAPCommand) (ReviewCAPResult, error) {
	semantic := struct {
		CAPRevision      int64               `json:"capRevision"`
		FindingRevision  int64               `json:"findingRevision"`
		Decision         caps.ReviewDecision `json:"decision"`
		CommentToAuditee string              `json:"commentToAuditee"`
		InternalCAANote  string              `json:"internalCaaNote"`
	}{command.ExpectedCAPRevision, command.ExpectedFindingRevision, command.Decision, strings.TrimSpace(command.CommentToAuditee), strings.TrimSpace(command.InternalCAANote)}
	return executeTransition(ctx, service, actor, commandEnvelope{
		OperationID: command.OperationID, CorrelationID: command.CorrelationID,
		Kind: "review_cap", EntityID: command.CAPRevisionID, Semantic: semantic,
	}, func(ctx context.Context, transaction pgx.Tx) (transition[ReviewCAPResult], error) {
		if !actor.HasRole(identity.RoleInspector, identity.RoleLeadInspector, identity.RoleDepartmentManager) {
			return transition[ReviewCAPResult]{}, fmt.Errorf("%w: CAA review role required", ErrForbidden)
		}
		capRevisionRecord, err := capstore.New(transaction).GetCAPRevision(ctx, command.CAPRevisionID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return transition[ReviewCAPResult]{}, ErrNotFound
			}
			return transition[ReviewCAPResult]{}, err
		}
		if capRevisionRecord.FindingID != command.FindingID {
			return transition[ReviewCAPResult]{}, ErrNotFound
		}
		finding, err := findingstore.New(transaction).GetFindingForUpdate(ctx, command.FindingID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return transition[ReviewCAPResult]{}, ErrNotFound
			}
			return transition[ReviewCAPResult]{}, err
		}
		if capRevisionRecord.OrganizationID != finding.OrganizationID {
			return transition[ReviewCAPResult]{}, errors.New("CAP and Finding organization mismatch")
		}
		capStatus := capRevisionRecord.Status
		capRevision := int64(capRevisionRecord.Revision)
		findingID := finding.ID
		findingStatus := finding.Status
		findingRevision := finding.Revision
		organizationID := finding.OrganizationID
		if findingRevision != command.ExpectedFindingRevision {
			return transition[ReviewCAPResult]{}, fmt.Errorf("%w: stale Finding revision", ErrConflict)
		}
		decision, err := caps.Review(caps.ReviewInput{
			Actor: actor, CAPStatus: caps.Status(capStatus), CAPRevision: capRevision,
			ExpectedCAPRevision: command.ExpectedCAPRevision, FindingStatus: findings.Status(findingStatus),
			Decision: command.Decision, Reason: semantic.CommentToAuditee,
		})
		if err != nil {
			return transition[ReviewCAPResult]{}, fmt.Errorf("%w: %v", ErrConflict, err)
		}
		now := service.clock().UTC()
		if _, err := transaction.Exec(ctx, `
			INSERT INTO review_decisions (
				id, entity_type, entity_id, expected_revision, decision, reason,
				comment_to_auditee, internal_caa_note, decided_by_subject_id, decided_at
			) VALUES ($1, 'cap_revision', $2, $3, $4, NULLIF($5, ''), NULLIF($5, ''), NULLIF($6, ''), $7, $8)
		`, service.idGenerator("review-decision"), command.CAPRevisionID, command.ExpectedCAPRevision,
			string(command.Decision), semantic.CommentToAuditee, semantic.InternalCAANote, actor.SubjectID, now); err != nil {
			return transition[ReviewCAPResult]{}, fmt.Errorf("append CAP review decision: %w", err)
		}
		nextFindingRevision := findingRevision + 1
		if _, err := transaction.Exec(ctx, `
			UPDATE findings SET status = $2, next_action = $3, revision = $4, updated_at = $5 WHERE id = $1
		`, findingID, string(decision.FindingStatus), nextActionForFinding(decision.FindingStatus), nextFindingRevision, now); err != nil {
			return transition[ReviewCAPResult]{}, fmt.Errorf("advance Finding after CAP review: %w", err)
		}
		response := ReviewCAPResult{
			CAPRevisionID: command.CAPRevisionID, CAPStatus: decision.CAPStatus,
			FindingID: findingID, FindingStatus: decision.FindingStatus, FindingRevision: nextFindingRevision,
		}
		return transition[ReviewCAPResult]{
			Response: response, OrganizationID: organizationID, Action: "cap.reviewed",
			EntityType: "finding", EntityID: findingID, EntityVersion: nextFindingRevision,
			BeforeStatus: findingStatus, AfterStatus: string(decision.FindingStatus), Reason: semantic.CommentToAuditee,
			SyncKind: "finding", OutboxTopic: "cap.reviewed",
		}, nil
	})
}

type ReviewEvidenceCommand struct {
	OperationID                     string
	CorrelationID                   string
	EvidenceVersionID               string
	ExpectedEvidenceVersionRevision int64
	FindingID                       string
	ExpectedFindingRevision         int64
	Decision                        evidence.Decision
	CommentToAuditee                string
	InternalCAANote                 string
}

type ReviewEvidenceResult struct {
	ReviewDecisionID  string                `json:"reviewDecisionId"`
	EvidenceVersionID string                `json:"evidenceVersionId"`
	EvidenceRevision  int64                 `json:"evidenceVersionRevision"`
	FindingID         string                `json:"findingId"`
	FindingStatus     findings.Status       `json:"findingStatus"`
	FindingRevision   int64                 `json:"findingRevision"`
	ClosureBasis      findings.ClosureBasis `json:"closureBasis,omitempty"`
}

func (service *Service) ReviewEvidence(ctx context.Context, actor identity.Principal, command ReviewEvidenceCommand) (ReviewEvidenceResult, error) {
	semantic := struct {
		EvidenceRevision int64             `json:"evidenceRevision"`
		FindingRevision  int64             `json:"findingRevision"`
		Decision         evidence.Decision `json:"decision"`
		CommentToAuditee string            `json:"commentToAuditee"`
		InternalCAANote  string            `json:"internalCaaNote"`
	}{command.ExpectedEvidenceVersionRevision, command.ExpectedFindingRevision, command.Decision, strings.TrimSpace(command.CommentToAuditee), strings.TrimSpace(command.InternalCAANote)}
	return executeTransition(ctx, service, actor, commandEnvelope{
		OperationID: command.OperationID, CorrelationID: command.CorrelationID,
		Kind: "review_evidence", EntityID: command.EvidenceVersionID, Semantic: semantic,
	}, func(ctx context.Context, transaction pgx.Tx) (transition[ReviewEvidenceResult], error) {
		if !actor.HasRole(identity.RoleInspector, identity.RoleLeadInspector, identity.RoleDepartmentManager) {
			return transition[ReviewEvidenceResult]{}, fmt.Errorf("%w: CAA Evidence review role required", ErrForbidden)
		}
		evidenceVersion, err := evidencestore.New(transaction).GetEvidenceVersion(ctx, command.EvidenceVersionID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return transition[ReviewEvidenceResult]{}, ErrNotFound
			}
			return transition[ReviewEvidenceResult]{}, err
		}
		if evidenceVersion.FindingID != command.FindingID {
			return transition[ReviewEvidenceResult]{}, ErrNotFound
		}
		finding, err := findingstore.New(transaction).GetFindingForUpdate(ctx, command.FindingID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return transition[ReviewEvidenceResult]{}, ErrNotFound
			}
			return transition[ReviewEvidenceResult]{}, err
		}
		if evidenceVersion.OrganizationID != finding.OrganizationID {
			return transition[ReviewEvidenceResult]{}, errors.New("Evidence and Finding organization mismatch")
		}
		evidenceID := evidenceVersion.ID
		findingID := finding.ID
		scanStatus := evidenceVersion.Status
		evidenceRevision := evidenceVersion.Revision
		var processingStateExists bool
		var stateScan string
		var stateRevision int64
		err = transaction.QueryRow(ctx, `
			SELECT scan_state, revision FROM evidence_version_states WHERE evidence_version_id = $1 FOR UPDATE
		`, evidenceVersion.ID).Scan(&stateScan, &stateRevision)
		if err == nil {
			processingStateExists = true
			scanStatus = stateScan
			evidenceRevision = stateRevision
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return transition[ReviewEvidenceResult]{}, err
		}
		findingStatus := finding.Status
		findingRevision := finding.Revision
		organizationID := finding.OrganizationID
		if findingRevision != command.ExpectedFindingRevision {
			return transition[ReviewEvidenceResult]{}, fmt.Errorf("%w: stale Finding revision", ErrConflict)
		}
		decision, err := evidence.Review(evidence.ReviewInput{
			Actor: actor, VersionID: evidenceID, VersionRevision: evidenceRevision,
			ExpectedVersionRevision: command.ExpectedEvidenceVersionRevision, ScanStatus: evidence.ScanStatus(scanStatus),
			FindingStatus: findings.Status(findingStatus), Decision: command.Decision,
		})
		if err != nil {
			return transition[ReviewEvidenceResult]{}, fmt.Errorf("%w: %v", ErrConflict, err)
		}
		now := service.clock().UTC()
		reviewDecisionID := service.idGenerator("review-decision")
		if _, err := transaction.Exec(ctx, `
			INSERT INTO review_decisions (
				id, entity_type, entity_id, expected_revision, decision, reason,
				comment_to_auditee, internal_caa_note, decided_by_subject_id, decided_at
			) VALUES ($1, 'evidence_version', $2, $3, $4, NULLIF($5, ''), NULLIF($5, ''), NULLIF($6, ''), $7, $8)
		`, reviewDecisionID, evidenceID, command.ExpectedEvidenceVersionRevision,
			string(command.Decision), semantic.CommentToAuditee, semantic.InternalCAANote, actor.SubjectID, now); err != nil {
			return transition[ReviewEvidenceResult]{}, fmt.Errorf("append Evidence review decision: %w", err)
		}
		if processingStateExists {
			reviewState := "MORE_INFORMATION_REQUESTED"
			switch command.Decision {
			case evidence.DecisionClose:
				reviewState = "ACCEPTED"
			case evidence.DecisionPartiallyClose:
				reviewState = "PARTIALLY_ACCEPTED"
			case evidence.DecisionNotClose:
				reviewState = "REJECTED"
			}
			if _, err := transaction.Exec(ctx, `
				UPDATE evidence_version_states SET review_state = $2, revision = revision + 1, updated_at = $3
				WHERE evidence_version_id = $1
			`, evidenceID, reviewState, now); err != nil {
				return transition[ReviewEvidenceResult]{}, fmt.Errorf("record exact Evidence review state: %w", err)
			}
		}
		nextFindingRevision := findingRevision + 1
		if _, err := transaction.Exec(ctx, `
			UPDATE findings
			SET status = $2, next_action = $3, closure_basis = NULLIF($4, ''),
			    closure_reason = NULLIF($5, ''), revision = $6, updated_at = $7,
			    closed_at = CASE WHEN $2 = 'CLOSED' THEN $7::timestamptz ELSE NULL END
			WHERE id = $1
		`, findingID, string(decision.FindingStatus), nextActionForFinding(decision.FindingStatus),
			string(decision.ClosureBasis), semantic.CommentToAuditee, nextFindingRevision, now); err != nil {
			return transition[ReviewEvidenceResult]{}, fmt.Errorf("advance Finding after Evidence review: %w", err)
		}
		response := ReviewEvidenceResult{
			ReviewDecisionID: reviewDecisionID, EvidenceVersionID: evidenceID, EvidenceRevision: evidenceRevision + 1,
			FindingID: findingID, FindingStatus: decision.FindingStatus,
			FindingRevision: nextFindingRevision, ClosureBasis: decision.ClosureBasis,
		}
		return transition[ReviewEvidenceResult]{
			Response: response, OrganizationID: organizationID, Action: "evidence.reviewed",
			EntityType: "finding", EntityID: findingID, EntityVersion: nextFindingRevision,
			BeforeStatus: findingStatus, AfterStatus: string(decision.FindingStatus), Reason: semantic.CommentToAuditee,
			ClosureBasis: string(decision.ClosureBasis), SyncKind: "finding", OutboxTopic: "evidence.reviewed",
		}, nil
	})
}

type AuthorizedCloseFindingCommand struct {
	OperationID             string
	CorrelationID           string
	FindingID               string
	ExpectedFindingRevision int64
	Reason                  string
}

type AuthorizedCloseFindingResult struct {
	FindingID       string                `json:"findingId"`
	FindingStatus   findings.Status       `json:"findingStatus"`
	FindingRevision int64                 `json:"findingRevision"`
	ClosureBasis    findings.ClosureBasis `json:"closureBasis"`
}

func (service *Service) AuthorizedCloseFinding(ctx context.Context, actor identity.Principal, command AuthorizedCloseFindingCommand) (AuthorizedCloseFindingResult, error) {
	semantic := struct {
		ExpectedRevision int64  `json:"expectedRevision"`
		Reason           string `json:"reason"`
	}{command.ExpectedFindingRevision, strings.TrimSpace(command.Reason)}
	return executeTransition(ctx, service, actor, commandEnvelope{
		OperationID: command.OperationID, CorrelationID: command.CorrelationID,
		Kind: "authorized_close_finding", EntityID: command.FindingID, Semantic: semantic,
	}, func(ctx context.Context, transaction pgx.Tx) (transition[AuthorizedCloseFindingResult], error) {
		if !actor.HasRole(identity.RoleDepartmentManager) {
			return transition[AuthorizedCloseFindingResult]{}, fmt.Errorf("%w: Department Manager role required", ErrForbidden)
		}
		finding, err := findingstore.New(transaction).GetFindingForUpdate(ctx, command.FindingID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return transition[AuthorizedCloseFindingResult]{}, ErrNotFound
			}
			return transition[AuthorizedCloseFindingResult]{}, err
		}
		status := finding.Status
		revision := finding.Revision
		organizationID := finding.OrganizationID
		decision, err := findings.AuthorizedClose(findings.AuthorizedCloseInput{
			Actor: actor, Status: findings.Status(status), Revision: revision,
			ExpectedRevision: command.ExpectedFindingRevision, Reason: semantic.Reason,
		})
		if err != nil {
			return transition[AuthorizedCloseFindingResult]{}, fmt.Errorf("%w: %v", ErrConflict, err)
		}
		now := service.clock().UTC()
		if _, err := transaction.Exec(ctx, `
			UPDATE findings
			SET status = $2, next_action = 'Closed', closure_basis = $3, closure_reason = $4,
			    revision = $5, updated_at = $6, closed_at = $6
			WHERE id = $1
		`, command.FindingID, string(decision.Status), string(decision.ClosureBasis), decision.Reason, decision.Revision, now); err != nil {
			return transition[AuthorizedCloseFindingResult]{}, fmt.Errorf("authorize Finding closure: %w", err)
		}
		response := AuthorizedCloseFindingResult{
			FindingID: command.FindingID, FindingStatus: decision.Status,
			FindingRevision: decision.Revision, ClosureBasis: decision.ClosureBasis,
		}
		return transition[AuthorizedCloseFindingResult]{
			Response: response, OrganizationID: organizationID, Action: "finding.authorized_closure",
			EntityType: "finding", EntityID: command.FindingID, EntityVersion: decision.Revision,
			BeforeStatus: status, AfterStatus: string(decision.Status), Reason: decision.Reason,
			ClosureBasis: string(decision.ClosureBasis), SyncKind: "finding", OutboxTopic: "finding.closed",
		}, nil
	})
}

func nextActionForFinding(status findings.Status) string {
	switch status {
	case findings.StatusCAPRejected, findings.StatusCAPMoreInformationRequested:
		return "Auditee revises CAP"
	case findings.StatusEvidenceRequired, findings.StatusEvidenceMoreInformationRequested:
		return "Auditee submits Evidence"
	case findings.StatusEvidenceSubmitted, findings.StatusPendingCAAReview:
		return "CAA reviews Evidence"
	case findings.StatusPendingClosure:
		return "CAA completes verification"
	case findings.StatusClosed:
		return "Closed"
	default:
		return "CAA reviews Finding"
	}
}
