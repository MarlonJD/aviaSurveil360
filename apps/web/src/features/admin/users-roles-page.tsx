import { useState } from "react";

import type { Role } from "../../backend/backend";
import { AdminError, AdminPage, DisabledAdminAction, useAdminLoad, useAdminWorkspace } from "./admin-workspace-shared";

export function UsersRolesPage() {
  const backend = useAdminWorkspace();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const { data, error } = useAdminLoad(() => backend.listAccessDirectory({ search, role }), [backend, search, role]);
  return (
    <AdminPage testId="admin-users-roles-page" routeLabel="Users / Roles" title="Users / Roles" description="Typed demo access directory. Production identity and account administration remain outside Task 10.">
      <section className="admin-filter-bar" aria-label="User directory filters"><label>Search<input aria-label="Search users" onChange={(event) => setSearch(event.target.value)} value={search} /></label><label>Role<select aria-label="User role" onChange={(event) => setRole(event.target.value)} value={role}><option value="">All roles</option>{(["inspector", "leadInspector", "manager", "gm", "finance", "executiveDirector", "auditee", "admin"] satisfies Role[]).map((value) => <option key={value} value={value}>{value}</option>)}</select></label></section>
      <AdminError message={error} />
      <div className="admin-card-register admin-dense-register" role="list" aria-label="Demo access directory">
        {data?.items.map((entry) => { const reason = `${entry.subjectId} account provisioning and role changes are production-only and require Plan 3 Keycloak administration.`; return <article className="admin-record-card" key={entry.subjectId} role="listitem"><header><div><b>{entry.displayName}</b><small>{entry.subjectId}</small></div><span>{entry.role}</span></header><dl><div><dt>Organization scope</dt><dd>{entry.organizationId ?? "CAA internal"}</dd></div><div><dt>Email</dt><dd>{entry.email}</dd></div><div><dt>MFA</dt><dd>{entry.mfa}</dd></div><div><dt>Invitation</dt><dd>{entry.invitation}</dd></div><div><dt>Account status</dt><dd>{entry.accountStatus}</dd></div></dl><div className="admin-inline-actions"><DisabledAdminAction label={`Invite ${entry.subjectId}`} reason={reason} /><DisabledAdminAction label={`Change role ${entry.subjectId}`} reason={reason} /><DisabledAdminAction label={`Manage MFA ${entry.subjectId}`} reason={reason} /><DisabledAdminAction label={`Deactivate ${entry.subjectId}`} reason={reason} /></div></article>; })}
      </div>
      <DisabledAdminAction label="Create user" reason="User creation is production-only and requires Plan 3 Keycloak administration." />
    </AdminPage>
  );
}
