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

export function ManagerDashboardPage() {
  const { projection, actions } = useScenario();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void actions.loadManagerDashboard().catch((cause) => setError(errorMessage(cause)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function authorizedClose(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await actions.authorizedClose(reason);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceShell roleLabel="Department Manager" routeLabel="Dashboard">
      <PageHeader
        eyebrow="Management visibility"
        title="Department Manager Dashboard"
        description="See the smallest useful decision set and keep authorized closure separate from Evidence verification."
      />
      <CommandError message={error} />
      <section className="metric-grid" aria-label="Finding metrics">
        <article><span>Open Findings</span><strong>{projection.dashboard?.openFindings ?? 0}</strong></article>
        <article><span>Closed Findings</span><strong data-testid="manager-closed-findings">{projection.dashboard?.closedFindings ?? 0}</strong></article>
        <article><span>Pending CAP Review</span><strong>{projection.dashboard?.pendingCapReviews ?? 0}</strong></article>
        <article><span>Pending Evidence Review</span><strong>{projection.dashboard?.pendingEvidenceReviews ?? 0}</strong></article>
      </section>
      {projection.finding ? (
        <article className="surface-card detail-card">
          <div className="card-heading">
            <div><p className="eyebrow">Canonical Finding</p><h2>{projection.finding.findingNumber}</h2></div>
            <span className="status-pill" data-testid="manager-canonical-status">{projection.finding.status}</span>
          </div>
          <FindingFacts finding={projection.finding} />
          {projection.finding.status !== "CLOSED" ? (
            <div className="authorized-close-panel">
              <label>
                Authorized closure reason
                <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} />
              </label>
              <button className="secondary-button" disabled={busy} onClick={() => void authorizedClose()} type="button">
                Use authorized closure
              </button>
              <p>This distinct manager path records an authorized basis; it is not CAP acceptance or report issue.</p>
            </div>
          ) : null}
          {projection.finding.status === "EVIDENCE_REQUIRED" ? (
            <Link className="primary-link" to="/auditee/service-provider-cap">
              Return to Fly Namibia Evidence
            </Link>
          ) : null}
          {projection.finding.status === "CLOSED" ? (
            <Link className="primary-link" to="/department-manager/reports/RPT-CAB-2026-001-V1">
              Open report preview
            </Link>
          ) : null}
        </article>
      ) : null}
    </WorkspaceShell>
  );
}
