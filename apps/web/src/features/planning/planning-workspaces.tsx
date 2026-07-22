import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useBackendForRole } from "../../app/providers";
import type {
  PlanningDecision,
  PlanningItemView,
  Role,
} from "../../backend/backend";
import {
  CommandError,
  errorMessage,
  formatLocalDate,
  PageHeader,
  StatusPill,
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

function PlanningFacts({ item }: { item: PlanningItemView }) {
  return (
    <dl className="fact-grid">
      <div><dt>Planning item</dt><dd>{item.id}</dd></div>
      <div><dt>Status</dt><dd data-testid="planning-status">{item.status}</dd></div>
      <div><dt>Current owner</dt><dd data-testid="planning-owner">{roleLabels[item.currentOwnerRole]}</dd></div>
      <div><dt>Organization</dt><dd>{item.organizationName}</dd></div>
      <div><dt>Inspection type</dt><dd>{item.inspectionType}</dd></div>
      <div><dt>Scheduled Date</dt><dd>{item.scheduledDate}</dd></div>
      <div><dt>Estimated budget</dt><dd>{new Intl.NumberFormat("en", { style: "currency", currency: "NAD", maximumFractionDigits: 0 }).format(item.estimatedBudget)}</dd></div>
      <div><dt>Next action</dt><dd>{item.nextAction}</dd></div>
    </dl>
  );
}

function decisionFor(role: Role, item: PlanningItemView): {
  decision: PlanningDecision;
  label: string;
} | null {
  if (role === "finance" && item.status === "FINANCE_REVIEW") {
    return { decision: "APPROVE_BUDGET", label: "Approve Budget" };
  }
  if (role === "gm" && item.status === "GM_REVIEW") {
    return { decision: "FORWARD_FOR_FINAL_APPROVAL", label: "Forward for Final Approval" };
  }
  if (role === "executiveDirector" && item.status === "EXECUTIVE_DIRECTOR_REVIEW") {
    return { decision: "APPROVE_PLAN", label: "Approve Plan" };
  }
  if (role === "gm" && item.status === "GM_RELEASE") {
    return { decision: "RELEASE_PLAN", label: "Release Plan" };
  }
  return null;
}

export function PlanningDecisionPanel({ role }: { role: "finance" | "gm" | "executiveDirector" }) {
  const backend = useBackendForRole(role);
  const [item, setItem] = useState<PlanningItemView | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void backend.planning
      .list({ limit: 20 })
      .then((output) => setItem(output.items[0] ?? null))
      .catch((cause) => setError(errorMessage(cause)));
  }, [backend]);

  async function decide(decision: PlanningDecision): Promise<void> {
    if (!item) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await backend.planning.decide({
        operationId: `ROUTE-${role}-${item.id}-${decision}-${item.revision}`,
        planningItemId: item.id,
        expectedPlanningRevision: item.revision,
        decision,
        reason,
      });
      setItem(updated);
      setReason("");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const primaryDecision = item ? decisionFor(role, item) : null;
  const canReturn = Boolean(
    item &&
      ((role === "finance" && item.status === "FINANCE_REVIEW") ||
        (role === "gm" && ["GM_REVIEW", "GM_RELEASE"].includes(item.status)) ||
        (role === "executiveDirector" && item.status === "EXECUTIVE_DIRECTOR_REVIEW")),
  );
  const reasonLabel =
    role === "finance"
      ? "Finance decision reason"
      : role === "gm"
        ? "General Manager decision reason"
        : "Plan decision reason";

  return (
    <article className="surface-card detail-card" aria-label="Surveillance plan decision">
      <div className="card-heading">
        <div><p className="eyebrow">Annual surveillance plan</p><h2>{item?.title ?? "Loading planning item…"}</h2></div>
        {item ? <StatusPill>{item.status}</StatusPill> : null}
      </div>
      <CommandError message={error} />
      {item ? <PlanningFacts item={item} /> : null}
      {primaryDecision || canReturn ? (
        <div className="planning-decision">
          <label>
            {reasonLabel}
            <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
          </label>
          <div className="button-row">
            {primaryDecision ? (
              <button className="primary-button" disabled={busy} onClick={() => void decide(primaryDecision.decision)} type="button">
                {primaryDecision.label}
              </button>
            ) : null}
            {canReturn ? (
              <button className="secondary-button" disabled={busy} onClick={() => void decide("RETURN_FOR_REVISION")} type="button">
                Return for Revision
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {role === "finance" && item?.status === "GM_REVIEW" ? (
        <Link className="primary-link" to="/general-manager/gm-dashboard">Switch to General Manager</Link>
      ) : null}
      {role === "gm" && item?.status === "EXECUTIVE_DIRECTOR_REVIEW" ? (
        <Link className="primary-link" to="/executive-director/executive-dashboard">Switch to Executive Director</Link>
      ) : null}
      {role === "executiveDirector" && item?.status === "GM_RELEASE" ? (
        <Link className="primary-link" to="/general-manager/gm-dashboard">Return to General Manager</Link>
      ) : null}
    </article>
  );
}

export function FinanceReviewPage() {
  return (
    <WorkspaceShell roleLabel="Finance Review" routeLabel="Finance Review">
      <PageHeader
        eyebrow="Budget authority"
        title="Finance Review"
        description="Approve the budget gate or return the exact surveillance planning item with a recorded reason."
      />
      <PlanningDecisionPanel role="finance" />
    </WorkspaceShell>
  );
}

export function GeneralManagerDashboardPage() {
  return (
    <WorkspaceShell roleLabel="General Manager" routeLabel="GM Dashboard">
      <PageHeader
        eyebrow="Intermediate plan authority"
        title="General Manager Dashboard"
        description="Forward an eligible plan for final approval, then explicitly release the approved item to department preparation."
      />
      <PlanningDecisionPanel role="gm" />
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
