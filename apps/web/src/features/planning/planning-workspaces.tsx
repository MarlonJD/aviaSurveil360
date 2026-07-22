import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useApplicationRuntime, useBackendForRole } from "../../app/providers";
import { RoleHandoff } from "../../auth/role-handoff";
import { useOptionalSession } from "../../auth/session-provider";
import type {
  FindingView,
  ManagerDashboardProjection,
  OrganizationSummary,
  PlanningDecision,
  PlanningItemView,
  ReportVersionView,
  Role,
} from "../../backend/backend";
import { createRoleEntryPath } from "../../ui/role-select-page";
import {
  CommandError,
  errorMessage,
  formatLocalDate,
  WorkspaceShell,
} from "../shared/workspace-shell";

const roleLabels: Record<Role, string> = {
  inspector: "CAA Inspector",
  leadInspector: "Lead Inspector",
  manager: "Department Manager",
  finance: "Finance Review",
  gm: "General Manager",
  executiveDirector: "Executive Director",
  auditee: "Auditee",
  admin: "Admin Preview",
};

function money(value: number): string {
  return new Intl.NumberFormat("en", { style: "currency", currency: "NAD", maximumFractionDigits: 0 }).format(value);
}

function planningStatusLabel(status: PlanningItemView["status"]): string {
  return status === "FINANCE_REVIEW" ? "Pending Finance Review" : status.replaceAll("_", " ");
}

function useRoleContinuation() {
  const runtime = useApplicationRuntime();
  const session = useOptionalSession();
  const navigate = useNavigate();
  return {
    identityMode: session?.identityMode ?? runtime.identityMode ?? (runtime.buildProfile === "http" ? "oidc-session" : "demo-role-switch"),
    session: session?.state ?? { status: "unauthenticated" as const },
    request(role: Role) {
      session?.setActiveRole(role);
      navigate(createRoleEntryPath(role));
    },
  };
}

function ApprovalRail({ currentRole }: { currentRole: Role }) {
  const stages: [Role, string][] = [["manager", "Department Manager"], ["finance", "Finance Review"], ["gm", "GM Review"], ["executiveDirector", "Executive Director Approval"]];
  const current = stages.findIndex(([role]) => role === currentRole);
  return <ol aria-label="Finance approval flow" className="authority-approval-rail">{stages.map(([role, label], index) => <li className={index < current ? "done" : index === current ? "current" : ""} key={role}><span>{index < current ? "✓" : index + 1}</span><b>{label}</b></li>)}</ol>;
}

export function FinanceReviewPage() {
  const backend = useBackendForRole("finance");
  const handoff = useRoleContinuation();
  const [items, setItems] = useState<PlanningItemView[]>([]);
  const [selected, setSelected] = useState<PlanningItemView | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("pending");
  const [tab, setTab] = useState("summary");
  const [choice, setChoice] = useState<PlanningDecision | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void backend.planning.list({ limit: 20 }).then((output) => {
      setItems(output.items);
      setSelected(output.items[0] ?? null);
    }).catch((cause) => setError(errorMessage(cause)));
  }, [backend]);

  const visible = useMemo(() => items.filter((item) => {
    const statusMatch = status === "all" || (status === "pending" && item.status === "FINANCE_REVIEW") || (status === "approved" && item.status !== "FINANCE_REVIEW") || (status === "returned" && item.status === "RETURNED");
    return statusMatch && (!query.trim() || [item.id, item.title, item.organizationName, item.inspectionType].join(" ").toLowerCase().includes(query.toLowerCase()));
  }), [items, query, status]);

  async function decide(): Promise<void> {
    if (!selected || !choice) return;
    if (!reason.trim()) { setError("Finance decision reason is required."); return; }
    setBusy(true); setError(null);
    try {
      const updated = await backend.planning.decide({ operationId: `FINANCE-${choice}-${selected.id}-${selected.revision}`, planningItemId: selected.id, expectedPlanningRevision: selected.revision, decision: choice, reason });
      setSelected(updated); setItems((current) => current.map((item) => item.id === updated.id ? updated : item)); setChoice(null); setReason("");
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }

  return (
    <WorkspaceShell roleLabel="Finance Review" routeLabel="Finance Review">
      <div className="authority-workspace finance-review-page">
        <header className="authority-page-head workbench-page-header"><h1>Finance Review</h1><p>Approve the requested budget for General Manager review or return it to Department Manager for revision.</p></header>
        <CommandError message={error} />
        <div className="authority-guardrails"><span>Budget approval before GM Review</span><span>No plan signature or release</span><span>Frontend-only demo</span></div>
        <section aria-label="Finance review summary" className="finance-summary-strip">
          <article><span>Pending Finance Review</span><b>{items.filter((item) => item.status === "FINANCE_REVIEW").length}</b></article>
          <article><span>Total Requested Budget</span><b>{money(items.reduce((sum, item) => sum + item.estimatedBudget, 0))}</b></article>
          <article><span>Approval path</span><b>Department Manager → Finance Review → GM Review → Executive Director</b></article>
        </section>
        <div className="finance-filter-row"><label>Search<input aria-label="Search plans" onChange={(event) => setQuery(event.target.value)} placeholder="Plan, department, organization" value={query} /></label><label>Status<select aria-label="Finance status" onChange={(event) => setStatus(event.target.value)} value={status}><option value="pending">Pending</option><option value="approved">Approved</option><option value="returned">Returned</option><option value="all">All</option></select></label></div>
        <div className="finance-review-layout"><div className="finance-review-main">
          <section className="finance-review-queue"><h2>Review Queue</h2><div className="authority-table-scroll"><table aria-label="Finance Review Queue"><thead><tr><th>Plan</th><th>Department</th><th>Requested</th><th>Current Owner</th><th>Status</th><th>Action</th></tr></thead><tbody>{visible.map((item) => <tr className={selected?.id === item.id ? "is-selected" : ""} key={item.id}><td><b>{item.id}</b><small>{item.title}</small></td><td>Cabin Safety</td><td>{money(item.estimatedBudget)}</td><td>{roleLabels[item.currentOwnerRole]}</td><td><span className={`authority-badge${item.status === "FINANCE_REVIEW" ? " is-warn" : ""}`}>{planningStatusLabel(item.status)}</span></td><td><button onClick={() => setSelected(item)} type="button">Review</button></td></tr>)}</tbody></table></div></section>
          {selected ? <section className="finance-review-detail"><div className="finance-review-title"><div><span>Selected Plan</span><h2>{selected.title}</h2><p>{selected.id} · {selected.organizationName}</p></div><span className={`authority-badge${selected.status === "FINANCE_REVIEW" ? " is-warn" : ""}`}>{planningStatusLabel(selected.status)}</span></div><div className="finance-review-tabs" role="tablist" aria-label="Finance dossier sections">{[["summary", "Budget Summary"], ["breakdown", "Budget Breakdown"], ["documents", "Supporting Documents"], ["history", "Comments & History"]].map(([id, label]) => <button aria-selected={tab === id} className={tab === id ? "is-active" : ""} key={id} onClick={() => setTab(id)} role="tab" type="button">{label}</button>)}</div><div className="finance-review-panel" role="tabpanel">{tab === "summary" ? <><h2>Budget Summary</h2><div className="finance-summary-grid"><div><span>Requested Budget</span><b>{money(selected.estimatedBudget)}</b></div><div><span>Available for Plan</span><b>Not in contract</b></div><div><span>Remaining Annual Budget</span><b>Not in contract</b></div><div><span>Budget Reconciliation</span><b>{money(selected.estimatedBudget)}</b></div></div><h3>Resource justification</h3><p>{selected.nextAction}</p><div className="authority-callout"><b>Finance boundary:</b> Finance reviews budget and resource justification only.</div></> : <><h2>{tab === "breakdown" ? "Budget Breakdown" : tab === "documents" ? "Supporting Documents" : "Comments & History"}</h2><p>This detail is not represented by the current Backend contract.</p></>}</div></section> : null}
        </div><aside className="finance-review-side">{selected ? <><section className="finance-review-rail"><h2>Approval Flow</h2><ApprovalRail currentRole={selected.currentOwnerRole} /></section><section className="finance-review-decision"><div><span>Current owner</span><b data-testid="planning-owner">{roleLabels[selected.currentOwnerRole]}</b><small>{selected.nextAction}</small><i data-testid="planning-status">{selected.status}</i><em><span>Target {formatLocalDate(selected.scheduledDate)}</span><span>Revision {selected.revision}</span></em></div>{selected.status === "FINANCE_REVIEW" ? <><div className="finance-decision-buttons"><button disabled={busy} onClick={() => setChoice("APPROVE_BUDGET")} type="button">Approve Budget</button><button disabled={busy} onClick={() => setChoice("RETURN_FOR_REVISION")} type="button">Return for Revision</button></div>{choice ? <div className="finance-decision-form"><h3>{choice === "APPROVE_BUDGET" ? "Approve Budget" : "Return for Revision"}</h3><label>Finance decision reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} /></label><button disabled={busy} onClick={() => void decide()} type="button">Confirm Finance Decision</button></div> : null}</> : null}{selected.status === "GM_REVIEW" ? <RoleHandoff identityMode={handoff.identityMode} session={handoff.session} targetRole="gm" onRoleRequest={handoff.request}>Continue as General Manager</RoleHandoff> : null}</section></> : null}</aside></div>
      </div>
    </WorkspaceShell>
  );
}

export function GeneralManagerDashboardPage() {
  const backend = useBackendForRole("gm");
  const handoff = useRoleContinuation();
  const [dashboard, setDashboard] = useState<ManagerDashboardProjection | null>(null);
  const [findings, setFindings] = useState<FindingView[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [plans, setPlans] = useState<PlanningItemView[]>([]);
  const [report, setReport] = useState<ReportVersionView | null>(null);
  const [choice, setChoice] = useState<PlanningDecision | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void Promise.all([backend.dashboards.getManagerProjection({}), backend.findings.list({ limit: 50 }), backend.organizations.list({ limit: 100 }), backend.planning.list({ limit: 20 }), backend.reports.getVersion({ reportVersionId: "RPT-CAB-2026-001-V1" })]).then(([nextDashboard, nextFindings, nextOrganizations, nextPlans, nextReport]) => { setDashboard(nextDashboard); setFindings(nextFindings.items); setOrganizations(nextOrganizations.items); setPlans(nextPlans.items); setReport(nextReport); }).catch((cause) => setError(errorMessage(cause)));
  }, [backend]);
  const plan = plans[0] ?? null;
  async function decide(): Promise<void> {
    if (!plan || !choice) return;
    if (!reason.trim()) { setError("General Manager decision reason is required."); return; }
    setBusy(true); setError(null);
    try { const updated = await backend.planning.decide({ operationId: `GM-${choice}-${plan.id}-${plan.revision}`, planningItemId: plan.id, expectedPlanningRevision: plan.revision, decision: choice, reason }); setPlans([updated]); setChoice(null); setReason(""); } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }
  const departments = ["Cabin Safety", "Security", "Airworthiness", "Ramp", "Unassigned", "Certification", "Licensing"];
  const highRisk = findings.filter((finding) => ["LEVEL_1_CRITICAL", "LEVEL_2_MAJOR"].includes(finding.severity)).length;
  const kpis = [["Pending Preliminary Reports", 0], ["Pending Final Reports", report?.status === "GM_REVIEW" ? 1 : 0], ["High Risk Findings", highRisk], ["Reports Awaiting Your Approval", report?.status === "GM_REVIEW" ? 1 : 0], ["Overdue CAPs", dashboard?.overdueFindings ?? 0]] as const;
  return (
    <WorkspaceShell roleLabel="General Manager" routeLabel="GM Dashboard">
      <div className="authority-workspace gm-dashboard-page"><header className="authority-page-head workbench-page-header"><h1>General Manager Dashboard</h1><p>Review intermediate Preliminary and Final Report decisions, department exposure, high-risk findings, and overdue CAPs.</p><span className="candidate-boundary">Due</span></header><CommandError message={error} />
        <section aria-label="General Manager indicators" className="gm-kpis">{kpis.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
        <div className="gm-dashboard-grid"><section className="gm-panel"><header><span>Cross-department oversight</span><h2>Department Overview</h2></header><div className="gm-table"><table aria-label="Department Overview"><thead><tr><th>Department</th><th>Audits</th><th>Active</th><th>Findings</th><th>High</th><th>Medium</th><th>Overdue CAPs</th><th>Exposure</th></tr></thead><tbody>{departments.map((department, index) => <tr key={department}><td><b>{department}</b></td><td>{index === 0 ? plans.length : 0}</td><td>{index === 0 ? plans.filter((item) => item.status !== "RELEASED").length : 0}</td><td>{index === 0 ? findings.length : 0}</td><td>{index === 0 ? highRisk : 0}</td><td>0</td><td>{index === 0 ? dashboard?.overdueFindings ?? 0 : 0}</td><td><span className="gm-exposure-score">{index === 0 ? findings.length + plans.length : 0}</span></td></tr>)}</tbody></table></div><button disabled title="The full Departments route remains in the accepted legacy demo." type="button">View All Departments</button></section>
          <section aria-label="Risk Heat Map" className="gm-panel gm-risk-heat"><header><span>Likelihood × Impact</span><h2>Risk Heat Map</h2></header><div className="gm-risk-matrix">{Array.from({ length: 25 }, (_, index) => { const score = (5 - Math.floor(index / 5)) * ((index % 5) + 1); return <div className={score >= 15 ? "is-critical" : score >= 10 ? "is-high" : score >= 5 ? "is-medium" : "is-low"} key={index}><b>{index === 22 ? highRisk : 0}</b><small>{score}</small></div>; })}</div><div className="gm-risk-axis"><span>Higher likelihood ↑</span><span>Impact →</span></div></section></div>
        <section className="gm-panel gm-dashboard-queue"><header><span>Intermediate review stage</span><h2>Report Review Queue</h2></header><div className="gm-table gm-approval-table"><table aria-label="Report Review Queue"><thead><tr><th>Report</th><th>Type</th><th>Organization</th><th>Status</th><th>Owner</th><th>Decision</th></tr></thead><tbody>{report ? <tr><td><b>{report.reportVersionId}</b><small>{report.auditId}</small></td><td>Final Report</td><td>{organizations[0]?.legalName ?? "Fly Namibia"}</td><td>{report.status}</td><td>{report.status === "GM_REVIEW" ? "General Manager" : "Executive Director"}</td><td><button disabled title="A General Manager report-detail route is not part of this React parity slice." type="button">Open Report</button></td></tr> : null}</tbody></table></div></section>
        <p className="gm-authority-note"><b>Authority boundary:</b> General Manager review may return or forward a Preliminary or Final Report. General Manager cannot issue, sign, lock, or close a Finding.</p>
        {plan && ["GM_REVIEW", "GM_RELEASE", "EXECUTIVE_DIRECTOR_REVIEW", "RELEASED"].includes(plan.status) ? <section aria-label="General Manager planning decision" className="gm-planning-decision"><header><span>Planning authority</span><h2>{plan.title}</h2></header><dl><div><dt>Status</dt><dd data-testid="planning-status">{plan.status}</dd></div><div><dt>Current owner</dt><dd data-testid="planning-owner">{roleLabels[plan.currentOwnerRole]}</dd></div><div><dt>Target</dt><dd>{formatLocalDate(plan.scheduledDate)}</dd></div><div><dt>Revision</dt><dd>Revision {plan.revision}</dd></div></dl>{["GM_REVIEW", "GM_RELEASE"].includes(plan.status) ? <><div className="gm-decision-buttons"><button disabled={busy} onClick={() => setChoice(plan.status === "GM_RELEASE" ? "RELEASE_PLAN" : "FORWARD_FOR_FINAL_APPROVAL")} type="button">{plan.status === "GM_RELEASE" ? "Release Plan" : "Forward to Executive Director"}</button><button disabled={busy} onClick={() => setChoice("RETURN_FOR_REVISION")} type="button">Return for Revision</button></div>{choice ? <div className="gm-decision-form"><label>General Manager decision reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} /></label><button onClick={() => void decide()} type="button">Confirm General Manager Decision</button></div> : null}</> : null}{plan.status === "EXECUTIVE_DIRECTOR_REVIEW" ? <RoleHandoff identityMode={handoff.identityMode} session={handoff.session} targetRole="executiveDirector" onRoleRequest={handoff.request}>Continue as Executive Director</RoleHandoff> : null}</section> : null}
      </div>
    </WorkspaceShell>
  );
}

export function AuditPlanCalendarPage() {
  const backend = useBackendForRole("manager");
  const [items, setItems] = useState<PlanningItemView[]>([]);
  const [selected, setSelected] = useState<PlanningItemView | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void backend.planning.list({ limit: 20 }).then((output) => {
      setItems(output.items);
      setSelected(output.items[0] ?? null);
    }).catch((cause) => setError(errorMessage(cause)));
  }, [backend]);
  return (
    <WorkspaceShell roleLabel="Department Manager" routeLabel="Department Planning">
      <div className="management-workspace planning-workspace">
        <header className="management-page-head workbench-page-header">
          <h1>Department Planning</h1>
          <p>Track planning approvals, release acceptance and department preparation in one panel.</p>
        </header>
        <CommandError message={error} />
        <div className="planning-boundaries" aria-label="Planning candidate boundaries">
          <strong>Read-only plan</strong><span>Frontend-only demo</span><span>Mock approval history</span><span>No real authorization service</span>
        </div>
        {selected ? (
          <section className="planning-command-center management-panel" data-testid="planning-command-center">
            <header className="planning-command-center__head">
              <div className="planning-command-center__identity">
                <span className="planning-command-center__eyebrow">Department planning workspace · PLAN-2026-Q3-CABIN</span>
                <h2>Planning command center</h2>
                <h3>Q3 Cabin Inspection Surveillance Plan</h3>
                <p>Focused Q3 cabin inspection plan for emergency equipment serviceability oversight.</p>
              </div>
              <div aria-label="Plan state" className="planning-command-center__state">
                <span className="planning-demo-badge is-warn"><i />Finance Review</span><span className="planning-demo-badge is-warn"><i />Awaiting approval</span><span className="planning-demo-badge is-info"><i />Routine / Announced</span><span className="planning-demo-badge is-info"><i />Advance Notice Required</span>
                <i className="planning-raw-status" data-testid="planning-status">{selected.status}</i>
              </div>
            </header>
            <div className="planning-command-center__facts">
              <div><span>Organization &amp; Department</span><b>{selected.organizationName}</b><small>Cabin Safety</small></div>
              <div><span>Scope &amp; Risk Driver</span><b>Risk based / repeat finding</b><small>Emergency equipment serviceability</small></div>
              <div><span>Budget &amp; Resources</span><b>{new Intl.NumberFormat("en", { style: "currency", currency: "NAD", maximumFractionDigits: 0 }).format(selected.estimatedBudget)}</b><small>Caner Yildiz, Aylin Sezer</small></div>
              <div><span>Target &amp; Readiness</span><b>{formatLocalDate(selected.scheduledDate)}</b><small>Awaiting approval</small></div>
            </div>
            <div aria-label="Current planning action" className="planning-command-center__action" role="status">
              <div><span>Current owner</span><b data-testid="planning-owner">{roleLabels[selected.currentOwnerRole]}</b></div>
              <div><span>Next action</span><b>Review budget: approve or return to Department Manager<i className="planning-raw-status">{selected.nextAction}</i></b></div>
              <div><span>Blocking reason</span><b>{selected.status === "FINANCE_REVIEW" ? "Waiting for Finance Review decision." : "No unresolved blocking reason"}</b></div>
            </div>
            <div className="planning-command-center__path">
              <div className="planning-command-center__path-head"><span>Decision Path</span><small>Department submission through final approval</small></div>
              <ol aria-label="Planning decision path" className="approval-rail">
                {["Department Manager", "Finance Review", "GM Review", "Executive Director Approval"].map((label, index) => (
                  <li className={`approval-step ${index === 1 ? "current" : index === 0 ? "done" : ""}`} key={label}>
                    <span className="approval-step__dot">{index === 0 ? "✓" : index === 1 ? "•" : index + 1}</span><span className="approval-step__label">{label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        <section className="planning-queue management-panel">
          <div className="management-section-head"><div><span>Authorized register</span><h2>Planning Queue</h2></div><strong>{items.length} item</strong></div>
          <div className="management-table-scroll">
            <table aria-label="Planning Queue">
              <thead><tr><th>Planning Item</th><th>Organization</th><th>Type</th><th>Target</th><th>Budget</th><th>Owner</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{items.map((item) => (
                <tr className={selected?.id === item.id ? "is-selected" : ""} key={item.id}>
                  <td><b>{item.id}</b><small>{item.title}</small></td><td>{item.organizationName}</td><td>{item.inspectionType}</td><td>{formatLocalDate(item.scheduledDate)}</td>
                  <td>{new Intl.NumberFormat("en", { style: "currency", currency: "NAD", maximumFractionDigits: 0 }).format(item.estimatedBudget)}</td><td>{roleLabels[item.currentOwnerRole]}</td><td>{item.status}</td>
                  <td><button aria-label={`Open ${item.id}`} onClick={() => setSelected(item)} type="button">Open</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {selected ? <p className="planning-selected-record" data-testid="planning-selected-record">Selected record: <b>{selected.id}</b> · revision {selected.revision}</p> : null}
        </section>
      </div>
    </WorkspaceShell>
  );
}
