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
  const [item, setItem] = useState<PlanningItemView | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void backend.planning.list({ limit: 20 }).then((output) => setItem(output.items[0] ?? null)).catch((cause) => setError(errorMessage(cause)));
  }, [backend]);
  return (
    <WorkspaceShell roleLabel="Department Manager" routeLabel="Audit Plan Calendar">
      <PageHeader
        eyebrow="Surveillance planning"
        title="Audit Plan Calendar"
        description="Review scheduled oversight work and its exact approval owner; this calendar does not bypass Finance, GM, or Executive Director authority."
      />
      <CommandError message={error} />
      {item ? (
        <article className="surface-card detail-card">
          <div className="card-heading"><h2>{item.title}</h2><StatusPill>{item.status}</StatusPill></div>
          <PlanningFacts item={item} />
        </article>
      ) : null}
    </WorkspaceShell>
  );
}
