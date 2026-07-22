import { useEffect, useMemo, useState } from "react";

import { useBackendForRole } from "../../app/providers";
import type { FindingView, OrganizationSummary, PlanningItemView } from "../../backend/backend";
import { CommandError, errorMessage, WorkspaceShell } from "../shared/workspace-shell";

interface DepartmentRow {
  name: string;
  organizations: OrganizationSummary[];
  plans: PlanningItemView[];
  findings: FindingView[];
}

export function DepartmentComparisonPage() {
  const backend = useBackendForRole("gm");
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [plans, setPlans] = useState<PlanningItemView[]>([]);
  const [findings, setFindings] = useState<FindingView[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      backend.organizations.list({ limit: 100 }),
      backend.planning.list({ limit: 100 }),
      backend.findings.list({ limit: 100 }),
    ]).then(([organizationOutput, planningOutput, findingOutput]) => {
      setOrganizations(organizationOutput.items);
      setPlans(planningOutput.items);
      setFindings(findingOutput.items);
    }).catch((cause) => setError(errorMessage(cause)));
  }, [backend]);

  const rows = useMemo<DepartmentRow[]>(() => [
    { name: "Cabin Safety", organizations, plans, findings },
    { name: "Airworthiness", organizations: [], plans: [], findings: [] },
    { name: "Certification", organizations: [], plans: [], findings: [] },
    { name: "Licensing", organizations: [], plans: [], findings: [] },
    { name: "Ramp", organizations: [], plans: [], findings: [] },
    { name: "Security", organizations: [], plans: [], findings: [] },
  ], [findings, organizations, plans]);

  return <WorkspaceShell roleLabel="General Manager" routeLabel="Departments">
    <div className="executive-workspace-page gm-departments-page" data-testid="gm-departments-page">
      <header className="authority-page-head workbench-page-header"><h1>Departments</h1><p>Compare audit activity, Findings, risk exposure, and overdue CAP attention across departments.</p></header>
      <CommandError message={error} />
      <section className="executive-panel" aria-label="Department comparison workspace">
        <header><div><span>Cross-department oversight</span><h2>Department Overview</h2></div></header>
        <div className="responsive-table-shell"><table aria-label="Department comparison"><thead><tr><th>Department</th><th>Organizations</th><th>Audits</th><th>Active</th><th>Findings</th><th>Overdue</th><th>Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.name}><td><b>{row.name}</b></td><td>{row.organizations.map((organization) => organization.legalName).join(", ") || "No current records"}</td><td>{row.plans.length}</td><td>{row.plans.filter((plan) => plan.status !== "RELEASED").length}</td><td>{row.findings.length}</td><td>{row.findings.filter((finding) => finding.dueState === "OVERDUE").length}</td><td><button aria-label={`Open ${row.name} department summary`} onClick={() => setSelected(row.name)} type="button">Open summary</button></td></tr>)}</tbody></table></div>
      </section>
      {selected ? <section aria-label={`${selected} department summary`} className="executive-panel gm-department-summary"><h2>{selected}</h2><p>Selected department summary is derived from the current mock Organization, Planning, and Finding projections.</p><button onClick={() => setSelected(null)} type="button">Close {selected} summary</button></section> : null}
      <p className="gm-authority-note"><b>Authority boundary:</b> This comparison does not expose Department Manager team assignment, checklist editing, CAP approval, or Finding closure controls.</p>
    </div>
  </WorkspaceShell>;
}
