package testprofile

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/jackc/pgx/v5"
)

const (
	CanonicalAuditID            = "AUD-2026-001"
	CanonicalPackageID          = "PKG-CAB-2026-001"
	CanonicalFindingID          = "FND-CAB-2026-001"
	CanonicalInspectorSubjectID = "154ec5ac-6f97-4f55-916f-d2f142fc6211"
)

type Generator struct {
	mu       sync.Mutex
	counters map[string]int
}

func NewGenerator() *Generator {
	return &Generator{counters: map[string]int{}}
}

func (generator *Generator) Reset() {
	generator.mu.Lock()
	defer generator.mu.Unlock()
	generator.counters = map[string]int{}
}

func (generator *Generator) Next(prefix string) string {
	generator.mu.Lock()
	defer generator.mu.Unlock()
	generator.counters[prefix]++
	sequence := generator.counters[prefix]
	switch prefix {
	case "potential-finding":
		return fmt.Sprintf("PF-2026-%03d", sequence)
	case "finding":
		return fmt.Sprintf("FND-CAB-2026-%03d", sequence)
	case "cap":
		return fmt.Sprintf("CAP-CAB-2026-%03d", sequence)
	case "cap-revision":
		return fmt.Sprintf("CAP-CAB-2026-001-R%d", sequence)
	case "evidence":
		return "EVD-CAB-2026-001"
	case "evidence-version":
		return fmt.Sprintf("EVD-CAB-2026-001-V%d", sequence)
	default:
		return fmt.Sprintf("%s-candidate-%03d", prefix, sequence)
	}
}

func (generator *Generator) FindingReference() string {
	return "CAB-2026-001"
}

type canonicalQuestion struct {
	ID                  string   `json:"id"`
	SectionID           string   `json:"sectionId"`
	Prompt              string   `json:"prompt"`
	RegulatoryReference string   `json:"regulatoryReference"`
	ExpectedEvidence    string   `json:"expectedEvidence"`
	AllowedAnswers      []string `json:"allowedAnswers"`
	CommentRequiredFor  []string `json:"commentRequiredFor"`
	Assigned            []string `json:"assignedInspectorUserIds"`
}

func Reset(ctx context.Context, pool *database.Pool, now time.Time) error {
	if pool == nil || now.IsZero() {
		return errors.New("canonical test reset requires database and server time")
	}
	now = now.UTC()
	allowedAnswers := []string{"COMPLIANT", "NON_COMPLIANT", "OBSERVATION", "NOT_APPLICABLE", "NOT_CHECKED"}
	commentRequiredFor := []string{"NON_COMPLIANT", "OBSERVATION"}
	question := func(id, sectionID, prompt, expectedEvidence string, assigned []string) canonicalQuestion {
		return canonicalQuestion{
			ID: id, SectionID: sectionID, Prompt: prompt,
			RegulatoryReference: fmt.Sprintf("Configured Cabin Inspection reference — %s", sectionID),
			ExpectedEvidence:    expectedEvidence,
			AllowedAnswers:      append([]string(nil), allowedAnswers...),
			CommentRequiredFor:  append([]string(nil), commentRequiredFor...),
			Assigned:            append([]string(nil), assigned...),
		}
	}
	questions := []canonicalQuestion{
		question("CAB-GALLEY-001", "GALLEY", "Are galley restraints and stowage areas serviceable and secure?", "Inspector observation and required exception comment", []string{"USR-INSPECTOR-DAVID"}),
		question("CAB-LAV-001", "LAV", "Are lavatory safety equipment and placards present and serviceable?", "Inspector observation and required exception comment", []string{CanonicalInspectorSubjectID}),
		question("CAB-PAX-SEAT-001", "PAX SEAT", "Are passenger seats, belts, and adjacent fittings serviceable?", "Inspector observation and required exception comment", []string{CanonicalInspectorSubjectID}),
		question("CAB-EMEQ-PBE-001", "EM EQ / PBE", "Is the PBE installed, serviceable, accessible, and in compliance with configured cabin emergency equipment requirements?", "PBE serviceability record and cabin position confirmation", []string{CanonicalInspectorSubjectID}),
		question("CAB-VID-CREW-SEAT-001", "VID+CREW SEAT", "Are cabin information displays and crew seats serviceable?", "Inspector observation and required exception comment", []string{CanonicalInspectorSubjectID}),
		question("CAB-COCKPIT-GEN-001", "COCKPIT+CAB GEN COND+EXITS", "Are cabin general condition and emergency exits satisfactory?", "Inspector observation and required exception comment", []string{CanonicalInspectorSubjectID}),
	}
	snapshot, err := json.Marshal(map[string]any{
		"schemaVersion": 1, "protocolVersion": 1, "questions": questions,
	})
	if err != nil {
		return err
	}
	return database.WithinTransaction(ctx, pool, func(ctx context.Context, transaction pgx.Tx) error {
		if _, err := transaction.Exec(ctx, `
			TRUNCATE TABLE
				reminder_rules, surveillance_plan_items,
				oidc_login_states, idempotency_responses, authorized_sync_changes, sync_cursors, sync_cursor_tokens,
				audit_events, outbox_messages, review_decisions, report_decisions,
				report_approval_states, report_versions, evidence_version_states, evidence_versions,
				inspection_attachments, upload_sessions, object_metadata, cap_revisions, findings,
				potential_findings, checklist_responses, offline_grants, inspection_checklists,
				inspection_question_assignments, inspection_packages, checklist_template_versions,
				inspections, session_references, identity_references, organizations
			RESTART IDENTITY CASCADE
		`); err != nil {
			return fmt.Errorf("truncate canonical test state: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO organizations (id, legal_name, organization_type, status, created_at, updated_at) VALUES
				('CAA', 'Civil Aviation Authority', 'AUTHORITY', 'ACTIVE', $1, $1),
				('ORG-FLY-NAMIBIA', 'Fly Namibia', 'OPERATOR', 'ACTIVE', $1, $1),
				('ORG-SKYCARGO', 'SkyCargo Air', 'OPERATOR', 'ACTIVE', $1, $1)
		`, now); err != nil {
			return fmt.Errorf("seed canonical organizations: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO identity_references (subject_id, issuer, display_name, created_at) VALUES
				($2, 'urn:avia:test', 'Local Inspector', $1),
				('USR-INSPECTOR-DAVID', 'urn:avia:test', 'David Inspector', $1),
				('USR-LEAD-CANER', 'urn:avia:test', 'Caner Lead Inspector', $1),
				('USR-MANAGER-NORA', 'urn:avia:test', 'Nora Department Manager', $1),
				('USR-FINANCE-LINA', 'urn:avia:test', 'Lina Finance Reviewer', $1),
				('USR-GM-OMAR', 'urn:avia:test', 'Omar General Manager', $1),
				('USR-ED-ZARA', 'urn:avia:test', 'Zara Executive Director', $1),
				('USR-ADMIN-ADA', 'urn:avia:test', 'Ada Administrator', $1),
				('USR-AUDITEE-FLY', 'urn:avia:test', 'Fly Namibia Auditee', $1)
		`, now, CanonicalInspectorSubjectID); err != nil {
			return fmt.Errorf("seed canonical identities: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO session_references (
				id, subject_id, organization_id, expires_at, last_seen_at, absolute_expires_at, roles, created_at
			) VALUES
				('TEST-CANONICAL-INSPECTOR', $3, 'CAA', $2, $1, $2, ARRAY['inspector'], $1),
				('TEST-USR-INSPECTOR-DAVID', 'USR-INSPECTOR-DAVID', 'CAA', $2, $1, $2, ARRAY['inspector'], $1),
				('TEST-USR-LEAD-CANER', 'USR-LEAD-CANER', 'CAA', $2, $1, $2, ARRAY['leadInspector'], $1),
				('TEST-USR-MANAGER-NORA', 'USR-MANAGER-NORA', 'CAA', $2, $1, $2, ARRAY['manager'], $1),
				('TEST-USR-FINANCE-LINA', 'USR-FINANCE-LINA', 'CAA', $2, $1, $2, ARRAY['finance'], $1),
				('TEST-USR-GM-OMAR', 'USR-GM-OMAR', 'CAA', $2, $1, $2, ARRAY['gm'], $1),
				('TEST-USR-ED-ZARA', 'USR-ED-ZARA', 'CAA', $2, $1, $2, ARRAY['executiveDirector'], $1),
				('TEST-USR-ADMIN-ADA', 'USR-ADMIN-ADA', 'CAA', $2, $1, $2, ARRAY['admin'], $1),
				('TEST-USR-AUDITEE-FLY', 'USR-AUDITEE-FLY', 'ORG-FLY-NAMIBIA', $2, $1, $2, ARRAY['auditee'], $1)
		`, now, now.Add(8*time.Hour), CanonicalInspectorSubjectID); err != nil {
			return fmt.Errorf("seed canonical sessions: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO inspections (
				id, organization_id, assigned_inspector_subject_id, title, inspection_type, status,
				due_date, revision, created_at, updated_at
			) VALUES
				('AUD-2026-001', 'ORG-FLY-NAMIBIA', $2,
				 '2026 Cabin Inspection - Fly Namibia', 'CABIN', 'IN_PROGRESS', '2026-07-15', 1, $1, $1),
				('AUD-2026-099', 'ORG-SKYCARGO', 'USR-INSPECTOR-DAVID',
				 '2026 Cargo Inspection - SkyCargo Air', 'CARGO', 'IN_PROGRESS', '2026-07-30', 1, $1, $1)
		`, now, CanonicalInspectorSubjectID); err != nil {
			return fmt.Errorf("seed canonical Audits: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO surveillance_plan_items (
				id, title, plan_year, organization_id, inspection_type, scheduled_date,
				estimated_budget, status, current_owner_role, next_action, revision, created_at, updated_at
			) VALUES (
				'PLAN-2026-CAB-001', '2026 Cabin Surveillance — Fly Namibia', 2026,
				'ORG-FLY-NAMIBIA', 'CABIN', '2026-07-15', 48000,
				'FINANCE_REVIEW', 'finance', 'Finance to review budget', 1, $1, $1
			)
		`, now); err != nil {
			return fmt.Errorf("seed canonical surveillance plan: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO reminder_rules (id, label, offset_days, channel, status, revision, created_at, updated_at) VALUES
				('REM-30', '30 days before Due Date', 30, 'IN_APP', 'ACTIVE', 1, $1, $1),
				('REM-15', '15 days before Due Date', 15, 'IN_APP', 'ACTIVE', 1, $1, $1),
				('REM-7', '7 days before Due Date', 7, 'IN_APP', 'ACTIVE', 1, $1, $1),
				('REM-DUE', 'On the Due Date', 0, 'IN_APP', 'ACTIVE', 1, $1, $1),
				('REM-OVERDUE', 'After the Due Date', -1, 'IN_APP', 'ACTIVE', 1, $1, $1)
		`, now); err != nil {
			return fmt.Errorf("seed canonical reminder rules: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO checklist_template_versions (id, template_id, version, title, snapshot, published_at)
			VALUES ('CTV-CABIN-1', 'CABIN', 1, 'Cabin Inspection checklist', $1, $2)
		`, snapshot, now); err != nil {
			return fmt.Errorf("seed canonical checklist template: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO inspection_packages (
				id, inspection_id, checklist_template_version_id, package_version, snapshot,
				expires_at, created_at, package_digest
			) VALUES ('PKG-CAB-2026-001', 'AUD-2026-001', 'CTV-CABIN-1', 1, $1, $2, $3,
				'sha256:candidate-cabin-package-v1')
		`, snapshot, now.Add(72*time.Hour), now); err != nil {
			return fmt.Errorf("seed canonical inspection package: %w", err)
		}
		for _, question := range questions {
			if _, err := transaction.Exec(ctx, `
				INSERT INTO inspection_question_assignments (inspection_id, question_id, subject_id, assignment_revision)
				VALUES ('AUD-2026-001', $1, $2, 1)
			`, question.ID, question.Assigned[0]); err != nil {
				return fmt.Errorf("seed assignment %s: %w", question.ID, err)
			}
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO inspection_checklists (inspection_id, status, revision)
			VALUES ('AUD-2026-001', 'IN_PROGRESS', 1)
		`); err != nil {
			return fmt.Errorf("seed canonical checklist: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO findings (
				id, reference, inspection_id, organization_id, severity, status, owner_subject_id,
				next_action, due_date, revision, cap_required, evidence_required, issued_at, created_at, updated_at
			) VALUES ('FND-SKYCARGO-2026-099', 'CAR-2026-099', 'AUD-2026-099', 'ORG-SKYCARGO',
				'LEVEL_2_MAJOR', 'OPEN', NULL, 'SkyCargo Air to submit CAP', '2026-07-30', 1,
				true, true, $1, $1, $1)
		`, now); err != nil {
			return fmt.Errorf("seed isolation Finding: %w", err)
		}
		reportSnapshot, _ := json.Marshal(map[string]any{
			"findingIds": []string{"FND-CAB-2026-001"}, "contentHash": "sha256:candidate-report-v1",
		})
		if _, err := transaction.Exec(ctx, `
			INSERT INTO report_versions (id, report_id, inspection_id, version, status, snapshot, created_at)
			VALUES ('RPT-CAB-2026-001-V1', 'RPT-CAB-2026-001', 'AUD-2026-001', 1,
				'EXECUTIVE_DIRECTOR_REVIEW', $1, $2)
		`, reportSnapshot, now); err != nil {
			return fmt.Errorf("seed canonical report version: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO report_approval_states (report_version_id, status, revision, updated_at)
			VALUES ('RPT-CAB-2026-001-V1', 'EXECUTIVE_DIRECTOR_REVIEW', 1, $1)
		`, now); err != nil {
			return fmt.Errorf("seed canonical report approval: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO offline_grants (
				id, subject_id, device_id, package_id, inspection_id, assignment_revision, granted_at,
				expires_at, session_id, package_version, package_digest, allowed_command_types,
				assignment_scope, protocol_version
			) VALUES ('GRANT-CANDIDATE-001', $3, 'DEVICE-CANDIDATE-001',
				'PKG-CAB-2026-001', 'AUD-2026-001', 1, $1, $2, 'TEST-CANONICAL-INSPECTOR', 1,
				'sha256:candidate-cabin-package-v1', ARRAY['UPSERT_CHECKLIST_RESPONSE','CREATE_POTENTIAL_FINDING',
				'SUBMIT_CHECKLIST','REGISTER_INSPECTION_ATTACHMENT'],
				'{"questionIds":["CAB-LAV-001","CAB-PAX-SEAT-001","CAB-EMEQ-PBE-001","CAB-VID-CREW-SEAT-001","CAB-COCKPIT-GEN-001"]}', 1)
		`, now, now.Add(24*time.Hour), CanonicalInspectorSubjectID); err != nil {
			return fmt.Errorf("seed canonical OfflineGrant: %w", err)
		}
		return nil
	})
}

func Principal(subjectID string) (identity.Principal, bool) {
	principals := map[string]identity.Principal{
		CanonicalInspectorSubjectID: {SubjectID: CanonicalInspectorSubjectID, DisplayName: "Local Inspector", OrganizationID: "CAA", SessionID: "TEST-CANONICAL-INSPECTOR", Roles: []identity.Role{identity.RoleInspector}},
		"USR-INSPECTOR-DAVID":       {SubjectID: "USR-INSPECTOR-DAVID", DisplayName: "David Inspector", OrganizationID: "CAA", SessionID: "TEST-USR-INSPECTOR-DAVID", Roles: []identity.Role{identity.RoleInspector}},
		"USR-LEAD-CANER":            {SubjectID: "USR-LEAD-CANER", DisplayName: "Caner Lead Inspector", OrganizationID: "CAA", SessionID: "TEST-USR-LEAD-CANER", Roles: []identity.Role{identity.RoleLeadInspector}},
		"USR-MANAGER-NORA":          {SubjectID: "USR-MANAGER-NORA", DisplayName: "Nora Department Manager", OrganizationID: "CAA", SessionID: "TEST-USR-MANAGER-NORA", Roles: []identity.Role{identity.RoleDepartmentManager}},
		"USR-FINANCE-LINA":          {SubjectID: "USR-FINANCE-LINA", DisplayName: "Lina Finance Reviewer", OrganizationID: "CAA", SessionID: "TEST-USR-FINANCE-LINA", Roles: []identity.Role{identity.RoleFinance}},
		"USR-GM-OMAR":               {SubjectID: "USR-GM-OMAR", DisplayName: "Omar General Manager", OrganizationID: "CAA", SessionID: "TEST-USR-GM-OMAR", Roles: []identity.Role{identity.RoleGeneralManager}},
		"USR-ED-ZARA":               {SubjectID: "USR-ED-ZARA", DisplayName: "Zara Executive Director", OrganizationID: "CAA", SessionID: "TEST-USR-ED-ZARA", Roles: []identity.Role{identity.RoleExecutiveDirector}},
		"USR-ADMIN-ADA":             {SubjectID: "USR-ADMIN-ADA", DisplayName: "Ada Administrator", OrganizationID: "CAA", SessionID: "TEST-USR-ADMIN-ADA", Roles: []identity.Role{identity.RoleAdmin}},
		"USR-AUDITEE-FLY":           {SubjectID: "USR-AUDITEE-FLY", DisplayName: "Fly Namibia Auditee", OrganizationID: "ORG-FLY-NAMIBIA", SessionID: "TEST-USR-AUDITEE-FLY", Roles: []identity.Role{identity.RoleAuditee}},
	}
	principal, ok := principals[subjectID]
	return principal, ok
}
