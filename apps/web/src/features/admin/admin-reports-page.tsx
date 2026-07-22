import { useEffect, useState } from "react";

import type { AdminReportDefinitionView } from "../../backend/backend";
import { AdminError, AdminPage, DisabledAdminAction, useAdminLoad, useAdminWorkspace } from "./admin-workspace-shared";

export function AdminReportsPage() {
  const backend = useAdminWorkspace();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const { data, error } = useAdminLoad(() => backend.listReportDefinitions({ search }), [backend, search]);
  useEffect(() => { if (!data?.items.some((item) => item.id === selectedId)) setSelectedId(data?.items[0]?.id ?? ""); }, [data, selectedId]);
  const selected: AdminReportDefinitionView | null = data?.items.find((item) => item.id === selectedId) ?? null;
  return (
    <AdminPage testId="admin-reports-page" routeLabel="Admin Reports" title="Admin Reports" description="Typed mock report-definition catalog; no real report or PDF engine is connected.">
      <section className="admin-filter-bar" aria-label="Admin report filters"><label>Search<input aria-label="Search report definitions" onChange={(event) => setSearch(event.target.value)} value={search} /></label><label>Selected report<select aria-label="Selected report definition" onChange={(event) => setSelectedId(event.target.value)} value={selectedId}>{data?.items.map((report) => <option key={report.id} value={report.id}>{report.id} — {report.title}</option>)}</select></label></section>
      <AdminError message={error} />
      {selected ? <section className="admin-record-card admin-report-preview" aria-label={`Report definition ${selected.id}`}><header><div><b>{selected.title}</b><small>{selected.id}</small></div><span>Demo catalog</span></header><p>{selected.description}</p><h2>Exact package preview fields</h2><ul>{selected.packageFields.map((field) => <li key={field}>{field}</li>)}</ul><DisabledAdminAction label={`Generate ${selected.id}`} reason={selected.actionReason} /><DisabledAdminAction label={`Download ${selected.id}`} reason={`${selected.id} has no generated browser-local artifact; Task 10 does not provide a real report or PDF engine.`} /><DisabledAdminAction label={`Publish ${selected.id}`} reason={`${selected.id} publishing is unavailable in Admin Preview and no publishing command is declared.`} /></section> : <p>No matching report definition.</p>}
    </AdminPage>
  );
}
