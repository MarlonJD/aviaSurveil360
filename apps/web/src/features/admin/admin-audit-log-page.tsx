import { useState } from "react";

import { AdminError, AdminPage, useAdminLoad, useAdminWorkspace } from "./admin-workspace-shared";

export function AdminAuditLogPage() {
  const backend = useAdminWorkspace();
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [system, setSystem] = useState("");
  const [dateText, setDateText] = useState("");
  const { data, error } = useAdminLoad(() => backend.listAuditEvents({ actor, action, entity, system, dateText }), [backend, actor, action, entity, system, dateText]);
  return (
    <AdminPage testId="admin-audit-log-page" routeLabel="Audit Log" title="Audit Log" description="Append-only demo trace for local interactions; this is not a production audit trail or legal record.">
      <section className="admin-filter-bar" aria-label="Audit Log filters"><label>Actor<input aria-label="Audit actor" onChange={(event) => setActor(event.target.value)} value={actor} /></label><label>Action<input aria-label="Audit action" onChange={(event) => setAction(event.target.value)} value={action} /></label><label>Entity<input aria-label="Audit entity" onChange={(event) => setEntity(event.target.value)} value={entity} /></label><label>Origin<select aria-label="Audit origin" onChange={(event) => setSystem(event.target.value)} value={system}><option value="">All origins</option><option value="MANUAL">Manual</option><option value="SYSTEM">System</option></select></label><label>Date text<input aria-label="Audit date text" onChange={(event) => setDateText(event.target.value)} placeholder="2026-06-15" value={dateText} /></label></section>
      <AdminError message={error} />
      <div className="admin-card-register admin-dense-register" role="list" aria-label="Append-only demo audit events">
        {data?.items.map((event) => { const origin = !event.actorRole && !event.actorSubjectId ? "SYSTEM" : "MANUAL"; return <article className="admin-record-card" key={event.eventId} role="listitem"><header><div><b>{event.action}</b><small>{event.eventId}</small></div><span>{origin}</span></header><dl><div><dt>Actor</dt><dd>{event.actorSubjectId ?? "SYSTEM"}</dd></div><div><dt>Actor role</dt><dd>{event.actorRole ?? "SYSTEM"}</dd></div><div><dt>Entity</dt><dd>{event.entityType} · {event.entityId}</dd></div><div><dt>Before / after</dt><dd>{event.beforeStatus ?? "None"} → {event.afterStatus ?? "None"}</dd></div><div><dt>Revision</dt><dd>{event.entityRevision ?? "Not applicable"}</dd></div><div><dt>Timestamp</dt><dd>{event.occurredAt}</dd></div></dl><p><strong>Reason:</strong> {event.reason ?? "No reason recorded"}</p></article>; })}
      </div>
    </AdminPage>
  );
}
