package integration_test

import (
	"context"
	"testing"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/testprofile"
	"github.com/MarlonJD/aviaSurveil360/apps/api/migrations"
)

func TestCanonicalTestProfileResetSeedsExactServerOwnedScope(t *testing.T) {
	pool := createTestDatabase(t, "canonical_http_profile")
	if err := migrations.Apply(context.Background(), pool); err != nil {
		t.Fatalf("apply migrations: %v", err)
	}
	for iteration := 0; iteration < 2; iteration++ {
		if err := testprofile.Reset(context.Background(), pool, canonicalNow); err != nil {
			t.Fatalf("reset canonical profile iteration %d: %v", iteration, err)
		}
		var audits, questions, reports, otherFindings int
		if err := pool.QueryRow(context.Background(), `
			SELECT
				(SELECT count(*) FROM inspections WHERE id = 'AUD-2026-001'),
				(SELECT count(*) FROM inspection_question_assignments WHERE inspection_id = 'AUD-2026-001'),
				(SELECT count(*) FROM report_versions WHERE id = 'RPT-CAB-2026-001-V1'),
				(SELECT count(*) FROM findings WHERE organization_id = 'ORG-SKYCARGO')
		`).Scan(&audits, &questions, &reports, &otherFindings); err != nil {
			t.Fatalf("read canonical profile counts: %v", err)
		}
		if audits != 1 || questions != 6 || reports != 1 || otherFindings != 1 {
			t.Fatalf("canonical counts = audits %d, questions %d, reports %d, other Findings %d", audits, questions, reports, otherFindings)
		}
	}
	principal, ok := testprofile.Principal("USR-AUDITEE-FLY")
	if !ok || principal.OrganizationID != "ORG-FLY-NAMIBIA" || len(principal.Roles) != 1 {
		t.Fatalf("server-owned Auditee principal = %+v, ok = %v", principal, ok)
	}
	if _, ok := testprofile.Principal("attacker-controlled-subject"); ok {
		t.Fatal("unknown test subject was accepted")
	}
}
