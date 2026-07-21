package planning_test

import (
	"testing"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/planning"
)

func TestPlanningAuthorizationKeepsIntermediateRolesNarrow(t *testing.T) {
	t.Parallel()
	finance := identity.Principal{Roles: []identity.Role{identity.RoleFinance}}
	gm := identity.Principal{Roles: []identity.Role{identity.RoleGeneralManager}}
	executive := identity.Principal{Roles: []identity.Role{identity.RoleExecutiveDirector}}

	if !planning.CanEditBudget(finance) || planning.CanApproveOperationalScope(finance) {
		t.Fatal("Finance authority is not budget-only")
	}
	if !planning.CanIntermediateApprove(gm) || planning.CanIssueReport(gm) {
		t.Fatal("General Manager authority escaped the intermediate stage")
	}
	if !planning.CanIssueReport(executive) {
		t.Fatal("Executive Director cannot issue")
	}
}
