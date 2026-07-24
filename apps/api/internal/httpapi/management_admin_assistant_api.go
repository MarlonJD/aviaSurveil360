package httpapi

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/administration"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/application"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/assistant"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/httpapi/generated"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/go-chi/chi/v5"
)

func (api *CanonicalAPI) getRiskOverview(
	writer http.ResponseWriter,
	request *http.Request,
) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	organizationID := strings.TrimSpace(request.URL.Query().Get("organizationId"))
	record, err := api.risk.GetOverview(request.Context(), actor, organizationID)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	var projectedOrganizationID *string
	if record.OrganizationID != "" {
		projectedOrganizationID = &record.OrganizationID
	}
	api.respond(writer, generated.RiskOverviewView{
		OrganizationId:      projectedOrganizationID,
		OverdueFindingCount: int64(record.OverdueFindingCount),
		OpenFindingCount:    int64(record.OpenFindingCount),
		RepeatFindingCount:  int64(record.RepeatFindingCount),
		Revision:            int64(record.Revision),
	}, nil)
}

func (api *CanonicalAPI) getRiskManagementProjection(
	writer http.ResponseWriter,
	request *http.Request,
) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	record, err := api.risk.GetManagementProjection(request.Context(), actor)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	body, err := json.Marshal(record)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	var output generated.RiskManagementProjectionView
	if err := json.Unmarshal(body, &output); err != nil {
		api.respond(writer, nil, err)
		return
	}
	api.respond(writer, output, nil)
}

func (api *CanonicalAPI) listAdministrationScreenProjections(
	writer http.ResponseWriter,
	request *http.Request,
) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	records, err := api.administration.ListScreenProjections(
		request.Context(), actor,
	)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	items := make([]generated.AdministrationScreenProjection, 0, len(records))
	for _, record := range records {
		item, err := administrationScreenProjection(record)
		if err != nil {
			api.respond(writer, nil, err)
			return
		}
		items = append(items, item)
	}
	api.respond(writer, generated.AdministrationScreenProjectionList(items), nil)
}

func (api *CanonicalAPI) getAdministrationScreenProjection(
	writer http.ResponseWriter,
	request *http.Request,
) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	record, err := api.administration.GetScreenProjection(
		request.Context(), actor, chi.URLParam(request, "screenId"),
	)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	output, err := administrationScreenProjection(record)
	api.respond(writer, output, err)
}

func (api *CanonicalAPI) invokeAdministrationVisibleAction(
	writer http.ResponseWriter,
	request *http.Request,
) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.InvokeAdministrationVisibleActionInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	screenID := chi.URLParam(request, "screenId")
	actionID := chi.URLParam(request, "actionId")
	if input.ScreenId != screenID || input.ActionId != actionID ||
		strings.TrimSpace(input.OperationId) == "" ||
		!validOptionalRevisionCommandHeaders(
			request, input.IdempotencyKey, input.ExpectedRevision,
		) {
		api.respond(writer, nil, application.ErrInvalid)
		return
	}
	record, err := api.administration.InvokeVisibleAction(
		request.Context(), actor, screenID, actionID,
	)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	effect, err := json.Marshal(record.Effect)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	api.respond(writer, generated.VisibleActionResult{
		ScreenId: record.ScreenID,
		ActionId: record.ActionID,
		Effect:   effect,
	}, nil)
}

func (api *CanonicalAPI) listAdminReportDefinitions(
	writer http.ResponseWriter,
	request *http.Request,
) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	records, err := api.administration.ListReportDefinitions(
		request.Context(), actor, request.URL.Query().Get("search"),
	)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	items := make([]generated.AdminReportDefinitionView, 0, len(records))
	for _, record := range records {
		items = append(items, generated.AdminReportDefinitionView{
			Id: record.ID, Title: record.Title, Description: record.Description,
			PackageFields: append([]string(nil), record.PackageFields...),
			ActionReason:  record.ActionReason,
		})
	}
	api.respond(writer, generated.AdminReportDefinitionPage{
		Items: items, NextCursor: nil,
	}, nil)
}

func (api *CanonicalAPI) listAdminAccessDirectory(
	writer http.ResponseWriter,
	request *http.Request,
) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	role := identity.Role(strings.TrimSpace(request.URL.Query().Get("role")))
	records, err := api.administration.ListAccessDirectory(
		request.Context(), actor, request.URL.Query().Get("search"), role,
	)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	items := make([]generated.AdminAccessDirectoryEntryView, 0, len(records))
	for _, record := range records {
		var organizationID *string
		if record.OrganizationID != "" {
			value := record.OrganizationID
			organizationID = &value
		}
		items = append(items, generated.AdminAccessDirectoryEntryView{
			SubjectId: record.SubjectID, DisplayName: record.DisplayName,
			Role: generated.Role(record.Role), OrganizationId: organizationID,
			Email: record.Email, Mfa: record.MFA, Invitation: record.Invitation,
			AccountStatus: record.AccountStatus,
		})
	}
	api.respond(writer, generated.AdminAccessDirectoryPage{
		Items: items, NextCursor: nil,
	}, nil)
}

func (api *CanonicalAPI) listAdminOrganizations(
	writer http.ResponseWriter,
	request *http.Request,
) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	records, err := api.administration.ListOrganizations(
		request.Context(), actor, administration.OrganizationFilters{
			Search:           request.URL.Query().Get("search"),
			OrganizationType: request.URL.Query().Get("organizationType"),
			Status:           request.URL.Query().Get("status"),
			Scope:            request.URL.Query().Get("scope"),
		},
	)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	items := make([]generated.AdminOrganizationView, 0, len(records))
	for _, record := range records {
		items = append(items, adminOrganizationView(record))
	}
	api.respond(writer, generated.AdminOrganizationPage{
		Items: items, NextCursor: nil,
	}, nil)
}

func (api *CanonicalAPI) getAdminOrganization(
	writer http.ResponseWriter,
	request *http.Request,
) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	record, err := api.administration.GetOrganization(
		request.Context(), actor, chi.URLParam(request, "organizationId"),
	)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	api.respond(writer, adminOrganizationView(record), nil)
}

func (api *CanonicalAPI) listAdminAuditEvents(
	writer http.ResponseWriter,
	request *http.Request,
) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	records, err := api.administration.ListAuditEvents(
		request.Context(), actor, administration.AuditEventFilters{
			Actor:    request.URL.Query().Get("actor"),
			Action:   request.URL.Query().Get("action"),
			Entity:   request.URL.Query().Get("entity"),
			System:   request.URL.Query().Get("system"),
			DateText: request.URL.Query().Get("dateText"),
		},
	)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	items := make([]generated.AuditEventView, 0, len(records))
	for _, record := range records {
		var actorRole *string
		if record.ActorRole != "" {
			value := string(record.ActorRole)
			actorRole = &value
		}
		var beforeStatus, afterStatus, reason *string
		if record.BeforeStatus != "" {
			value := record.BeforeStatus
			beforeStatus = &value
		}
		if record.AfterStatus != "" {
			value := record.AfterStatus
			afterStatus = &value
		}
		if record.Reason != "" {
			value := record.Reason
			reason = &value
		}
		items = append(items, generated.AuditEventView{
			EventId:    record.EventID,
			OccurredAt: record.OccurredAt.UTC().Format("2006-01-02T15:04:05.999999999Z07:00"),
			ActorRole:  actorRole,
			Action:     record.Action, EntityType: record.EntityType,
			EntityId: record.EntityID, BeforeStatus: beforeStatus,
			AfterStatus: afterStatus, Reason: reason,
		})
	}
	api.respond(writer, generated.ListAuditEventsOutput{
		Items: items, NextCursor: nil,
	}, nil)
}

func (api *CanonicalAPI) getAssistantGuidance(
	writer http.ResponseWriter,
	request *http.Request,
) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	record, err := api.assistant.GetGuidance(actor)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	api.respond(writer, generated.AssistantGuidance{
		AdvisoryOnly: record.AdvisoryOnly,
		ProhibitedActions: append(
			[]string(nil), record.ProhibitedActions...,
		),
	}, nil)
}

func (api *CanonicalAPI) createAssistantDraft(
	writer http.ResponseWriter,
	request *http.Request,
) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.CreateAssistantDraftInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	if !validOptionalRevisionCommandHeaders(
		request, input.IdempotencyKey, input.ExpectedRevision,
	) {
		api.respond(writer, nil, assistant.ErrInvalid)
		return
	}
	record, err := api.assistant.CreateDraft(
		request.Context(),
		actor,
		assistant.CreateDraftCommand{
			OperationID: input.OperationId, IdempotencyKey: input.IdempotencyKey,
			ExpectedRevision: input.ExpectedRevision,
			FindingID:        input.FindingId, Prompt: input.Prompt,
		},
	)
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	api.respond(writer, generated.AssistantDraftView{
		Id: record.ID, FindingId: record.FindingID, Prompt: record.Prompt,
		Draft: record.Draft, AdvisoryOnly: record.AdvisoryOnly,
		CanCreateFinding: record.CanCreateFinding,
		CanSetSeverity:   record.CanSetSeverity,
		CanCloseFinding:  record.CanCloseFinding,
	}, nil)
}

func administrationScreenProjection(
	record administration.ScreenProjection,
) (generated.AdministrationScreenProjection, error) {
	var organizationID, directRecordID *string
	if record.OrganizationID != "" {
		value := record.OrganizationID
		organizationID = &value
	}
	if record.DirectRecordID != "" {
		value := record.DirectRecordID
		directRecordID = &value
	}
	actions := make([]generated.VisibleScreenAction, 0, len(record.VisibleActions))
	for _, action := range record.VisibleActions {
		effect, err := json.Marshal(action.Effect)
		if err != nil {
			return generated.AdministrationScreenProjection{}, fmt.Errorf(
				"encode visible action %s: %w", action.ID, err,
			)
		}
		actions = append(actions, generated.VisibleScreenAction{
			Id: action.ID, Label: action.Label, Kind: string(action.Kind), Effect: effect,
		})
	}
	return generated.AdministrationScreenProjection{
		ScreenId: record.ScreenID, OrganizationId: organizationID,
		DirectRecordId: directRecordID, State: string(record.State),
		Overdue: record.Overdue, VersionHistory: record.VersionHistory,
		VisibleActions: actions,
	}, nil
}

func adminOrganizationView(
	record administration.OrganizationProjection,
) generated.AdminOrganizationView {
	var disabledReason *string
	if record.DisabledReason != "" {
		value := record.DisabledReason
		disabledReason = &value
	}
	return generated.AdminOrganizationView{
		Id: record.ID, LegalName: record.LegalName,
		OrganizationType: record.OrganizationType, Status: record.Status,
		Scope: record.Scope, DetailAvailable: record.DetailAvailable,
		DisabledReason: disabledReason,
	}
}
