import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useScenario } from "../../app/scenario-context";
import {
  CommandError,
  errorMessage,
  FindingFacts,
  PageHeader,
  WorkspaceShell,
} from "../shared/workspace-shell";
import { PlanningDecisionPanel } from "../planning/planning-workspaces";

export function ExecutiveDashboardPage() {
  const { projection, actions } = useScenario();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([
      actions.loadReport("executiveDirector"),
      projection.finding ? actions.refreshFinding("executiveDirector") : Promise.resolve(),
    ]).catch((cause) => setError(errorMessage(cause)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function issue(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await actions.issueReport(reason);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceShell roleLabel="Executive Director" routeLabel="Executive Dashboard">
      <PageHeader
        eyebrow="Report authority"
        title="Executive Director Dashboard"
        description="Issue and lock the exact report version without changing Finding closure state."
      />
      <CommandError message={error} />
      <PlanningDecisionPanel role="executiveDirector" />
      <article className="surface-card detail-card">
        <div className="card-heading">
          <div><p className="eyebrow">RPT-CAB-2026-001-V1</p><h2>Cabin Inspection report decision</h2></div>
          <span className="status-pill" data-testid="report-status">{projection.report?.status ?? "EXECUTIVE_DIRECTOR_REVIEW"}</span>
        </div>
        {projection.finding ? <FindingFacts finding={projection.finding} /> : null}
        <label>
          Report decision reason
          <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        {projection.report?.status !== "LOCKED" ? (
          <button className="primary-button" disabled={busy} onClick={() => void issue()} type="button">
            Issue and lock report
          </button>
        ) : (
          <div className="decision-result">
            <strong data-testid="report-finding-status">{projection.finding?.status}</strong>
            <span>Report issue did not close the Finding</span>
          </div>
        )}
        {projection.report?.status === "LOCKED" ? (
          <Link className="primary-link" to="/department-manager/dashboard">
            Open Department Manager dashboard
          </Link>
        ) : null}
      </article>
    </WorkspaceShell>
  );
}
