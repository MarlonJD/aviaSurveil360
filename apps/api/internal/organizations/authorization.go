package organizations

import "github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"

func CanView(principal identity.Principal, organizationID string) bool {
	if principal.HasRole(identity.RoleAuditee) {
		return principal.BelongsTo(organizationID)
	}
	return principal.IsCAA()
}
