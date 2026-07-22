import { useState } from "react";

import { AdminError, AdminGuardrails, AdminPage, useAdminLoad, useAdminWorkspace } from "./admin-workspace-shared";

export function RegulatoryLibraryPage() {
  const backend = useAdminWorkspace();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data, error } = useAdminLoad(() => backend.listRegulatoryReferences({ search, status }), [backend, search, status]);
  return (
    <AdminPage testId="admin-regulatory-library-page" routeLabel="Regulatory Library" title="Regulatory Library" description="NAMCARS Library and Regulatory Cross-Reference share this read-only configured-reference surface.">
      <AdminGuardrails />
      <section className="admin-filter-bar" aria-label="Regulatory Library filters">
        <label>Search<input aria-label="Search regulatory references" onChange={(event) => setSearch(event.target.value)} value={search} /></label>
        <label>Status<select aria-label="Regulatory status" onChange={(event) => setStatus(event.target.value)} value={status}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="SUPERSEDED">Superseded</option></select></label>
      </section>
      <AdminError message={error} />
      <div className="admin-card-register" role="list" aria-label="Configured regulatory references">
        {data?.items.map((reference) => (
          <article className="admin-record-card" key={reference.id} role="listitem">
            <header><div><b>{reference.title}</b><small>{reference.id}</small></div><span>{reference.status}</span></header>
            <dl><div><dt>Version</dt><dd>{reference.version}</dd></div><div><dt>Effective date</dt><dd>{reference.effectiveDate}</dd></div></dl>
            <h2>Configured rules</h2><ul>{reference.configuredRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
            <h2>Change history</h2><ul>{reference.changeHistory.map((change) => <li key={change}>{change}</li>)}</ul>
            <p>Configured reference only; it is not legal advice or a legal decision.</p>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
