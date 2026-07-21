package integration_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/application"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/platform/database"
	"github.com/MarlonJD/aviaSurveil360/apps/api/migrations"
)

var canonicalNow = time.Date(2026, time.July, 21, 12, 0, 0, 0, time.UTC)

func canonicalDatabase(t *testing.T, label string) *database.Pool {
	t.Helper()
	pool := createTestDatabase(t, label)
	if err := migrations.Apply(context.Background(), pool); err != nil {
		t.Fatalf("apply migrations: %v", err)
	}
	type seedStatement struct {
		sql  string
		args []any
	}
	statements := []seedStatement{
		{sql: `INSERT INTO organizations (id, legal_name, organization_type, status) VALUES
			('caa', 'Civil Aviation Authority', 'AUTHORITY', 'ACTIVE'),
			('airline-xyz', 'Airline XYZ', 'OPERATOR', 'ACTIVE'),
			('airline-other', 'Other Airline', 'OPERATOR', 'ACTIVE')`},
		{sql: `INSERT INTO identity_references (subject_id, issuer, display_name) VALUES
			('inspector-cabin-001', 'test', 'Cabin Inspector'),
			('inspector-other', 'test', 'Other Inspector'),
			('lead-001', 'test', 'Lead Inspector'),
			('auditee-xyz', 'test', 'Airline XYZ Auditee'),
			('auditee-other', 'test', 'Other Airline Auditee'),
			('manager-001', 'test', 'Department Manager'),
			('gm-001', 'test', 'General Manager'),
			('executive-001', 'test', 'Executive Director')`},
		{sql: `INSERT INTO session_references (id, subject_id, organization_id, expires_at, last_seen_at, absolute_expires_at, roles) VALUES
			('session-inspector', 'inspector-cabin-001', 'caa', $1, $2, $1, ARRAY['inspector']),
			('session-lead', 'lead-001', 'caa', $1, $2, $1, ARRAY['leadInspector']),
			('session-auditee', 'auditee-xyz', 'airline-xyz', $1, $2, $1, ARRAY['auditee']),
			('session-manager', 'manager-001', 'caa', $1, $2, $1, ARRAY['manager']),
			('session-gm', 'gm-001', 'caa', $1, $2, $1, ARRAY['gm']),
			('session-executive', 'executive-001', 'caa', $1, $2, $1, ARRAY['executiveDirector'])`, args: []any{canonicalNow.Add(24 * time.Hour), canonicalNow}},
		{sql: `INSERT INTO inspections (id, organization_id, assigned_inspector_subject_id, title, inspection_type, status, due_date, revision)
		 VALUES ('audit-cabin-001', 'airline-xyz', 'inspector-cabin-001', 'Cabin Safety Inspection', 'CABIN', 'IN_PROGRESS', '2026-08-01', 1)`},
		{sql: `INSERT INTO checklist_template_versions (id, template_id, version, title, snapshot, published_at)
		 VALUES ('template-cabin-v1', 'template-cabin', 1, 'Cabin Checklist', '{"questionIds":["q-cabin-crew-training"]}', $1)`, args: []any{canonicalNow}},
		{sql: `INSERT INTO inspection_packages (id, inspection_id, checklist_template_version_id, package_version, snapshot, expires_at, package_digest)
		 VALUES ('package-cabin-001', 'audit-cabin-001', 'template-cabin-v1', 1, '{"questionIds":["q-cabin-crew-training"]}', $1, 'sha256:package-cabin-001')`, args: []any{canonicalNow.Add(72 * time.Hour)}},
		{sql: `INSERT INTO inspection_question_assignments (inspection_id, question_id, subject_id, assignment_revision)
		 VALUES ('audit-cabin-001', 'q-cabin-crew-training', 'inspector-cabin-001', 1)`},
		{sql: `INSERT INTO inspection_checklists (inspection_id, status, revision) VALUES ('audit-cabin-001', 'IN_PROGRESS', 1)`},
		{sql: `INSERT INTO checklist_responses (id, inspection_id, package_id, question_id, assigned_inspector_subject_id, response_value, comment_to_auditee, internal_caa_note, revision)
		 VALUES ('response-cabin-001', 'audit-cabin-001', 'package-cabin-001', 'q-cabin-crew-training', 'inspector-cabin-001', 'NON_COMPLIANT', 'Training record gap.', 'Internal workload note.', 1)`},
		{sql: `INSERT INTO potential_findings (
			id, inspection_id, checklist_response_id, organization_id, status, finding_basis, expected_evidence,
			comment_to_auditee, internal_caa_note, revision, question_id, title, description, created_by_subject_id
		) VALUES (
			'potential-cabin-001', 'audit-cabin-001', 'response-cabin-001', 'airline-xyz', 'PENDING_LEAD_REVIEW',
			'Crew training records incomplete.', 'Updated training records.', 'Provide corrective records.',
			'Internal CAA Note: monitor repeat pattern.', 1, 'q-cabin-crew-training', 'Crew training record gap',
			'Crew training records incomplete.', 'inspector-cabin-001'
		)`},
	}
	for _, statement := range statements {
		if _, err := pool.Exec(context.Background(), statement.sql, statement.args...); err != nil {
			t.Fatalf("seed canonical database: %v\n%s", err, statement.sql)
		}
	}
	return pool
}

func testService(pool *database.Pool) *application.Service {
	counters := map[string]int{}
	return application.NewService(pool, application.Dependencies{
		Clock: func() time.Time { return canonicalNow },
		IDGenerator: func(prefix string) string {
			counters[prefix]++
			return fmt.Sprintf("%s-test-%03d", prefix, counters[prefix])
		},
	})
}

func principal(subject, organization, sessionID string, roles ...identity.Role) identity.Principal {
	return identity.Principal{SubjectID: subject, OrganizationID: organization, SessionID: sessionID, Roles: roles}
}

func seedFinding(t *testing.T, pool *database.Pool, id, reference, organization string) {
	t.Helper()
	if _, err := pool.Exec(context.Background(), `
		INSERT INTO findings (id, reference, inspection_id, organization_id, severity, status, owner_subject_id, next_action, due_date, revision)
		VALUES ($1, $2, 'audit-cabin-001', $3, 'LEVEL_2_MAJOR', 'WAITING_FOR_CAP', 'auditee-xyz', 'Submit CAP', '2026-08-15', 1)
	`, id, reference, organization); err != nil {
		t.Fatalf("seed Finding: %v", err)
	}
}
