package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/application"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/caps"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/evidence"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/findings"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/httpapi/generated"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/inspections/attachments"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/idempotency"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/objectstore"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/potentialfindings"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/reports"
	fieldsync "github.com/MarlonJD/aviaSurveil360/apps/api/internal/sync"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/testprofile"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

type CanonicalAPIDependencies struct {
	Pool              *database.Pool
	Application       *application.Service
	GrantService      *fieldsync.GrantService
	EvidenceUploads   *evidence.UploadService
	AttachmentUploads *attachments.UploadService
	Clock             func() time.Time
}

type CanonicalAPI struct {
	pool              *database.Pool
	application       *application.Service
	grants            *fieldsync.GrantService
	evidenceUploads   *evidence.UploadService
	attachmentUploads *attachments.UploadService
	clock             func() time.Time
}

func NewCanonicalAPI(dependencies CanonicalAPIDependencies) *CanonicalAPI {
	clock := dependencies.Clock
	if clock == nil {
		clock = time.Now
	}
	return &CanonicalAPI{
		pool: dependencies.Pool, application: dependencies.Application, grants: dependencies.GrantService,
		evidenceUploads: dependencies.EvidenceUploads, attachmentUploads: dependencies.AttachmentUploads,
		clock: clock,
	}
}

func (api *CanonicalAPI) Handler() http.Handler {
	router := chi.NewRouter()
	router.Get("/v1/assignments", api.listAssignments)
	router.Get("/v1/inspection-packages/{id}", api.getInspectionPackage)
	router.Post("/v1/inspection-packages/{id}/checkout", api.checkoutInspectionPackage)
	router.Put("/v1/checklist-responses/{responseId}", api.upsertChecklistResponse)
	router.Post("/v1/checklists/{auditId}/submit", api.submitChecklist)
	router.Post("/v1/checklists/{auditId}/reopen", api.reopenChecklist)
	router.Post("/v1/potential-findings", api.createPotentialFinding)
	router.Post("/v1/potential-findings/{id}/decisions", api.decidePotentialFinding)
	router.Get("/v1/findings", api.listFindings)
	router.Get("/v1/findings/{id}", api.getFinding)
	router.Get("/v1/findings/{id}/evidence", api.listEvidenceVersions)
	router.Post("/v1/findings/{id}/authorized-closure", api.authorizedCloseFinding)
	router.Post("/v1/caps", api.submitCAP)
	router.Post("/v1/caps/{capRevisionId}/reviews", api.reviewCAP)
	router.Post("/v1/inspection-attachments/{id}/uploads", api.beginInspectionAttachmentUpload)
	router.Post("/v1/inspection-attachments/uploads/{uploadId}/complete", api.completeInspectionAttachmentUpload)
	router.Post("/v1/evidence/uploads", api.beginEvidenceUpload)
	router.Post("/v1/evidence/uploads/{uploadId}/complete", api.completeEvidenceUpload)
	router.Post("/v1/evidence/{evidenceVersionId}/reviews", api.reviewEvidence)
	router.Get("/v1/report-versions/{id}", api.getReportVersion)
	router.Post("/v1/report-versions/{id}/decisions", api.decideReport)
	router.Get("/v1/dashboards/manager", api.getManagerDashboard)
	router.Post("/v1/sync/operations", api.pushFieldOperation)
	router.Get("/v1/sync/changes", api.pullSyncChanges)
	return router
}

func (api *CanonicalAPI) listAssignments(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	output, err := api.assignmentProjection(request.Context(), actor, optionalQuery(request, "status"), optionalIntQuery(request, "limit"))
	api.respond(writer, output, err)
}

func (api *CanonicalAPI) getInspectionPackage(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	output, err := api.inspectionPackageProjection(request.Context(), actor, chi.URLParam(request, "id"))
	api.respond(writer, output, err)
}

func (api *CanonicalAPI) checkoutInspectionPackage(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.CheckoutInspectionPackageInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	if input.PackageId != chi.URLParam(request, "id") {
		api.respond(writer, nil, fmt.Errorf("%w: package path and body must match", application.ErrInvalid))
		return
	}
	grant, err := api.grants.Issue(request.Context(), actor, fieldsync.CheckoutInput{
		OperationID: input.OperationId, CorrelationID: input.OperationId, PackageID: input.PackageId,
		ExpectedPackageVersion: input.ExpectedPackageVersion, DeviceInstanceID: input.DeviceInstanceId,
	})
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	packageView, err := api.inspectionPackageProjection(request.Context(), actor, input.PackageId)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	allowed := make([]generated.FieldCommandType, 0, len(grant.AllowedCommandTypes))
	for _, command := range grant.AllowedCommandTypes {
		allowed = append(allowed, generated.FieldCommandType(command))
	}
	api.respond(writer, generated.CheckoutInspectionPackageOutput{
		InspectionPackage: packageView,
		OfflineGrant: generated.OfflineGrant{
			GrantId: grant.ID, SubjectId: grant.SubjectID, OrganizationId: grant.OrganizationID,
			PackageId: grant.PackageID, PackageVersion: grant.PackageVersion, PackageDigest: grant.PackageDigest,
			AllowedCommandTypes: allowed, AssignmentScope: map[string]any{"questionIds": grant.QuestionIDs},
			DeviceInstanceId: grant.DeviceInstanceID, IssuedAt: grant.IssuedAt.UTC().Format(time.RFC3339Nano),
			ExpiresAt: grant.ExpiresAt.UTC().Format(time.RFC3339Nano), ProtocolVersion: int64(grant.ProtocolVersion),
		},
	}, nil)
}

func (api *CanonicalAPI) upsertChecklistResponse(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.UpsertChecklistResponseInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	if input.ResponseId != chi.URLParam(request, "responseId") {
		api.respond(writer, nil, fmt.Errorf("%w: response path and body must match", application.ErrInvalid))
		return
	}
	var packageID string
	if err := api.pool.QueryRow(request.Context(), `SELECT id FROM inspection_packages WHERE inspection_id = $1 ORDER BY package_version DESC LIMIT 1`, input.AuditId).Scan(&packageID); err != nil {
		api.respond(writer, nil, application.ErrNotFound)
		return
	}
	_, err := api.application.UpsertChecklistResponse(request.Context(), actor, application.UpsertChecklistResponseCommand{
		OperationID: input.OperationId, CorrelationID: input.OperationId, ResponseID: input.ResponseId,
		InspectionID: input.AuditId, PackageID: packageID, QuestionID: input.QuestionId,
		ExpectedResponseRevision: input.ExpectedResponseRevision, Answer: string(input.Answer),
		CommentToAuditee: input.Comment,
	})
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	output, err := api.checklistResponseProjection(request.Context(), input.ResponseId)
	api.respond(writer, output, err)
}

func (api *CanonicalAPI) submitChecklist(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.SubmitChecklistInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	if input.AuditId != chi.URLParam(request, "auditId") {
		api.respond(writer, nil, application.ErrInvalid)
		return
	}
	result, err := api.application.SubmitChecklist(request.Context(), actor, application.SubmitChecklistCommand{
		OperationID: input.OperationId, CorrelationID: input.OperationId, InspectionID: input.AuditId,
		ExpectedChecklistRevision: input.ExpectedChecklistRevision,
	})
	api.respond(writer, generated.SubmitChecklistOutput{AuditId: result.InspectionID, ChecklistStatus: string(result.Status), ChecklistRevision: result.Revision}, err)
}

func (api *CanonicalAPI) reopenChecklist(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.ReopenChecklistInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	result, err := api.application.ReopenChecklist(request.Context(), actor, application.ReopenChecklistCommand{
		OperationID: input.OperationId, CorrelationID: input.OperationId, InspectionID: input.AuditId,
		ExpectedChecklistRevision: input.ExpectedChecklistRevision, Reason: input.Reason,
	})
	api.respond(writer, generated.SubmitChecklistOutput{AuditId: result.InspectionID, ChecklistStatus: string(result.Status), ChecklistRevision: result.Revision}, err)
}

func (api *CanonicalAPI) createPotentialFinding(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.CreatePotentialFindingInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	result, err := api.application.CreatePotentialFinding(request.Context(), actor, application.CreatePotentialFindingCommand{
		OperationID: input.OperationId, CorrelationID: input.OperationId, InspectionID: input.AuditId,
		QuestionID: input.QuestionId, ChecklistResponseID: input.ChecklistResponseId,
		ExpectedChecklistResponseRevision: input.ExpectedChecklistResponseRevision, Title: input.Title,
		Description: input.Description, CommentToAuditee: input.RequiredComment,
		ExpectedEvidence: "PBE serviceability record and cabin position confirmation",
	})
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	output, err := api.potentialFindingProjection(request.Context(), result.ID)
	api.respond(writer, output, err)
}

func (api *CanonicalAPI) decidePotentialFinding(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var raw json.RawMessage
	if !decodeJSON(writer, request, &raw) {
		return
	}
	var discriminator struct {
		OperationID        string `json:"operationId"`
		PotentialFindingID string `json:"potentialFindingId"`
		Decision           string `json:"decision"`
	}
	if err := json.Unmarshal(raw, &discriminator); err != nil {
		api.respond(writer, nil, application.ErrInvalid)
		return
	}
	if discriminator.PotentialFindingID != chi.URLParam(request, "id") {
		api.respond(writer, nil, application.ErrInvalid)
		return
	}
	if discriminator.Decision == "CONVERT" {
		var input generated.ConvertPotentialFindingInput
		if err := json.Unmarshal(raw, &input); err != nil {
			api.respond(writer, nil, application.ErrInvalid)
			return
		}
		var dueDate *time.Time
		if input.DueDate != nil {
			parsed, err := time.Parse("2006-01-02", *input.DueDate)
			if err != nil {
				api.respond(writer, nil, fmt.Errorf("%w: Due Date must use YYYY-MM-DD", application.ErrInvalid))
				return
			}
			dueDate = &parsed
		}
		result, err := api.application.ConvertPotentialFinding(request.Context(), actor, application.ConvertPotentialFindingCommand{
			OperationID: input.OperationId, CorrelationID: input.OperationId, PotentialFindingID: input.PotentialFindingId,
			ExpectedRevision: input.ExpectedPotentialFindingRevision, Severity: potentialfindings.Severity(input.Severity),
			CAPRequired: input.CapRequired, EvidenceRequired: input.EvidenceRequired, DueDate: dueDate,
			RequirementsSpecified: true,
		})
		if err != nil {
			api.respond(writer, nil, err)
			return
		}
		potential, err := api.potentialFindingProjection(request.Context(), result.PotentialFindingID)
		if err != nil {
			api.respond(writer, nil, err)
			return
		}
		finding, err := api.findingProjection(request.Context(), actor, result.FindingID)
		api.respond(writer, generated.PotentialFindingDecisionOutput{PotentialFinding: potential, Finding: &finding}, err)
		return
	}
	var input generated.ReturnOrDismissPotentialFindingInput
	if err := json.Unmarshal(raw, &input); err != nil {
		api.respond(writer, nil, application.ErrInvalid)
		return
	}
	result, err := api.application.DecidePotentialFinding(request.Context(), actor, application.DecidePotentialFindingCommand{
		OperationID: input.OperationId, CorrelationID: input.OperationId, PotentialFindingID: input.PotentialFindingId,
		ExpectedRevision: input.ExpectedPotentialFindingRevision, Decision: potentialfindings.Decision(input.Decision), Reason: input.Reason,
	})
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	potential, err := api.potentialFindingProjection(request.Context(), result.ID)
	api.respond(writer, generated.PotentialFindingDecisionOutput{PotentialFinding: potential}, err)
}

func (api *CanonicalAPI) listFindings(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	output, err := api.findingsProjection(request.Context(), actor, optionalQuery(request, "status"), optionalIntQuery(request, "limit"))
	api.respond(writer, output, err)
}

func (api *CanonicalAPI) getFinding(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	output, err := api.findingProjection(request.Context(), actor, chi.URLParam(request, "id"))
	api.respond(writer, output, err)
}

func (api *CanonicalAPI) authorizedCloseFinding(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.AuthorizedCloseInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	_, err := api.application.AuthorizedCloseFinding(request.Context(), actor, application.AuthorizedCloseFindingCommand{
		OperationID: input.OperationId, CorrelationID: input.OperationId, FindingID: input.FindingId,
		ExpectedFindingRevision: input.ExpectedFindingRevision, Reason: input.Reason,
	})
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	output, err := api.findingProjection(request.Context(), actor, input.FindingId)
	api.respond(writer, output, err)
}

func (api *CanonicalAPI) submitCAP(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.SubmitCapInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	target, err := time.Parse("2006-01-02", input.TargetCompletionDate)
	if err != nil {
		api.respond(writer, nil, fmt.Errorf("%w: Target completion date must use YYYY-MM-DD", application.ErrInvalid))
		return
	}
	result, err := api.application.SubmitCAP(request.Context(), actor, application.SubmitCAPCommand{
		OperationID: input.OperationId, CorrelationID: input.OperationId, FindingID: input.FindingId,
		ExpectedFindingRevision: input.ExpectedFindingRevision, RootCause: input.RootCause,
		CorrectiveAction: input.CorrectiveAction, PreventiveAction: input.PreventiveAction,
		ResponsiblePerson: input.ResponsiblePerson, TargetCompletionDate: target, CommentToCAA: input.CommentToCaa,
	})
	api.respond(writer, generated.SubmitCapOutput{
		CapRevisionId: result.CAPRevisionID, CapRevision: result.CAPRevision, CapStatus: string(result.CAPStatus),
		FindingStatus: generated.FindingStatus(result.FindingStatus), FindingRevision: result.FindingRevision,
	}, err)
}

func (api *CanonicalAPI) reviewCAP(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.ReviewCapInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	result, err := api.application.ReviewCAP(request.Context(), actor, application.ReviewCAPCommand{
		OperationID: input.OperationId, CorrelationID: input.OperationId, CAPRevisionID: input.CapRevisionId,
		ExpectedCAPRevision: input.ExpectedCapRevision, FindingID: input.FindingId,
		ExpectedFindingRevision: input.ExpectedFindingRevision, Decision: caps.ReviewDecision(input.Decision),
		CommentToAuditee: input.CommentToAuditee, InternalCAANote: input.InternalCaaNote,
	})
	api.respond(writer, generated.ReviewCapOutput{
		CapRevisionId: result.CAPRevisionID, CapRevision: input.ExpectedCapRevision,
		CapStatus: generated.CapStatus(result.CAPStatus), FindingStatus: generated.FindingStatus(result.FindingStatus),
		FindingRevision: result.FindingRevision,
	}, err)
}

func (api *CanonicalAPI) beginInspectionAttachmentUpload(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.BeginInspectionAttachmentUploadInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	result, err := api.attachmentUploads.Begin(request.Context(), actor, attachments.BeginUploadInput{
		OperationID: input.OperationId, CorrelationID: input.OperationId, InspectionAttachmentID: input.InspectionAttachmentId,
		PackageID: input.PackageId, ByteSize: input.ByteSize, SHA256: input.Sha256,
		FileName: input.FileName, DeclaredMediaType: input.DeclaredMediaType,
	})
	api.respond(writer, generated.BeginInspectionAttachmentUploadOutput{
		UploadId: result.UploadID, StagingObjectKey: result.StagingObjectKey, UploadUrl: result.UploadURL,
		RequiredHeaders: map[string]any{"Content-Type": result.RequiredHeaders.ContentType, "x-amz-meta-sha256": result.RequiredHeaders.SHA256},
		ExpiresAt:       result.ExpiresAt.UTC().Format(time.RFC3339Nano), MaximumByteSize: result.MaximumByteSize,
	}, err)
}

func (api *CanonicalAPI) completeInspectionAttachmentUpload(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.CompleteInspectionAttachmentUploadInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	result, err := api.attachmentUploads.Complete(request.Context(), actor, attachments.CompleteUploadInput{
		OperationID: input.OperationId, CorrelationID: input.OperationId, UploadID: input.UploadId,
		SHA256: input.Sha256, ByteSize: input.ByteSize,
	})
	api.respond(writer, generated.CompleteInspectionAttachmentUploadOutput{
		InspectionAttachmentId: result.InspectionAttachmentID, UploadState: result.UploadState, ScanState: result.ScanState,
	}, err)
}

func (api *CanonicalAPI) beginEvidenceUpload(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.BeginEvidenceUploadInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	result, err := api.evidenceUploads.Begin(request.Context(), actor, evidence.BeginUploadInput{
		OperationID: input.OperationId, CorrelationID: input.OperationId, FindingID: input.FindingId,
		ExpectedFindingRevision: input.ExpectedFindingRevision, FileName: input.FileName,
		DeclaredMediaType: input.DeclaredMediaType, ByteSize: input.ByteSize, SHA256: input.Sha256,
	})
	api.respond(writer, generated.BeginEvidenceUploadOutput{
		UploadId: result.UploadID, StagingObjectKey: result.StagingObjectKey, UploadUrl: result.UploadURL,
		RequiredHeaders: map[string]any{"Content-Type": result.RequiredHeaders.ContentType, "x-amz-meta-sha256": result.RequiredHeaders.SHA256},
		ExpiresAt:       result.ExpiresAt.UTC().Format(time.RFC3339Nano), MaximumByteSize: result.MaximumByteSize,
	}, err)
}

func (api *CanonicalAPI) completeEvidenceUpload(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.CompleteEvidenceUploadInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	result, err := api.evidenceUploads.Complete(request.Context(), actor, evidence.CompleteUploadInput{
		OperationID: input.OperationId, CorrelationID: input.OperationId, UploadID: input.UploadId,
		SHA256: input.Sha256, ByteSize: input.ByteSize,
	})
	api.respond(writer, generated.CompleteEvidenceUploadOutput{
		EvidenceVersionId: result.EvidenceVersionID, Version: result.Version, UploadState: result.UploadState,
		ScanState: result.ScanState, ReviewState: generated.EvidenceReviewState(result.ReviewState),
	}, err)
}

func (api *CanonicalAPI) listEvidenceVersions(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	versions, err := api.evidenceUploads.ListVersions(request.Context(), actor, chi.URLParam(request, "id"))
	items := make([]generated.EvidenceVersionView, 0, len(versions))
	for _, version := range versions {
		items = append(items, generated.EvidenceVersionView{
			Id: version.ID, FindingId: version.FindingID, OrganizationId: version.OrganizationID,
			Version: version.Version, FileName: version.FileName, SubmittedAt: version.SubmittedAt.UTC().Format(time.RFC3339Nano),
			UploadState: generated.EvidenceUploadState(version.UploadState), ScanState: generated.EvidenceScanState(version.ScanState),
			ReviewState: generated.EvidenceReviewState(version.ReviewState), Revision: version.Revision,
		})
	}
	api.respond(writer, generated.ListEvidenceVersionsOutput{Items: items}, err)
}

func (api *CanonicalAPI) reviewEvidence(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.ReviewEvidenceInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	result, err := api.application.ReviewEvidence(request.Context(), actor, application.ReviewEvidenceCommand{
		OperationID: input.OperationId, CorrelationID: input.OperationId, EvidenceVersionID: input.EvidenceVersionId,
		ExpectedEvidenceVersionRevision: input.ExpectedEvidenceVersionRevision, FindingID: input.FindingId,
		ExpectedFindingRevision: input.ExpectedFindingRevision, Decision: evidence.Decision(input.Decision),
		CommentToAuditee: input.CommentToAuditee, InternalCAANote: input.InternalCaaNote,
	})
	api.respond(writer, generated.ReviewEvidenceOutput{
		ReviewDecisionId: result.ReviewDecisionID, EvidenceVersionId: result.EvidenceVersionID,
		EvidenceVersionRevision: result.EvidenceRevision, FindingStatus: generated.FindingStatus(result.FindingStatus),
		FindingRevision: result.FindingRevision,
	}, err)
}

func (api *CanonicalAPI) getReportVersion(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	output, err := api.reportProjection(request.Context(), actor, chi.URLParam(request, "id"))
	api.respond(writer, output, err)
}

func (api *CanonicalAPI) decideReport(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.DecideReportInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	decision := reports.Decision(input.Decision)
	if input.Decision == "ISSUE_AND_LOCK" {
		decision = reports.DecisionIssue
	}
	_, err := api.application.DecideReport(request.Context(), actor, application.DecideReportCommand{
		OperationID: input.OperationId, CorrelationID: input.OperationId, ReportVersionID: input.ReportVersionId,
		ExpectedRevision: input.ExpectedReportVersionRevision, Decision: decision, Reason: input.Reason,
	})
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	output, err := api.reportProjection(request.Context(), actor, input.ReportVersionId)
	api.respond(writer, output, err)
}

func (api *CanonicalAPI) getManagerDashboard(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	output, err := api.managerProjection(request.Context(), actor)
	api.respond(writer, output, err)
}

type minimalFieldOperation struct {
	OperationID      string          `json:"operationId"`
	OfflineGrantID   string          `json:"offlineGrantId"`
	PackageID        string          `json:"packageId"`
	PackageVersion   int64           `json:"packageVersion"`
	EntityID         string          `json:"entityId"`
	CommandType      string          `json:"commandType"`
	DeviceInstanceID string          `json:"deviceInstanceId"`
	Payload          json.RawMessage `json:"payload"`
}

func (api *CanonicalAPI) pushFieldOperation(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	if !actor.HasRole(identity.RoleInspector) {
		api.respond(writer, nil, fieldsync.ErrGrantScope)
		return
	}
	var envelope generated.PushFieldOperationRequest
	if !decodeJSON(writer, request, &envelope) {
		return
	}
	var operation minimalFieldOperation
	if err := json.Unmarshal(envelope.Operation, &operation); err != nil {
		api.respond(writer, nil, application.ErrInvalid)
		return
	}
	if err := api.grants.Authorize(request.Context(), actor, fieldsync.AuthorizationInput{
		GrantID: operation.OfflineGrantID, PackageID: operation.PackageID, DeviceInstanceID: operation.DeviceInstanceID,
		ServerNow: api.clock().UTC(), CommandType: operation.CommandType,
	}); err != nil {
		api.respond(writer, nil, err)
		return
	}
	result, err := api.minimalSyncAcknowledgement(request.Context(), actor, operation, envelope.Operation)
	api.respond(writer, result, err)
}

func (api *CanonicalAPI) minimalSyncAcknowledgement(ctx context.Context, actor identity.Principal, operation minimalFieldOperation, semantic json.RawMessage) (generated.PushFieldOperationResult, error) {
	hash, err := idempotency.SemanticHash(semantic)
	if err != nil {
		return generated.PushFieldOperationResult{}, err
	}
	scope := actor.SubjectID + ":task11_sync_ack"
	var output generated.PushFieldOperationResult
	err = database.WithinTransaction(ctx, api.pool, func(ctx context.Context, transaction pgx.Tx) error {
		if _, err := transaction.Exec(ctx, "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", scope+":"+operation.OperationID); err != nil {
			return err
		}
		var storedHash string
		var storedBody []byte
		err := transaction.QueryRow(ctx, `SELECT semantic_hash, response_body FROM idempotency_responses WHERE scope = $1 AND operation_id = $2`, scope, operation.OperationID).Scan(&storedHash, &storedBody)
		if err == nil {
			if storedHash != hash {
				return idempotency.ErrOperationIDReuse
			}
			return json.Unmarshal(storedBody, &output)
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		now := api.clock().UTC()
		revision := int64(1)
		entityID := operation.EntityID
		output = generated.PushFieldOperationResult{
			OperationId: operation.OperationID, Status: "accepted", AuthoritativeEntityId: &entityID,
			AuthoritativeRevision: &revision, AcknowledgedAt: now.Format(time.RFC3339Nano),
		}
		body, _ := json.Marshal(output)
		_, err = transaction.Exec(ctx, `
			INSERT INTO idempotency_responses (scope, operation_id, semantic_hash, response_status, response_headers, response_body, created_at)
			VALUES ($1, $2, $3, 200, '{}'::jsonb, $4, $5)
		`, scope, operation.OperationID, hash, body, now)
		return err
	})
	return output, err
}

func (api *CanonicalAPI) pullSyncChanges(writer http.ResponseWriter, request *http.Request) {
	if _, ok := requirePrincipal(writer, request); !ok {
		return
	}
	api.respond(writer, generated.SyncPullResponse{Changes: []generated.AuthorizedSyncChange{}, ProjectionVersion: 1}, nil)
}

func (api *CanonicalAPI) respond(writer http.ResponseWriter, output any, err error) {
	if err == nil {
		writeJSON(writer, http.StatusOK, output)
		return
	}
	status := http.StatusInternalServerError
	code := "INTERNAL_ERROR"
	switch {
	case errors.Is(err, application.ErrForbidden), errors.Is(err, evidence.ErrEvidenceForbidden),
		errors.Is(err, attachments.ErrAttachmentForbidden), errors.Is(err, fieldsync.ErrGrantScope),
		errors.Is(err, fieldsync.ErrGrantExpired), errors.Is(err, fieldsync.ErrGrantRevoked),
		errors.Is(err, fieldsync.ErrAssignmentChanged), errors.Is(err, fieldsync.ErrPackageRevoked),
		errors.Is(err, fieldsync.ErrSessionRevoked):
		status, code = http.StatusForbidden, "FORBIDDEN"
	case errors.Is(err, application.ErrNotFound):
		status, code = http.StatusNotFound, "NOT_FOUND"
	case errors.Is(err, application.ErrConflict), errors.Is(err, idempotency.ErrOperationIDReuse):
		status, code = http.StatusConflict, "CONFLICT"
	case errors.Is(err, application.ErrInvalid), errors.Is(err, evidence.ErrInvalidUpload),
		errors.Is(err, attachments.ErrInvalidUpload), errors.Is(err, evidence.ErrObjectMismatch),
		errors.Is(err, attachments.ErrObjectMismatch):
		status, code = http.StatusUnprocessableEntity, "INVALID_COMMAND"
	}
	if status == http.StatusInternalServerError {
		writeProblem(writer, status, "Internal server error", "the request could not be completed", code)
		return
	}
	title := publicErrorTitle(err)
	writeProblem(writer, status, title, title, code)
}

func publicErrorTitle(err error) string {
	message := strings.TrimSpace(err.Error())
	for {
		original := message
		for _, prefix := range []string{
			"forbidden:", "not found:", "conflict:", "invalid:",
			"invalid evidence upload:", "invalid inspection attachment upload:",
			"invalid upload:", "object mismatch:",
		} {
			if strings.HasPrefix(strings.ToLower(message), prefix) {
				message = strings.TrimSpace(message[len(prefix):])
				break
			}
		}
		if message == original {
			break
		}
	}
	if message == "" {
		return "Request could not be completed."
	}
	runes := []rune(message)
	runes[0] = unicode.ToUpper(runes[0])
	message = string(runes)
	if !strings.ContainsAny(message[len(message)-1:], ".?!") {
		message += "."
	}
	return message
}

func requirePrincipal(writer http.ResponseWriter, request *http.Request) (identity.Principal, bool) {
	principal, ok := PrincipalFromContext(request.Context())
	if !ok {
		writeProblem(writer, http.StatusUnauthorized, "Authentication required", "no server principal is attached", "UNAUTHENTICATED")
	}
	return principal, ok
}

func decodeJSON(writer http.ResponseWriter, request *http.Request, destination any) bool {
	decoder := json.NewDecoder(http.MaxBytesReader(writer, request.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		writeProblem(writer, http.StatusBadRequest, "Invalid JSON request", err.Error(), "INVALID_JSON")
		return false
	}
	return true
}

func optionalQuery(request *http.Request, name string) *string {
	value := strings.TrimSpace(request.URL.Query().Get(name))
	if value == "" {
		return nil
	}
	return &value
}

func optionalIntQuery(request *http.Request, name string) *int64 {
	value := strings.TrimSpace(request.URL.Query().Get(name))
	if value == "" {
		return nil
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return nil
	}
	return &parsed
}

type CanonicalTestAdmin struct {
	pool      *database.Pool
	objects   objectstore.TestResetter
	buckets   []string
	generator *testprofile.Generator
	clock     func() time.Time
}

func NewCanonicalTestAdmin(pool *database.Pool, objects objectstore.TestResetter, buckets []string, generator *testprofile.Generator, clock func() time.Time) http.Handler {
	admin := &CanonicalTestAdmin{pool: pool, objects: objects, buckets: buckets, generator: generator, clock: clock}
	router := chi.NewRouter()
	router.Post("/__test/reset", admin.reset)
	return router
}

func (admin *CanonicalTestAdmin) reset(writer http.ResponseWriter, request *http.Request) {
	if admin.objects != nil {
		if err := admin.objects.ResetPrivateBuckets(request.Context(), admin.buckets); err != nil {
			writeProblem(writer, http.StatusInternalServerError, "Test reset failed", err.Error(), "TEST_RESET_FAILED")
			return
		}
	}
	admin.generator.Reset()
	if err := testprofile.Reset(request.Context(), admin.pool, admin.clock().UTC()); err != nil {
		writeProblem(writer, http.StatusInternalServerError, "Test reset failed", err.Error(), "TEST_RESET_FAILED")
		return
	}
	writeJSON(writer, http.StatusOK, map[string]string{"status": "reset"})
}

var _ = findings.StatusClosed
