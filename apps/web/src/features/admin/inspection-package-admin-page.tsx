import { AdminError, AdminPage, DisabledAdminAction, useAdminLoad, useAdminWorkspace } from "./admin-workspace-shared";

export function InspectionPackageAdminPage() {
  const backend = useAdminWorkspace();
  const { data, error } = useAdminLoad(() => backend.getInspectionPackage({ packageId: "PKG-CAB-2026-001" }), [backend]);
  return (
    <AdminPage testId="admin-inspection-package-page" routeLabel="Admin Inspection Package Builder" title="Inspection Package Builder" description="Admin configuration preview of exact canonical package PKG-CAB-2026-001; this is not Inspector execution.">
      <AdminError message={error} />
      {data ? <><section className="admin-template-identity" aria-label="Inspection package identity"><div><span>Package</span><b>{data.id}</b></div><div><span>Audit</span><b>{data.auditId}</b></div><div><span>Organization</span><b>{data.organizationId} · {data.organizationName}</b></div></section><div className="admin-package-grid"><section className="admin-record-card"><h2>Exact questions</h2><ol>{data.questionIds.map((id) => <li key={id}>{id}</li>)}</ol></section><section className="admin-record-card"><h2>Configured references</h2><ul>{data.configuredReferences.map((value) => <li key={value}>{value}</li>)}</ul></section><section className="admin-record-card"><h2>Expected Evidence</h2><ul>{data.expectedEvidence.map((value) => <li key={value}>{value}</li>)}</ul></section><section className="admin-record-card"><h2>Risk focus</h2><ul>{data.riskFocus.map((value) => <li key={value}>{value} — indicator only</li>)}</ul></section></div><DisabledAdminAction label={`Run ${data.id}`} reason={`${data.id} / ${data.auditId} is an Admin configuration preview, not Inspector execution; cross-role checklist navigation is unavailable.`} /></> : null}
    </AdminPage>
  );
}
