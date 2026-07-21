package identity_test

import (
	"testing"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
)

func TestPrincipalRoleAndOrganizationChecksUseAuthenticatedClaims(t *testing.T) {
	t.Parallel()
	principal := identity.Principal{
		SubjectID:      "inspector-001",
		OrganizationID: "caa",
		Roles:          []identity.Role{identity.RoleInspector, identity.RoleLeadInspector},
	}
	if !principal.HasRole(identity.RoleLeadInspector) {
		t.Fatal("lead role not recognized")
	}
	if principal.HasRole(identity.RoleAuditee) {
		t.Fatal("unassigned Auditee role recognized")
	}
	if !principal.BelongsTo("caa") || principal.BelongsTo("airline-xyz") {
		t.Fatal("organization scope ignored")
	}
}
