package integration_test

import (
	"context"
	"testing"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/application"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/reports"
)

func TestReportApprovalUsesExactVersionAndIssueNeverClosesFinding(t *testing.T) {
	pool := canonicalDatabase(t, "report_approval")
	seedFinding(t, pool, "finding-report", "OPS-2026-010", "airline-xyz")
	if _, err := pool.Exec(context.Background(), `
		INSERT INTO report_versions (id, report_id, inspection_id, version, status, snapshot)
		VALUES ('report-version-001', 'report-001', 'audit-cabin-001', 1, 'DRAFT', '{"findingIds":["finding-report"],"contentHash":"hash-001"}');
		INSERT INTO report_approval_states (report_version_id, status, revision)
		VALUES ('report-version-001', 'DEPARTMENT_REVIEW', 1)
	`); err != nil {
		t.Fatalf("seed report: %v", err)
	}
	service := testService(pool)

	dmResult, err := service.DecideReport(context.Background(), principal("manager-001", "caa", "session-manager", identity.RoleDepartmentManager), application.DecideReportCommand{
		OperationID: "op-report-dm", CorrelationID: "corr-report", ReportVersionID: "report-version-001", ExpectedRevision: 1, Decision: reports.DecisionForward,
	})
	if err != nil || dmResult.Status != reports.StatusGeneralManagerReview || dmResult.Revision != 2 {
		t.Fatalf("DM report result = %+v, err = %v", dmResult, err)
	}
	gmResult, err := service.DecideReport(context.Background(), principal("gm-001", "caa", "session-gm", identity.RoleGeneralManager), application.DecideReportCommand{
		OperationID: "op-report-gm", CorrelationID: "corr-report", ReportVersionID: "report-version-001", ExpectedRevision: 2, Decision: reports.DecisionForward,
	})
	if err != nil || gmResult.Status != reports.StatusExecutiveDirectorReview || gmResult.Revision != 3 {
		t.Fatalf("GM report result = %+v, err = %v", gmResult, err)
	}
	edResult, err := service.DecideReport(context.Background(), principal("executive-001", "caa", "session-executive", identity.RoleExecutiveDirector), application.DecideReportCommand{
		OperationID: "op-report-ed", CorrelationID: "corr-report", ReportVersionID: "report-version-001", ExpectedRevision: 3, Decision: reports.DecisionIssue,
	})
	if err != nil || edResult.Status != reports.StatusLocked || edResult.Revision != 4 {
		t.Fatalf("ED report result = %+v, err = %v", edResult, err)
	}

	var findingStatus string
	if err := pool.QueryRow(context.Background(), "SELECT status FROM findings WHERE id = 'finding-report'").Scan(&findingStatus); err != nil {
		t.Fatalf("read Finding after report issue: %v", err)
	}
	if findingStatus == "CLOSED" {
		t.Fatal("report issue closed Finding")
	}
	var reportSnapshot string
	if err := pool.QueryRow(context.Background(), "SELECT snapshot::text FROM report_versions WHERE id = 'report-version-001'").Scan(&reportSnapshot); err != nil || reportSnapshot == "" {
		t.Fatalf("immutable report snapshot = %q, err = %v", reportSnapshot, err)
	}
}
