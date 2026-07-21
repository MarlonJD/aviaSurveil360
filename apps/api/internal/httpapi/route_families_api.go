package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/application"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/auditlog"
	auditstore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/auditlog/store/postgres"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/configuration"
	configurationstore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/configuration/store/postgres"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/httpapi/generated"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/organizations"
	organizationstore "github.com/MarlonJD/aviaSurveil360/apps/api/internal/organizations/store/postgres"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/planning"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

func (api *CanonicalAPI) listOrganizations(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	if actor.HasRole(identity.RoleFinance) || (!actor.HasRole(identity.RoleAuditee) && !actor.IsCAA()) {
		api.respond(writer, nil, fmt.Errorf("%w: Organization Registry access is not available to this role", application.ErrForbidden))
		return
	}
	scope := ""
	if actor.HasRole(identity.RoleAuditee) {
		if !organizations.CanView(actor, actor.OrganizationID) {
			api.respond(writer, nil, application.ErrForbidden)
			return
		}
		scope = actor.OrganizationID
	}
	records, err := organizationstore.New(api.pool).ListOrganizationRegistry(request.Context(), organizationstore.ListOrganizationRegistryParams{
		OrganizationScope: scope,
		ResultLimit:       boundedPageLimit(optionalIntQuery(request, "limit")),
	})
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	items := make([]generated.OrganizationSummary, 0, len(records))
	for _, record := range records {
		item := generated.OrganizationSummary{
			Id: record.ID, LegalName: record.LegalName, OrganizationType: record.OrganizationType,
			Status: record.Status, OpenFindingCount: record.OpenFindingCount, Revision: record.Revision,
		}
		if record.LastAuditDate != "" {
			value := record.LastAuditDate
			item.LastAuditDate = &value
		}
		if record.NextAuditDate != "" {
			value := record.NextAuditDate
			item.NextAuditDate = &value
		}
		items = append(items, item)
	}
	api.respond(writer, generated.ListOrganizationsOutput{Items: items}, nil)
}

func (api *CanonicalAPI) listPlanningItems(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	items, err := api.planning.List(request.Context(), actor, boundedPageLimit(optionalIntQuery(request, "limit")))
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	views := make([]generated.PlanningItemView, 0, len(items))
	for _, item := range items {
		views = append(views, planningView(item))
	}
	api.respond(writer, generated.ListPlanningItemsOutput{Items: views}, nil)
}

func (api *CanonicalAPI) decidePlanningItem(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	var input generated.PlanningDecisionInput
	if !decodeJSON(writer, request, &input) {
		return
	}
	if input.PlanningItemId != chi.URLParam(request, "id") {
		api.respond(writer, nil, fmt.Errorf("%w: planning path and body must match", application.ErrInvalid))
		return
	}
	item, err := api.planning.Decide(request.Context(), actor, planning.DecideCommand{
		OperationID: input.OperationId, PlanningItemID: input.PlanningItemId,
		ExpectedRevision: input.ExpectedPlanningRevision, Decision: planning.Decision(input.Decision),
		Reason: input.Reason,
	})
	api.respond(writer, planningView(item), err)
}

func (api *CanonicalAPI) listChecklistTemplateVersions(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	if !configuration.CanReadChecklistTemplateVersionDetail(actor) {
		api.respond(writer, nil, fmt.Errorf("%w: Admin configuration authority is required", application.ErrForbidden))
		return
	}
	records, err := configurationstore.New(api.pool).ListChecklistTemplateVersions(request.Context(), boundedPageLimit(optionalIntQuery(request, "limit")))
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	items := make([]generated.ChecklistTemplateVersionView, 0, len(records))
	for _, record := range records {
		items = append(items, generated.ChecklistTemplateVersionView{
			Id: record.ID, TemplateId: record.TemplateID, Title: record.Title,
			Version: int64(record.Version), Status: "PUBLISHED",
			PublishedAt:   record.PublishedAt.Time.UTC().Format(time.RFC3339Nano),
			QuestionCount: record.QuestionCount,
		})
	}
	api.respond(writer, generated.ListChecklistTemplateVersionsOutput{Items: items}, nil)
}

func (api *CanonicalAPI) getChecklistTemplateVersion(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	if !configuration.CanReadChecklistTemplateVersionDetail(actor) {
		api.respond(writer, nil, fmt.Errorf("%w: Admin configuration authority is required", application.ErrForbidden))
		return
	}
	record, err := configurationstore.New(api.pool).GetChecklistTemplateVersion(request.Context(), chi.URLParam(request, "templateVersionId"))
	if err != nil {
		api.respond(writer, nil, checklistTemplateVersionDetailStoreError(err))
		return
	}
	view, err := checklistTemplateVersionDetailView(checklistTemplateVersionRecord{
		ID: record.ID, TemplateID: record.TemplateID, Title: record.Title,
		Version: record.Version, PublishedAt: record.PublishedAt.Time.UTC(),
		QuestionCount: record.QuestionCount, Snapshot: record.Snapshot,
	})
	api.respond(writer, view, err)
}

type checklistTemplateVersionRecord struct {
	ID            string
	TemplateID    string
	Title         string
	Version       int32
	PublishedAt   time.Time
	QuestionCount int64
	Snapshot      []byte
}

type checklistTemplateVersionSnapshot struct {
	Questions []checklistTemplateQuestionSnapshot `json:"questions"`
}

type checklistTemplateQuestionSnapshot struct {
	ID                  string                      `json:"id"`
	SectionID           string                      `json:"sectionId"`
	Prompt              string                      `json:"prompt"`
	RegulatoryReference string                      `json:"regulatoryReference"`
	ExpectedEvidence    string                      `json:"expectedEvidence"`
	AllowedAnswers      []generated.ChecklistAnswer `json:"allowedAnswers"`
	CommentRequiredFor  []generated.ChecklistAnswer `json:"commentRequiredFor"`
}

func checklistTemplateVersionDetailStoreError(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return application.ErrNotFound
	}
	return err
}

func checklistTemplateVersionDetailView(record checklistTemplateVersionRecord) (generated.ChecklistTemplateVersionDetailView, error) {
	if strings.TrimSpace(record.ID) == "" || strings.TrimSpace(record.TemplateID) == "" || strings.TrimSpace(record.Title) == "" {
		return generated.ChecklistTemplateVersionDetailView{}, fmt.Errorf("%w: checklist template version identity is required", application.ErrInvalid)
	}
	var snapshot checklistTemplateVersionSnapshot
	if err := json.Unmarshal(record.Snapshot, &snapshot); err != nil {
		return generated.ChecklistTemplateVersionDetailView{}, fmt.Errorf("decode checklist template snapshot: %w", err)
	}
	if len(snapshot.Questions) == 0 {
		return generated.ChecklistTemplateVersionDetailView{}, fmt.Errorf("%w: checklist template snapshot must include questions", application.ErrInvalid)
	}
	questionCount := record.QuestionCount
	if questionCount == 0 {
		questionCount = int64(len(snapshot.Questions))
	}
	if questionCount != int64(len(snapshot.Questions)) {
		return generated.ChecklistTemplateVersionDetailView{}, fmt.Errorf("%w: checklist template snapshot question count mismatch", application.ErrInvalid)
	}
	view := generated.ChecklistTemplateVersionDetailView{
		Id: record.ID, TemplateId: record.TemplateID, Title: record.Title,
		Version: int64(record.Version), Status: "PUBLISHED",
		PublishedAt:   record.PublishedAt.UTC().Format(time.RFC3339Nano),
		QuestionCount: questionCount,
		Questions:     make([]generated.ChecklistTemplateQuestionView, 0, len(snapshot.Questions)),
	}
	for index, question := range snapshot.Questions {
		if strings.TrimSpace(question.ID) == "" || strings.TrimSpace(question.SectionID) == "" || strings.TrimSpace(question.Prompt) == "" ||
			len(question.AllowedAnswers) == 0 || len(question.CommentRequiredFor) == 0 {
			return generated.ChecklistTemplateVersionDetailView{}, fmt.Errorf("%w: checklist template snapshot question %d is incomplete", application.ErrInvalid, index+1)
		}
		regulatoryReference := optionalTemplateText(question.RegulatoryReference)
		expectedEvidence := optionalTemplateText(question.ExpectedEvidence)
		view.Questions = append(view.Questions, generated.ChecklistTemplateQuestionView{
			Id: question.ID, SectionId: question.SectionID, Prompt: question.Prompt,
			RegulatoryReference: regulatoryReference, ExpectedEvidence: expectedEvidence,
			AllowedAnswers:     append([]generated.ChecklistAnswer(nil), question.AllowedAnswers...),
			CommentRequiredFor: append([]generated.ChecklistAnswer(nil), question.CommentRequiredFor...),
		})
	}
	return view, nil
}

func optionalTemplateText(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return &value
}

func (api *CanonicalAPI) listReminderRules(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	if !configuration.CanPreview(actor) {
		api.respond(writer, nil, fmt.Errorf("%w: Admin configuration authority is required", application.ErrForbidden))
		return
	}
	records, err := configurationstore.New(api.pool).ListReminderRules(request.Context(), boundedPageLimit(optionalIntQuery(request, "limit")))
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	items := make([]generated.ReminderRuleView, 0, len(records))
	for _, record := range records {
		items = append(items, generated.ReminderRuleView{
			Id: record.ID, Label: record.Label, OffsetDays: int64(record.OffsetDays),
			Channel: record.Channel, Status: record.Status, Revision: record.Revision,
		})
	}
	api.respond(writer, generated.ListReminderRulesOutput{Items: items}, nil)
}

func (api *CanonicalAPI) listAuditEvents(writer http.ResponseWriter, request *http.Request) {
	actor, ok := requirePrincipal(writer, request)
	if !ok {
		return
	}
	if !auditlog.CanReadInternal(actor) {
		api.respond(writer, nil, fmt.Errorf("%w: Internal CAA audit-trail authority is required", application.ErrForbidden))
		return
	}
	records, err := auditstore.New(api.pool).ListAuditEvents(request.Context(), auditstore.ListAuditEventsParams{
		EntityTypeFilter: valueOr(optionalQuery(request, "entityType"), ""),
		EntityIDFilter:   valueOr(optionalQuery(request, "entityId"), ""),
		ResultLimit:      boundedPageLimit(optionalIntQuery(request, "limit")),
	})
	if err != nil {
		api.respond(writer, nil, err)
		return
	}
	items := make([]generated.AuditEventView, 0, len(records))
	for _, record := range records {
		items = append(items, generated.AuditEventView{
			EventId: record.EventID, OccurredAt: record.OccurredAt.Time.UTC().Format(time.RFC3339Nano),
			ActorRole: record.ActorRole, Action: record.Action, EntityType: record.EntityType,
			EntityId: record.EntityID, BeforeStatus: record.BeforeStatus,
			AfterStatus: record.AfterStatus, Reason: record.Reason,
		})
	}
	api.respond(writer, generated.ListAuditEventsOutput{Items: items}, nil)
}

func planningView(item planning.Item) generated.PlanningItemView {
	return generated.PlanningItemView{
		Id: item.ID, Title: item.Title, PlanYear: int64(item.PlanYear),
		OrganizationId: item.OrganizationID, OrganizationName: item.OrganizationName,
		InspectionType: item.InspectionType, ScheduledDate: item.ScheduledDate,
		EstimatedBudget: item.EstimatedBudget, Status: generated.PlanningStatus(item.Status),
		CurrentOwnerRole: generated.Role(item.CurrentOwnerRole), NextAction: item.NextAction,
		Revision: item.Revision,
	}
}

func boundedPageLimit(limit *int64) int32 {
	if limit == nil || *limit <= 0 || *limit > 100 {
		return 100
	}
	return int32(*limit)
}
