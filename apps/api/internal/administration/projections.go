package administration

import (
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/jackc/pgx/v5"
)

const NotConfiguredInDemo = "Not configured in demo"

var ErrNotFound = errors.New("administration projection not found")

type ScreenState string
type ActionType string

const (
	ScreenReady    ScreenState = "ready"
	ScreenEmpty    ScreenState = "empty"
	ScreenDenied   ScreenState = "denied"
	ScreenReturned ScreenState = "returned"

	ActionNavigation         ActionType = "navigation"
	ActionModal              ActionType = "modal"
	ActionFilePreview        ActionType = "filePreview"
	ActionFileDownload       ActionType = "fileDownload"
	ActionLocalProjection    ActionType = "localProjection"
	ActionCapabilityDispatch ActionType = "capabilityDispatch"
)

type ConfirmCommandBinding struct {
	Owner                     string `json:"owner"`
	RequiresRevision          bool   `json:"requiresRevision"`
	RequiresIdempotency       bool   `json:"requiresIdempotency"`
	RequiresOperationMetadata bool   `json:"requiresOperationMetadata"`
}

type ActionEffect struct {
	Type           ActionType             `json:"type"`
	Target         string                 `json:"target,omitempty"`
	Dialog         string                 `json:"dialog,omitempty"`
	File           string                 `json:"file,omitempty"`
	Projection     string                 `json:"projection,omitempty"`
	Capability     string                 `json:"capability,omitempty"`
	ConfirmCommand *ConfirmCommandBinding `json:"confirmCommand,omitempty"`
}

type VisibleAction struct {
	ID     string       `json:"id"`
	Label  string       `json:"label"`
	Kind   ActionType   `json:"kind"`
	Effect ActionEffect `json:"effect"`
}

type ScreenProjection struct {
	ScreenID       string          `json:"screenId"`
	OrganizationID string          `json:"organizationId,omitempty"`
	DirectRecordID string          `json:"directRecordId,omitempty"`
	State          ScreenState     `json:"state"`
	Overdue        bool            `json:"overdue"`
	VersionHistory bool            `json:"versionHistory"`
	VisibleActions []VisibleAction `json:"visibleActions"`
}

type VisibleActionResult struct {
	ScreenID string       `json:"screenId"`
	ActionID string       `json:"actionId"`
	Effect   ActionEffect `json:"effect"`
}

type ReportDefinition struct {
	ID            string   `json:"id"`
	Title         string   `json:"title"`
	Description   string   `json:"description"`
	PackageFields []string `json:"packageFields"`
	ActionReason  string   `json:"actionReason"`
}

type AccessDirectoryEntry struct {
	SubjectID      string        `json:"subjectId"`
	DisplayName    string        `json:"displayName"`
	Role           identity.Role `json:"role"`
	OrganizationID string        `json:"organizationId,omitempty"`
	Email          string        `json:"email"`
	MFA            string        `json:"mfa"`
	Invitation     string        `json:"invitation"`
	AccountStatus  string        `json:"accountStatus"`
}

type OrganizationProjection struct {
	ID               string `json:"id"`
	LegalName        string `json:"legalName"`
	OrganizationType string `json:"organizationType"`
	Status           string `json:"status"`
	Scope            string `json:"scope"`
	DetailAvailable  bool   `json:"detailAvailable"`
	DisabledReason   string `json:"disabledReason,omitempty"`
}

type OrganizationFilters struct {
	Search           string
	OrganizationType string
	Status           string
	Scope            string
}

type AuditEventFilters struct {
	Actor    string
	Action   string
	Entity   string
	System   string
	DateText string
}

type AuditEventProjection struct {
	EventID        string        `json:"eventId"`
	OccurredAt     time.Time     `json:"occurredAt"`
	ActorRole      identity.Role `json:"actorRole,omitempty"`
	ActorSubjectID string        `json:"actorSubjectId,omitempty"`
	Action         string        `json:"action"`
	EntityType     string        `json:"entityType"`
	EntityID       string        `json:"entityId"`
	BeforeStatus   string        `json:"beforeStatus,omitempty"`
	AfterStatus    string        `json:"afterStatus,omitempty"`
	Reason         string        `json:"reason,omitempty"`
	EntityRevision *int64        `json:"entityRevision,omitempty"`
}

type ProjectionService struct {
	pool  *database.Pool
	clock func() time.Time
}

type ProjectionDependencies struct {
	Clock func() time.Time
}

func NewProjectionService(
	pool *database.Pool,
	dependencies ...ProjectionDependencies,
) *ProjectionService {
	clock := time.Now
	if len(dependencies) > 0 && dependencies[0].Clock != nil {
		clock = dependencies[0].Clock
	}
	return &ProjectionService{pool: pool, clock: clock}
}

type screenDefinition struct {
	ScreenID       string
	Path           string
	RequiredRole   identity.Role
	OrganizationID string
	DirectRecordID string
	State          ScreenState
	Overdue        bool
	VersionHistory bool
	VisibleActions []VisibleAction
}

//go:embed screens.json
var screenDefinitionsJSON []byte

var directRecordPattern = regexp.MustCompile(
	`/(AUD|FND|ORG|RPT|PR|CR|TPL)-[A-Z0-9-]+`,
)

var screenDefinitions = loadScreenDefinitions()

func (service *ProjectionService) GetScreenProjection(
	ctx context.Context,
	actor identity.Principal,
	screenID string,
) (ScreenProjection, error) {
	definition, found := findScreenDefinition(strings.TrimSpace(screenID))
	if !found {
		return ScreenProjection{}, ErrNotFound
	}
	if !canUseAdministration(actor) ||
		(definition.RequiredRole != "" && !actor.HasRole(definition.RequiredRole)) {
		return ScreenProjection{}, ErrForbidden
	}
	return service.projectScreen(ctx, actor, definition)
}

func (service *ProjectionService) ListScreenProjections(
	ctx context.Context,
	actor identity.Principal,
) ([]ScreenProjection, error) {
	if !canUseAdministration(actor) {
		return nil, ErrForbidden
	}
	items := make([]ScreenProjection, 0, len(screenDefinitions))
	for _, definition := range screenDefinitions {
		if definition.RequiredRole == "" || actor.HasRole(definition.RequiredRole) {
			projected, err := service.projectScreen(ctx, actor, definition)
			if err != nil {
				return nil, err
			}
			items = append(items, projected)
		}
	}
	return items, nil
}

func (service *ProjectionService) InvokeVisibleAction(
	ctx context.Context,
	actor identity.Principal,
	screenID string,
	actionID string,
) (VisibleActionResult, error) {
	screen, err := service.GetScreenProjection(ctx, actor, screenID)
	if err != nil {
		return VisibleActionResult{}, err
	}
	for _, action := range screen.VisibleActions {
		if action.ID == strings.TrimSpace(actionID) {
			return VisibleActionResult{
				ScreenID: screen.ScreenID, ActionID: action.ID, Effect: action.Effect,
			}, nil
		}
	}
	return VisibleActionResult{}, ErrNotFound
}

func (service *ProjectionService) ListReportDefinitions(
	ctx context.Context,
	actor identity.Principal,
	search string,
) ([]ReportDefinition, error) {
	if !actor.HasRole(identity.RoleAdmin) {
		return nil, ErrForbidden
	}
	rows, err := service.pool.Query(ctx, `
		SELECT DISTINCT ON (definition_id)
			definition_id, title, description, definition
		FROM report_definition_versions
		ORDER BY definition_id, version DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	needle := strings.ToLower(strings.TrimSpace(search))
	items := []ReportDefinition{}
	for rows.Next() {
		var item ReportDefinition
		var definition []byte
		if err := rows.Scan(
			&item.ID, &item.Title, &item.Description, &definition,
		); err != nil {
			return nil, err
		}
		var fields struct {
			PackageFields []string `json:"packageFields"`
			ActionReason  string   `json:"actionReason"`
		}
		if err := json.Unmarshal(definition, &fields); err != nil {
			return nil, fmt.Errorf("decode report definition %s: %w", item.ID, err)
		}
		item.PackageFields = append([]string(nil), fields.PackageFields...)
		item.ActionReason = fields.ActionReason
		if needle == "" || strings.Contains(strings.ToLower(
			item.ID+" "+item.Title+" "+item.Description,
		), needle) {
			items = append(items, item)
		}
	}
	return items, rows.Err()
}

func (service *ProjectionService) ListAccessDirectory(
	ctx context.Context,
	actor identity.Principal,
	search string,
	role identity.Role,
) ([]AccessDirectoryEntry, error) {
	if !actor.HasRole(identity.RoleAdmin) {
		return nil, ErrForbidden
	}
	rows, err := service.pool.Query(ctx, `
		SELECT DISTINCT
			identity.subject_id,
			identity.display_name,
			session_role.role,
			COALESCE(session.organization_id, '')
		FROM identity_references identity
		JOIN session_references session
		  ON session.subject_id = identity.subject_id
		 AND session.revoked_at IS NULL
		CROSS JOIN LATERAL unnest(session.roles) AS session_role(role)
		WHERE identity.tombstoned_at IS NULL
		ORDER BY identity.display_name, identity.subject_id, session_role.role
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	needle := strings.ToLower(strings.TrimSpace(search))
	items := []AccessDirectoryEntry{}
	for rows.Next() {
		var item AccessDirectoryEntry
		var roleText string
		if err := rows.Scan(
			&item.SubjectID, &item.DisplayName, &roleText, &item.OrganizationID,
		); err != nil {
			return nil, err
		}
		item.Role = identity.Role(roleText)
		if item.OrganizationID == "CAA" {
			item.OrganizationID = ""
		}
		item.Email = NotConfiguredInDemo
		item.MFA = NotConfiguredInDemo
		item.Invitation = NotConfiguredInDemo
		item.AccountStatus = NotConfiguredInDemo
		if role != "" && item.Role != role {
			continue
		}
		if needle != "" && !strings.Contains(strings.ToLower(
			item.SubjectID+" "+item.DisplayName+" "+roleText+" "+item.OrganizationID,
		), needle) {
			continue
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *ProjectionService) ListOrganizations(
	ctx context.Context,
	actor identity.Principal,
	filters OrganizationFilters,
) ([]OrganizationProjection, error) {
	if !actor.HasRole(identity.RoleAdmin) {
		return nil, ErrForbidden
	}
	rows, err := service.pool.Query(ctx, `
		SELECT id, legal_name, organization_type, status
		FROM organizations
		WHERE tombstoned_at IS NULL
		ORDER BY legal_name, id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	needle := strings.ToLower(strings.TrimSpace(filters.Search))
	organizationType := strings.ToUpper(strings.TrimSpace(filters.OrganizationType))
	status := strings.ToUpper(strings.TrimSpace(filters.Status))
	scope := strings.ToLower(strings.TrimSpace(filters.Scope))
	items := []OrganizationProjection{}
	for rows.Next() {
		var item OrganizationProjection
		if err := rows.Scan(
			&item.ID, &item.LegalName, &item.OrganizationType, &item.Status,
		); err != nil {
			return nil, err
		}
		item.Scope = "CAA oversight"
		item.DetailAvailable = item.ID == "ORG-FLY-NAMIBIA"
		if !item.DetailAvailable {
			item.DisabledReason = "No declared contextual Admin detail route."
		}
		if needle != "" && !strings.Contains(strings.ToLower(
			item.ID+" "+item.LegalName,
		), needle) {
			continue
		}
		if organizationType != "" && item.OrganizationType != organizationType {
			continue
		}
		if status != "" && item.Status != status {
			continue
		}
		if scope != "" && strings.ToLower(item.Scope) != scope {
			continue
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (service *ProjectionService) GetOrganization(
	ctx context.Context,
	actor identity.Principal,
	organizationID string,
) (OrganizationProjection, error) {
	if !actor.HasRole(identity.RoleAdmin) {
		return OrganizationProjection{}, ErrForbidden
	}
	if strings.TrimSpace(organizationID) != "ORG-FLY-NAMIBIA" {
		return OrganizationProjection{}, ErrNotFound
	}
	var item OrganizationProjection
	err := service.pool.QueryRow(ctx, `
		SELECT id, legal_name, organization_type, status
		FROM organizations
		WHERE id = $1 AND tombstoned_at IS NULL
	`, organizationID).Scan(
		&item.ID, &item.LegalName, &item.OrganizationType, &item.Status,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return OrganizationProjection{}, ErrNotFound
	}
	if err != nil {
		return OrganizationProjection{}, err
	}
	item.Scope = "CAA oversight"
	item.DetailAvailable = true
	return item, nil
}

func (service *ProjectionService) ListAuditEvents(
	ctx context.Context,
	actor identity.Principal,
	filters AuditEventFilters,
) ([]AuditEventProjection, error) {
	if !actor.HasRole(identity.RoleAdmin) {
		return nil, ErrForbidden
	}
	rows, err := service.pool.Query(ctx, `
		SELECT
			event.event_id,
			event.occurred_at,
			COALESCE(event.actor_role, ''),
			COALESCE(event.actor_subject_id, ''),
			COALESCE(identity.display_name, ''),
			event.action,
			event.entity_type,
			event.entity_id,
			event.before_status,
			event.after_status,
			event.reason,
			event.entity_version
		FROM audit_events event
		LEFT JOIN identity_references identity
		  ON identity.subject_id = event.actor_subject_id
		ORDER BY event.occurred_at DESC, event.sequence_id DESC
		LIMIT 500
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	actorNeedle := strings.ToLower(strings.TrimSpace(filters.Actor))
	actionNeedle := strings.ToLower(strings.TrimSpace(filters.Action))
	entityNeedle := strings.ToLower(strings.TrimSpace(filters.Entity))
	systemNeedle := strings.ToUpper(strings.TrimSpace(filters.System))
	dateNeedle := strings.TrimSpace(filters.DateText)
	items := []AuditEventProjection{}
	for rows.Next() {
		var item AuditEventProjection
		var actorRole, displayName string
		var beforeStatus, afterStatus, reason *string
		if err := rows.Scan(
			&item.EventID, &item.OccurredAt, &actorRole, &item.ActorSubjectID,
			&displayName, &item.Action, &item.EntityType, &item.EntityID,
			&beforeStatus, &afterStatus, &reason, &item.EntityRevision,
		); err != nil {
			return nil, err
		}
		item.ActorRole = identity.Role(actorRole)
		if beforeStatus != nil {
			item.BeforeStatus = *beforeStatus
		}
		if afterStatus != nil {
			item.AfterStatus = *afterStatus
		}
		if reason != nil {
			item.Reason = *reason
		}
		systemKind := "MANUAL"
		if item.ActorSubjectID == "" && actorRole == "" {
			systemKind = "SYSTEM"
		}
		if actorNeedle != "" && !strings.Contains(strings.ToLower(
			item.ActorSubjectID+" "+actorRole+" "+displayName,
		), actorNeedle) {
			continue
		}
		if actionNeedle != "" &&
			!strings.Contains(strings.ToLower(item.Action), actionNeedle) {
			continue
		}
		if entityNeedle != "" && !strings.Contains(strings.ToLower(
			item.EntityType+" "+item.EntityID,
		), entityNeedle) {
			continue
		}
		if systemNeedle != "" && systemKind != systemNeedle {
			continue
		}
		if dateNeedle != "" &&
			!strings.Contains(item.OccurredAt.UTC().Format(time.RFC3339), dateNeedle) {
			continue
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func findScreenDefinition(screenID string) (screenDefinition, bool) {
	for _, definition := range screenDefinitions {
		if definition.ScreenID == screenID {
			return definition, true
		}
	}
	return screenDefinition{}, false
}

func (service *ProjectionService) projectScreen(
	ctx context.Context,
	actor identity.Principal,
	definition screenDefinition,
) (ScreenProjection, error) {
	output := ScreenProjection{
		ScreenID:       definition.ScreenID,
		OrganizationID: definition.OrganizationID,
		DirectRecordID: definition.DirectRecordID,
		State:          definition.State, Overdue: definition.Overdue,
		VersionHistory: definition.VersionHistory,
		VisibleActions: append([]VisibleAction(nil), definition.VisibleActions...),
	}
	if actor.HasRole(identity.RoleAuditee) {
		output.OrganizationID = actor.OrganizationID
	}
	if strings.Contains(definition.ScreenID, "messages") {
		var communicationCount int
		query := `SELECT count(*) FROM communication_messages`
		arguments := []any{}
		if actor.HasRole(identity.RoleAuditee) {
			query += `
				WHERE visibility = 'AUDITEE_VISIBLE'
				  AND organization_id = $1
			`
			arguments = append(arguments, actor.OrganizationID)
		}
		if err := service.pool.QueryRow(
			ctx,
			query,
			arguments...,
		).Scan(&communicationCount); err != nil {
			return ScreenProjection{}, err
		}
		if communicationCount == 0 {
			output.State = ScreenEmpty
		}
	}
	if output.DirectRecordID == "" {
		return output, nil
	}
	var findingStatus string
	var findingDueDate *time.Time
	err := service.pool.QueryRow(ctx, `
		SELECT status, due_date
		FROM findings
		WHERE id = $1 AND tombstoned_at IS NULL
	`, output.DirectRecordID).Scan(&findingStatus, &findingDueDate)
	if err == nil {
		if findingStatus == "EVIDENCE_MORE_INFORMATION_REQUESTED" {
			output.State = ScreenReturned
		}
		if findingStatus != "CLOSED" && findingDueDate != nil {
			today := service.clock().UTC().Truncate(24 * time.Hour)
			due := findingDueDate.UTC().Truncate(24 * time.Hour)
			output.Overdue = due.Before(today)
		}
		var capHistory, evidenceHistory, reportHistory int
		if err := service.pool.QueryRow(ctx, `
			SELECT
				(SELECT count(*) FROM cap_revisions WHERE finding_id = $1),
				(SELECT count(*) FROM evidence_versions WHERE finding_id = $1),
				(
					SELECT count(*)
					FROM report_versions
					WHERE snapshot -> 'findingIds' ? $1
				)
		`, output.DirectRecordID).Scan(
			&capHistory, &evidenceHistory, &reportHistory,
		); err != nil {
			return ScreenProjection{}, err
		}
		output.VersionHistory = capHistory > 1 ||
			evidenceHistory > 1 || reportHistory > 1
		return output, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return ScreenProjection{}, err
	}
	var reportStatus, reportID string
	err = service.pool.QueryRow(ctx, `
		SELECT status, report_id
		FROM report_versions
		WHERE id = $1
	`, output.DirectRecordID).Scan(&reportStatus, &reportID)
	if err == nil {
		if reportStatus == "RETURNED" {
			output.State = ScreenReturned
		}
		var history int
		if err := service.pool.QueryRow(ctx, `
			SELECT count(*) FROM report_versions WHERE report_id = $1
		`, reportID).Scan(&history); err != nil {
			return ScreenProjection{}, err
		}
		output.VersionHistory = history > 1
		return output, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return ScreenProjection{}, err
	}
	return output, nil
}

func loadScreenDefinitions() []screenDefinition {
	type encodedDefinition struct {
		ScreenID       string          `json:"screenId"`
		Path           string          `json:"path"`
		RequiredRole   identity.Role   `json:"requiredRole"`
		VisibleActions []VisibleAction `json:"visibleActions"`
	}
	var encoded []encodedDefinition
	if err := json.Unmarshal(screenDefinitionsJSON, &encoded); err != nil {
		panic(fmt.Sprintf("decode embedded Administration screen registry: %v", err))
	}
	if len(encoded) != 86 {
		panic(fmt.Sprintf(
			"embedded Administration screen registry has %d screens; want 86",
			len(encoded),
		))
	}
	seenScreens := map[string]struct{}{}
	definitions := make([]screenDefinition, 0, len(encoded))
	actionCount := 0
	for _, item := range encoded {
		item.ScreenID = strings.TrimSpace(item.ScreenID)
		item.Path = strings.TrimSpace(item.Path)
		if item.ScreenID == "" || item.Path == "" {
			panic("embedded Administration screen registry contains an empty identity")
		}
		if _, exists := seenScreens[item.ScreenID]; exists {
			panic("embedded Administration screen registry contains duplicate " + item.ScreenID)
		}
		seenScreens[item.ScreenID] = struct{}{}
		directRecordID := ""
		if match := directRecordPattern.FindString(item.Path); match != "" {
			directRecordID = strings.TrimPrefix(match, "/")
		}
		seenActions := map[string]struct{}{}
		for _, action := range item.VisibleActions {
			if action.ID == "" || action.Kind == "" || action.Effect.Type != action.Kind {
				panic("embedded Administration screen registry has an invalid action on " + item.ScreenID)
			}
			if _, exists := seenActions[action.ID]; exists {
				panic("embedded Administration screen registry has a duplicate action on " + item.ScreenID)
			}
			seenActions[action.ID] = struct{}{}
			actionCount++
		}
		definitions = append(definitions, screenDefinition{
			ScreenID: item.ScreenID, Path: item.Path,
			RequiredRole: item.RequiredRole, DirectRecordID: directRecordID,
			State: ScreenReady, VisibleActions: item.VisibleActions,
		})
	}
	if actionCount != 108 {
		panic(fmt.Sprintf(
			"embedded Administration screen registry has %d actions; want 108",
			actionCount,
		))
	}
	return definitions
}

func canUseAdministration(actor identity.Principal) bool {
	return actor.HasRole(
		identity.RoleInspector,
		identity.RoleLeadInspector,
		identity.RoleDepartmentManager,
		identity.RoleFinance,
		identity.RoleGeneralManager,
		identity.RoleExecutiveDirector,
		identity.RoleAuditee,
		identity.RoleAdmin,
	)
}
