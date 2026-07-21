package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/application"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/httpapi/generated"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/jackc/pgx/v5"
)

type packageQuestionSnapshot struct {
	ID                  string   `json:"id"`
	SectionID           string   `json:"sectionId"`
	Prompt              string   `json:"prompt"`
	RegulatoryReference string   `json:"regulatoryReference"`
	ExpectedEvidence    string   `json:"expectedEvidence"`
	Assigned            []string `json:"assignedInspectorUserIds"`
}

type packageSnapshot struct {
	SchemaVersion   int64                     `json:"schemaVersion"`
	ProtocolVersion int64                     `json:"protocolVersion"`
	Questions       []packageQuestionSnapshot `json:"questions"`
}

func (api *CanonicalAPI) assignmentProjection(ctx context.Context, actor identity.Principal, status *string, limit *int64) (generated.ListAssignmentsOutput, error) {
	query := `
		SELECT DISTINCT inspection.id, inspection.organization_id, organization.legal_name,
		       inspection.title, inspection.status, COALESCE(inspection.due_date::text, '')
		FROM inspections inspection
		JOIN organizations organization ON organization.id = inspection.organization_id
		LEFT JOIN inspection_question_assignments assignment ON assignment.inspection_id = inspection.id
		WHERE ($1 = false OR assignment.subject_id = $2)
		  AND ($3 = false OR inspection.organization_id = $4)
		ORDER BY inspection.id
	`
	isInspector := actor.HasRole(identity.RoleInspector) && !actor.HasRole(identity.RoleLeadInspector)
	isAuditee := actor.HasRole(identity.RoleAuditee)
	rows, err := api.pool.Query(ctx, query, isInspector, actor.SubjectID, isAuditee, actor.OrganizationID)
	if err != nil {
		return generated.ListAssignmentsOutput{}, err
	}
	defer rows.Close()
	items := []generated.AssignmentSummary{}
	for rows.Next() {
		var item generated.AssignmentSummary
		var dueDate string
		if err := rows.Scan(&item.AuditId, &item.OrganizationId, &item.OrganizationName, &item.Title, &item.Status, &dueDate); err != nil {
			return generated.ListAssignmentsOutput{}, err
		}
		if status != nil && item.Status != *status {
			continue
		}
		if dueDate != "" {
			item.DueDate = &dueDate
		}
		item.DueState = dueState(dueDate, api.clock())
		item.NextAction = "Continue Cabin Inspection checklist"
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return generated.ListAssignmentsOutput{}, err
	}
	if limit != nil && *limit >= 0 && int64(len(items)) > *limit {
		items = items[:*limit]
	}
	return generated.ListAssignmentsOutput{Items: items}, nil
}

func (api *CanonicalAPI) inspectionPackageProjection(ctx context.Context, actor identity.Principal, packageID string) (generated.InspectionPackage, error) {
	if actor.HasRole(identity.RoleAuditee) || !actor.IsCAA() {
		return generated.InspectionPackage{}, fmt.Errorf("%w: Inspection execution packages are unavailable to Auditee users", application.ErrForbidden)
	}
	var output generated.InspectionPackage
	var snapshotBytes []byte
	var expiresAt time.Time
	if err := api.pool.QueryRow(ctx, `
		SELECT package.id, package.inspection_id, inspection.organization_id, organization.legal_name,
		       inspection.title, package.package_version, package.checklist_template_version_id,
		       package.package_digest, package.expires_at, package.snapshot,
		       checklist.status, checklist.revision
		FROM inspection_packages package
		JOIN inspections inspection ON inspection.id = package.inspection_id
		JOIN organizations organization ON organization.id = inspection.organization_id
		JOIN inspection_checklists checklist ON checklist.inspection_id = inspection.id
		WHERE package.id = $1
	`, packageID).Scan(
		&output.Id, &output.AuditId, &output.OrganizationId, &output.OrganizationName, &output.Title,
		&output.PackageVersion, &output.TemplateVersionId, &output.PackageDigest, &expiresAt,
		&snapshotBytes, &output.ChecklistStatus, &output.ChecklistRevision,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return generated.InspectionPackage{}, application.ErrNotFound
		}
		return generated.InspectionPackage{}, err
	}
	var snapshot packageSnapshot
	if err := json.Unmarshal(snapshotBytes, &snapshot); err != nil {
		return generated.InspectionPackage{}, fmt.Errorf("decode inspection package snapshot: %w", err)
	}
	output.SchemaVersion = snapshot.SchemaVersion
	output.ProtocolVersion = snapshot.ProtocolVersion
	output.ExpiresAt = expiresAt.UTC().Format(time.RFC3339Nano)
	output.Questions = make([]generated.InspectionQuestion, 0, len(snapshot.Questions))
	for _, question := range snapshot.Questions {
		regulatoryReference := question.RegulatoryReference
		expectedEvidence := question.ExpectedEvidence
		view := generated.InspectionQuestion{
			Id: question.ID, SectionId: question.SectionID, Prompt: question.Prompt,
			RegulatoryReference: &regulatoryReference, ExpectedEvidence: &expectedEvidence,
			AllowedAnswers: []generated.ChecklistAnswer{
				generated.ChecklistAnswerCOMPLIANT, generated.ChecklistAnswerNONCOMPLIANT,
				generated.ChecklistAnswerOBSERVATION, generated.ChecklistAnswerNOTAPPLICABLE,
				generated.ChecklistAnswerNOTCHECKED,
			},
			CommentRequiredFor:       []generated.ChecklistAnswer{generated.ChecklistAnswerNONCOMPLIANT, generated.ChecklistAnswerOBSERVATION},
			AssignedInspectorUserIds: append([]string(nil), question.Assigned...),
		}
		var response generated.ChecklistResponseView
		var updatedAt time.Time
		err := api.pool.QueryRow(ctx, `
			SELECT id, question_id, response_value, COALESCE(comment_to_auditee, ''), revision, updated_at
			FROM checklist_responses WHERE inspection_id = $1 AND question_id = $2
		`, output.AuditId, question.ID).Scan(&response.Id, &response.QuestionId, &response.Answer, &response.Comment, &response.Revision, &updatedAt)
		if err == nil {
			response.UpdatedAt = updatedAt.UTC().Format(time.RFC3339Nano)
			view.CurrentResponse = &response
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return generated.InspectionPackage{}, err
		}
		output.Questions = append(output.Questions, view)
	}
	return output, nil
}

func (api *CanonicalAPI) checklistResponseProjection(ctx context.Context, responseID string) (generated.ChecklistResponseView, error) {
	var view generated.ChecklistResponseView
	var updatedAt time.Time
	if err := api.pool.QueryRow(ctx, `
		SELECT id, question_id, response_value, COALESCE(comment_to_auditee, ''), revision, updated_at
		FROM checklist_responses WHERE id = $1
	`, responseID).Scan(&view.Id, &view.QuestionId, &view.Answer, &view.Comment, &view.Revision, &updatedAt); err != nil {
		return generated.ChecklistResponseView{}, err
	}
	view.UpdatedAt = updatedAt.UTC().Format(time.RFC3339Nano)
	return view, nil
}

func (api *CanonicalAPI) potentialFindingProjection(ctx context.Context, potentialFindingID string) (generated.PotentialFindingView, error) {
	var view generated.PotentialFindingView
	var converted *string
	if err := api.pool.QueryRow(ctx, `
		SELECT id, inspection_id, question_id, organization_id, title, description, status, revision, converted_finding_id
		FROM potential_findings WHERE id = $1
	`, potentialFindingID).Scan(&view.Id, &view.AuditId, &view.QuestionId, &view.OrganizationId, &view.Title,
		&view.Description, &view.Status, &view.Revision, &converted); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return generated.PotentialFindingView{}, application.ErrNotFound
		}
		return generated.PotentialFindingView{}, err
	}
	view.ConvertedFindingId = converted
	return view, nil
}

func (api *CanonicalAPI) findingProjection(ctx context.Context, actor identity.Principal, findingID string) (generated.FindingView, error) {
	if _, err := api.application.GetFinding(ctx, actor, findingID); err != nil {
		return generated.FindingView{}, err
	}
	var view generated.FindingView
	var ownerSubject *string
	var dueDate string
	var createdAt time.Time
	var issuedAt, closedAt *time.Time
	var closureBasis *string
	var potentialTitle, potentialDescription, findingBasis *string
	if err := api.pool.QueryRow(ctx, `
		SELECT finding.id, finding.reference, finding.inspection_id, finding.organization_id,
		       organization.legal_name, potential.title, potential.description, potential.finding_basis,
		       finding.severity, finding.status, COALESCE(finding.due_date::text, ''), finding.owner_subject_id,
		       finding.next_action, finding.cap_required, finding.evidence_required, finding.created_at,
		       finding.issued_at, finding.closed_at, finding.closure_basis, finding.revision
		FROM findings finding
		JOIN organizations organization ON organization.id = finding.organization_id
		LEFT JOIN potential_findings potential ON potential.id = finding.potential_finding_id
		WHERE finding.id = $1
	`, findingID).Scan(
		&view.Id, &view.FindingNumber, &view.AuditId, &view.OrganizationId, &view.OrganizationName,
		&potentialTitle, &potentialDescription, &findingBasis, &view.Severity, &view.Status, &dueDate,
		&ownerSubject, &view.NextAction, &view.CapRequired, &view.EvidenceRequired, &createdAt,
		&issuedAt, &closedAt, &closureBasis, &view.Revision,
	); err != nil {
		return generated.FindingView{}, err
	}
	view.Title = valueOr(potentialTitle, view.FindingNumber)
	view.Description = valueOr(potentialDescription, "Configured oversight Finding")
	view.FindingBasis = valueOr(findingBasis, "Configured check result")
	configuredReference := "Configured oversight reference"
	if view.OrganizationId == "ORG-FLY-NAMIBIA" {
		configuredReference = "Configured Cabin Inspection reference — EM EQ / PBE"
	}
	view.RegulatoryReference = &configuredReference
	if dueDate != "" {
		view.DueDate = &dueDate
	}
	view.DueState = dueState(dueDate, api.clock())
	view.CreatedAt = createdAt.UTC().Format(time.RFC3339Nano)
	view.IssuedAt = formatOptionalInstant(issuedAt)
	view.ClosedAt = formatOptionalInstant(closedAt)
	if closureBasis != nil {
		publicBasis := *closureBasis
		if publicBasis == "AUTHORIZED_CLOSURE" {
			publicBasis = "AUTHORIZED"
		}
		view.ClosureBasis = &publicBasis
	}
	view.RepeatFinding = false
	view.CurrentOwnerType, view.CurrentOwnerId, view.CurrentOwnerRole = findingOwner(view.Status, view.OrganizationId, ownerSubject, view.ClosureBasis)
	return view, nil
}

func (api *CanonicalAPI) findingsProjection(ctx context.Context, actor identity.Principal, status *string, limit *int64) (generated.ListFindingsOutput, error) {
	projections, err := api.application.ListFindings(ctx, actor)
	if err != nil {
		return generated.ListFindingsOutput{}, err
	}
	items := make([]generated.FindingView, 0, len(projections))
	for _, projection := range projections {
		view, err := api.findingProjection(ctx, actor, projection.ID)
		if err != nil {
			return generated.ListFindingsOutput{}, err
		}
		if status != nil && string(view.Status) != *status {
			continue
		}
		items = append(items, view)
	}
	sort.Slice(items, func(left, right int) bool { return items[left].FindingNumber < items[right].FindingNumber })
	if limit != nil && *limit >= 0 && int64(len(items)) > *limit {
		items = items[:*limit]
	}
	return generated.ListFindingsOutput{Items: items}, nil
}

func (api *CanonicalAPI) reportProjection(ctx context.Context, actor identity.Principal, reportVersionID string) (generated.ReportVersionView, error) {
	var view generated.ReportVersionView
	var snapshot []byte
	var issuedAt *time.Time
	if err := api.pool.QueryRow(ctx, `
		SELECT version.id, version.report_id, inspection.organization_id, version.inspection_id,
		       version.version, version.snapshot, state.status, state.revision, state.issued_at
		FROM report_versions version
		JOIN report_approval_states state ON state.report_version_id = version.id
		JOIN inspections inspection ON inspection.id = version.inspection_id
		WHERE version.id = $1
	`, reportVersionID).Scan(&view.ReportVersionId, &view.ReportId, &view.OrganizationId, &view.AuditId,
		&view.Version, &snapshot, &view.Status, &view.Revision, &issuedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return generated.ReportVersionView{}, application.ErrNotFound
		}
		return generated.ReportVersionView{}, err
	}
	if actor.HasRole(identity.RoleAuditee) {
		if actor.OrganizationID != view.OrganizationId || view.Status != generated.ReportApprovalStatusLOCKED {
			return generated.ReportVersionView{}, fmt.Errorf("%w: report is unavailable to this Auditee", application.ErrForbidden)
		}
	} else if !actor.IsCAA() {
		return generated.ReportVersionView{}, application.ErrForbidden
	}
	var payload struct {
		FindingIDs  []string `json:"findingIds"`
		ContentHash string   `json:"contentHash"`
	}
	if err := json.Unmarshal(snapshot, &payload); err != nil {
		return generated.ReportVersionView{}, err
	}
	view.FindingIds = payload.FindingIDs
	view.ContentHash = payload.ContentHash
	view.IssuedAt = formatOptionalInstant(issuedAt)
	return view, nil
}

func (api *CanonicalAPI) managerProjection(ctx context.Context, actor identity.Principal) (generated.ManagerDashboardProjection, error) {
	if !actor.HasRole(identity.RoleDepartmentManager, identity.RoleGeneralManager, identity.RoleExecutiveDirector) {
		return generated.ManagerDashboardProjection{}, fmt.Errorf("%w: management dashboard authority is required", application.ErrForbidden)
	}
	var view generated.ManagerDashboardProjection
	if err := api.pool.QueryRow(ctx, `
		SELECT
			count(*) FILTER (WHERE status <> 'CLOSED'),
			count(*) FILTER (WHERE status = 'CLOSED'),
			count(*) FILTER (WHERE status <> 'CLOSED' AND due_date < $1::date),
			count(*) FILTER (WHERE status = 'CAP_SUBMITTED'),
			count(*) FILTER (WHERE status = 'PENDING_CAA_REVIEW')
		FROM findings
	`, api.clock().UTC().Format("2006-01-02")).Scan(&view.OpenFindings, &view.ClosedFindings, &view.OverdueFindings,
		&view.PendingCapReviews, &view.PendingEvidenceReviews); err != nil {
		return generated.ManagerDashboardProjection{}, err
	}
	rows, err := api.pool.Query(ctx, `SELECT reference FROM findings ORDER BY updated_at DESC, reference LIMIT 5`)
	if err != nil {
		return generated.ManagerDashboardProjection{}, err
	}
	defer rows.Close()
	view.RecentFindingNumbers = []string{}
	for rows.Next() {
		var reference string
		if err := rows.Scan(&reference); err != nil {
			return generated.ManagerDashboardProjection{}, err
		}
		view.RecentFindingNumbers = append(view.RecentFindingNumbers, reference)
	}
	view.GeneratedAt = api.clock().UTC().Format(time.RFC3339Nano)
	return view, rows.Err()
}

func dueState(dueDate string, now time.Time) generated.DueState {
	if dueDate == "" {
		return generated.DueStateNONE
	}
	due, err := time.Parse("2006-01-02", dueDate)
	if err != nil {
		return generated.DueStateNONE
	}
	today, _ := time.Parse("2006-01-02", now.UTC().Format("2006-01-02"))
	if due.Before(today) {
		return generated.DueStateOVERDUE
	}
	if due.Sub(today) <= 7*24*time.Hour {
		return generated.DueStateDUESOON
	}
	return generated.DueStateNOTDUE
}

func formatOptionalInstant(value *time.Time) *string {
	if value == nil {
		return nil
	}
	formatted := value.UTC().Format(time.RFC3339Nano)
	return &formatted
}

func valueOr(value *string, fallback string) string {
	if value == nil || *value == "" {
		return fallback
	}
	return *value
}

func findingOwner(status generated.FindingStatus, organizationID string, owner *string, closureBasis *string) (string, string, generated.Role) {
	switch status {
	case generated.FindingStatusWAITINGFORCAP, generated.FindingStatusCAPREJECTED,
		generated.FindingStatusCAPMOREINFORMATIONREQUESTED, generated.FindingStatusEVIDENCEREQUIRED,
		generated.FindingStatusEVIDENCEMOREINFORMATIONREQUESTED:
		return "AUDITEE", organizationID, generated.RoleAuditee
	case generated.FindingStatusCLOSED:
		if closureBasis != nil && *closureBasis == "AUTHORIZED" {
			return "CAA", "USR-MANAGER-NORA", generated.RoleManager
		}
		return "CAA", "USR-LEAD-CANER", generated.RoleLeadInspector
	default:
		ownerID := "USR-LEAD-CANER"
		if owner != nil && *owner != "" {
			ownerID = *owner
		}
		return "CAA", ownerID, generated.RoleLeadInspector
	}
}
