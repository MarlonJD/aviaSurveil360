package integration_test

import (
	"context"
	"testing"
)

func TestPublishedAndSubmittedVersionRowsCannotBeOverwritten(t *testing.T) {
	pool := canonicalDatabase(t, "immutable_versions")
	seedFinding(t, pool, "finding-immutable", "OPS-2026-023", "airline-xyz")
	if _, err := pool.Exec(context.Background(), `
		INSERT INTO cap_revisions (
			id, cap_id, finding_id, organization_id, revision, status, root_cause, corrective_action,
			preventive_action, target_completion_date, submitted_by_subject_id, submitted_at
		) VALUES (
			'cap-version-immutable', 'cap-immutable', 'finding-immutable', 'airline-xyz', 1, 'SUBMITTED',
			'cause', 'correct', 'prevent', '2026-08-15', 'auditee-xyz', now()
		);
		INSERT INTO evidence_versions (
			id, evidence_id, finding_id, organization_id, version, filename, media_type, sha256, size_bytes,
			status, submitted_by_subject_id, submitted_at, revision
		) VALUES (
			'evidence-version-immutable', 'evidence-immutable', 'finding-immutable', 'airline-xyz', 1,
			'evidence.pdf', 'application/pdf', 'sha256:immutable', 100, 'CLEAN', 'auditee-xyz', now(), 1
		);
		INSERT INTO audit_events (
			event_id, occurred_at, actor_subject_id, actor_role, organization_id, action,
			entity_type, entity_id, entity_version, before_status, after_status,
			operation_id, correlation_id, details
		) VALUES (
			'audit-immutable', now(), 'lead-001', 'leadInspector', 'airline-xyz', 'potential_finding.converted',
			'potential_finding', 'potential-cabin-001', 2, 'PENDING_LEAD_REVIEW', 'CONVERTED',
			'op-audit-immutable', 'corr-audit-immutable', '{}'
		)
	`); err != nil {
		t.Fatalf("seed immutable versions: %v", err)
	}
	for name, statement := range map[string]string{
		"checklist template":          "UPDATE checklist_template_versions SET title = 'changed' WHERE id = 'template-cabin-v1'",
		"inspection package snapshot": "UPDATE inspection_packages SET snapshot = '{\"changed\":true}' WHERE id = 'package-cabin-001'",
		"CAP revision":                "UPDATE cap_revisions SET root_cause = 'changed' WHERE id = 'cap-version-immutable'",
		"Evidence version":            "UPDATE evidence_versions SET filename = 'changed.pdf' WHERE id = 'evidence-version-immutable'",
		"audit event":                 "UPDATE audit_events SET action = 'changed' WHERE event_id = 'audit-immutable'",
	} {
		if _, err := pool.Exec(context.Background(), statement); err == nil {
			t.Errorf("%s overwrite succeeded", name)
		}
	}
	if _, err := pool.Exec(context.Background(), "UPDATE inspection_packages SET revoked_at = now() WHERE id = 'package-cabin-001'"); err != nil {
		t.Fatalf("package withdrawal metadata should remain mutable: %v", err)
	}
}
