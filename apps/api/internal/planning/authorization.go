package planning

import "github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"

func CanEditBudget(principal identity.Principal) bool {
	return principal.HasRole(identity.RoleFinance)
}

func CanApproveOperationalScope(principal identity.Principal) bool {
	return principal.HasRole(identity.RoleDepartmentManager, identity.RoleGeneralManager, identity.RoleExecutiveDirector)
}

func CanIntermediateApprove(principal identity.Principal) bool {
	return principal.HasRole(identity.RoleGeneralManager)
}

func CanIssueReport(principal identity.Principal) bool {
	return principal.HasRole(identity.RoleExecutiveDirector)
}
