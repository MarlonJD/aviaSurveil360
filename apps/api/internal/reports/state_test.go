package reports_test

import (
	"testing"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/reports"
)

func TestReportApprovalBindsExactVersionAndRoleStage(t *testing.T) {
	t.Parallel()
	dm := identity.Principal{Roles: []identity.Role{identity.RoleDepartmentManager}}
	gm := identity.Principal{Roles: []identity.Role{identity.RoleGeneralManager}}
	ed := identity.Principal{Roles: []identity.Role{identity.RoleExecutiveDirector}}

	department, err := reports.Decide(reports.DecideInput{Actor: dm, Status: reports.StatusDepartmentReview, Version: 2, ExpectedVersion: 2, Decision: reports.DecisionForward})
	if err != nil || department.Status != reports.StatusGeneralManagerReview {
		t.Fatalf("department forward = %+v, err = %v", department, err)
	}
	general, err := reports.Decide(reports.DecideInput{Actor: gm, Status: department.Status, Version: 2, ExpectedVersion: 2, Decision: reports.DecisionForward})
	if err != nil || general.Status != reports.StatusExecutiveDirectorReview {
		t.Fatalf("GM forward = %+v, err = %v", general, err)
	}
	issued, err := reports.Decide(reports.DecideInput{Actor: ed, Status: general.Status, Version: 2, ExpectedVersion: 2, Decision: reports.DecisionIssue})
	if err != nil || issued.Status != reports.StatusLocked {
		t.Fatalf("ED issue = %+v, err = %v", issued, err)
	}
	if _, err := reports.Decide(reports.DecideInput{Actor: gm, Status: general.Status, Version: 2, ExpectedVersion: 1, Decision: reports.DecisionIssue}); err == nil {
		t.Fatal("stale/unauthorized report issue accepted")
	}
}

func TestDepartmentAndGeneralManagerCanReturnOnlyAtTheirStages(t *testing.T) {
	t.Parallel()
	for _, test := range []struct {
		actor  identity.Principal
		status reports.Status
	}{
		{actor: identity.Principal{Roles: []identity.Role{identity.RoleDepartmentManager}}, status: reports.StatusDepartmentReview},
		{actor: identity.Principal{Roles: []identity.Role{identity.RoleGeneralManager}}, status: reports.StatusGeneralManagerReview},
	} {
		result, err := reports.Decide(reports.DecideInput{Actor: test.actor, Status: test.status, Version: 1, ExpectedVersion: 1, Decision: reports.DecisionReturn, Reason: "Revision required."})
		if err != nil || result.Status != reports.StatusReturned {
			t.Errorf("return from %s = %+v, err = %v", test.status, result, err)
		}
	}
}
