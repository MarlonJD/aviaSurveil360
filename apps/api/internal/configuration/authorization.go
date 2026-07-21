package configuration

import "github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"

func CanPreview(principal identity.Principal) bool {
	return principal.HasRole(identity.RoleAdmin)
}
