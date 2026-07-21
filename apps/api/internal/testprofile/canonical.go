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
	CanonicalAuditID   = "AUD-2026-001"
	CanonicalPackageID = "PKG-CAB-2026-001"
	CanonicalFindingID = "FND-CAB-2026-001"
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
	Assigned            []string `json:"assignedInspectorUserIds"`
}

func Reset(ctx context.Context, pool *database.Pool, now time.Time) error {
	if pool == nil || now.IsZero() {
		return errors.New("canonical test reset requires database and server time")
	}
	now = now.UTC()
	questions := []canonicalQuestion{
		{ID: "CAB-GALLEY-001", SectionID: "GALLEY", Prompt: "Are galley restraints and stowage areas serviceable and secure?", RegulatoryReference: "Configured Cabin Inspection reference — GALLEY", ExpectedEvidence: "Inspector observation and required exception comment", Assigned: []string{"USR-INSPECTOR-DAVID"}},
		{ID: "CAB-LAV-001", SectionID: "LAV", Prompt: "Are lavatory safety equipment and placards present and serviceable?", RegulatoryReference: "Configured Cabin Inspection reference — LAV", ExpectedEvidence: "Inspector observation and required exception comment", Assigned: []string{"USR-INSPECTOR-AMINA"}},
		{ID: "CAB-PAX-SEAT-001", SectionID: "PAX SEAT", Prompt: "Are passenger seats, belts, and adjacent fittings serviceable?", RegulatoryReference: "Configured Cabin Inspection reference — PAX SEAT", ExpectedEvidence: "Inspector observation and required exception comment", Assigned: []string{"USR-INSPECTOR-AMINA"}},
		{ID: "CAB-EMEQ-PBE-001", SectionID: "EM EQ / PBE", Prompt: "Is the PBE installed, serviceable, accessible, and in compliance with configured cabin emergency equipment requirements?", RegulatoryReference: "Configured Cabin Inspection reference — EM EQ / PBE", ExpectedEvidence: "PBE serviceability record and cabin position confirmation", Assigned: []string{"USR-INSPECTOR-AMINA"}},
		{ID: "CAB-VID-CREW-SEAT-001", SectionID: "VID+CREW SEAT", Prompt: "Are cabin information displays and crew seats serviceable?", RegulatoryReference: "Configured Cabin Inspection reference — VID+CREW SEAT", ExpectedEvidence: "Inspector observation and required exception comment", Assigned: []string{"USR-INSPECTOR-AMINA"}},
		{ID: "CAB-COCKPIT-GEN-001", SectionID: "COCKPIT+CAB GEN COND+EXITS", Prompt: "Are cabin general condition and emergency exits satisfactory?", RegulatoryReference: "Configured Cabin Inspection reference — COCKPIT+CAB GEN COND+EXITS", ExpectedEvidence: "Inspector observation and required exception comment", Assigned: []string{"USR-INSPECTOR-AMINA"}},
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
				oidc_login_states, idempotency_responses, authorized_sync_changes, sync_cursors,
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
				('USR-INSPECTOR-AMINA', 'urn:avia:test', 'Amina Inspector', $1),
				('USR-INSPECTOR-DAVID', 'urn:avia:test', 'David Inspector', $1),
				('USR-LEAD-CANER', 'urn:avia:test', 'Caner Lead Inspector', $1),
				('USR-MANAGER-NORA', 'urn:avia:test', 'Nora Department Manager', $1),
				('USR-GM-OMAR', 'urn:avia:test', 'Omar General Manager', $1),
				('USR-ED-ZARA', 'urn:avia:test', 'Zara Executive Director', $1),
				('USR-AUDITEE-FLY', 'urn:avia:test', 'Fly Namibia Auditee', $1)
		`, now); err != nil {
			return fmt.Errorf("seed canonical identities: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO session_references (
				id, subject_id, organization_id, expires_at, last_seen_at, absolute_expires_at, roles, created_at
			) VALUES
				('TEST-USR-INSPECTOR-AMINA', 'USR-INSPECTOR-AMINA', 'CAA', $2, $1, $2, ARRAY['inspector'], $1),
				('TEST-USR-INSPECTOR-DAVID', 'USR-INSPECTOR-DAVID', 'CAA', $2, $1, $2, ARRAY['inspector'], $1),
				('TEST-USR-LEAD-CANER', 'USR-LEAD-CANER', 'CAA', $2, $1, $2, ARRAY['leadInspector'], $1),
				('TEST-USR-MANAGER-NORA', 'USR-MANAGER-NORA', 'CAA', $2, $1, $2, ARRAY['manager'], $1),
				('TEST-USR-GM-OMAR', 'USR-GM-OMAR', 'CAA', $2, $1, $2, ARRAY['gm'], $1),
				('TEST-USR-ED-ZARA', 'USR-ED-ZARA', 'CAA', $2, $1, $2, ARRAY['executiveDirector'], $1),
				('TEST-USR-AUDITEE-FLY', 'USR-AUDITEE-FLY', 'ORG-FLY-NAMIBIA', $2, $1, $2, ARRAY['auditee'], $1)
		`, now, now.Add(8*time.Hour)); err != nil {
			return fmt.Errorf("seed canonical sessions: %w", err)
		}
		if _, err := transaction.Exec(ctx, `
			INSERT INTO inspections (
				id, organization_id, assigned_inspector_subject_id, title, inspection_type, status,
				due_date, revision, created_at, updated_at
			) VALUES
				('AUD-2026-001', 'ORG-FLY-NAMIBIA', 'USR-INSPECTOR-AMINA',
				 '2026 Cabin Inspection - Fly Namibia', 'CABIN', 'IN_PROGRESS', '2026-07-15', 1, $1, $1),
				('AUD-2026-099', 'ORG-SKYCARGO', 'USR-INSPECTOR-DAVID',
				 '2026 Cargo Inspection - SkyCargo Air', 'CARGO', 'IN_PROGRESS', '2026-07-30', 1, $1, $1)
		`, now); err != nil {
			return fmt.Errorf("seed canonical Audits: %w", err)
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
			) VALUES ('GRANT-CANDIDATE-001', 'USR-INSPECTOR-AMINA', 'DEVICE-CANDIDATE-001',
				'PKG-CAB-2026-001', 'AUD-2026-001', 1, $1, $2, 'TEST-USR-INSPECTOR-AMINA', 1,
				'sha256:candidate-cabin-package-v1', ARRAY['UPSERT_CHECKLIST_RESPONSE','CREATE_POTENTIAL_FINDING',
				'SUBMIT_CHECKLIST','REGISTER_INSPECTION_ATTACHMENT'],
				'{"questionIds":["CAB-LAV-001","CAB-PAX-SEAT-001","CAB-EMEQ-PBE-001","CAB-VID-CREW-SEAT-001","CAB-COCKPIT-GEN-001"]}', 1)
		`, now, now.Add(24*time.Hour)); err != nil {
			return fmt.Errorf("seed canonical OfflineGrant: %w", err)
		}
		return nil
	})
}

func Principal(subjectID string) (identity.Principal, bool) {
	principals := map[string]identity.Principal{
		"USR-INSPECTOR-AMINA": {SubjectID: "USR-INSPECTOR-AMINA", OrganizationID: "CAA", SessionID: "TEST-USR-INSPECTOR-AMINA", Roles: []identity.Role{identity.RoleInspector}},
		"USR-INSPECTOR-DAVID": {SubjectID: "USR-INSPECTOR-DAVID", OrganizationID: "CAA", SessionID: "TEST-USR-INSPECTOR-DAVID", Roles: []identity.Role{identity.RoleInspector}},
		"USR-LEAD-CANER":      {SubjectID: "USR-LEAD-CANER", OrganizationID: "CAA", SessionID: "TEST-USR-LEAD-CANER", Roles: []identity.Role{identity.RoleLeadInspector}},
		"USR-MANAGER-NORA":    {SubjectID: "USR-MANAGER-NORA", OrganizationID: "CAA", SessionID: "TEST-USR-MANAGER-NORA", Roles: []identity.Role{identity.RoleDepartmentManager}},
		"USR-GM-OMAR":         {SubjectID: "USR-GM-OMAR", OrganizationID: "CAA", SessionID: "TEST-USR-GM-OMAR", Roles: []identity.Role{identity.RoleGeneralManager}},
		"USR-ED-ZARA":         {SubjectID: "USR-ED-ZARA", OrganizationID: "CAA", SessionID: "TEST-USR-ED-ZARA", Roles: []identity.Role{identity.RoleExecutiveDirector}},
		"USR-AUDITEE-FLY":     {SubjectID: "USR-AUDITEE-FLY", OrganizationID: "ORG-FLY-NAMIBIA", SessionID: "TEST-USR-AUDITEE-FLY", Roles: []identity.Role{identity.RoleAuditee}},
	}
	principal, ok := principals[subjectID]
	return principal, ok
}
