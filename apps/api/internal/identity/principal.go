package identity

type Role string

const (
	RoleInspector         Role = "inspector"
	RoleLeadInspector     Role = "leadInspector"
	RoleDepartmentManager Role = "manager"
	RoleGeneralManager    Role = "gm"
	RoleFinance           Role = "finance"
	RoleExecutiveDirector Role = "executiveDirector"
	RoleAuditee           Role = "auditee"
	RoleAdmin             Role = "admin"
)

type Principal struct {
	SubjectID      string
	OrganizationID string
	Roles          []Role
	SessionID      string
}

func (principal Principal) HasRole(expected ...Role) bool {
	for _, actual := range principal.Roles {
		for _, candidate := range expected {
			if actual == candidate {
				return true
			}
		}
	}
	return false
}

func (principal Principal) BelongsTo(organizationID string) bool {
	return principal.OrganizationID != "" && principal.OrganizationID == organizationID
}

func (principal Principal) IsCAA() bool {
	return principal.HasRole(
		RoleInspector,
		RoleLeadInspector,
		RoleDepartmentManager,
		RoleGeneralManager,
		RoleFinance,
		RoleExecutiveDirector,
		RoleAdmin,
	)
}
