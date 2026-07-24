package administration

import (
	"errors"

	"github.com/MarlonJD/aviaSurveil360/apps/api/internal/identity"
)

var (
	ErrForbidden = errors.New("administration authority required")
	ErrInvalid   = errors.New("invalid user lifecycle request")
	ErrConflict  = errors.New("user lifecycle conflict")
)

func CanManageUsers(actor identity.Principal) bool {
	return actor.HasRole(identity.RoleAdmin)
}
