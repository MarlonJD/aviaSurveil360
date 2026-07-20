import { useState } from "react";
import { Link } from "react-router-dom";

import type { FindingSeverity } from "../../backend/backend";
import { useScenario } from "../../app/scenario-context";
import {
  CommandError,
  errorMessage,
  FindingFacts,
  PageHeader,
  StatusPill,
  WorkspaceShell,
} from "../shared/workspace-shell";

export function LeadReviewPage() {
  const { projection, actions } = useScenario();
  const [severity, setSeverity] = useState<FindingSeverity>("LEVEL_1_CRITICAL");
  const [capRequired, setCapRequired] = useState(true);
  const [evidenceRequired, setEvidenceRequired] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function convert(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await actions.convertPotentialFinding({
        severity,
        capRequired,
        evidenceRequired,
        dueDate: "2026-07-15",
      });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceShell roleLabel="Lead Inspector" routeLabel="Lead Review">
      <PageHeader
        eyebrow="Submitted checklist decision"
        title="Lead Review"
        description="A Potential Finding remains distinct until an authorized Lead Inspector decision."
      />
      <CommandError message={error} />
      {projection.potentialFinding ? (
        <article className="surface-card detail-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">Potential Finding</p>
              <h2>{projection.potentialFinding.id}</h2>
            </div>
            <StatusPill>{projection.potentialFinding.status}</StatusPill>
          </div>
          <p>{projection.potentialFinding.title}</p>
          {!projection.finding ? (
            <div className="form-grid">
              <label>
                Finding severity
                <select
                  value={severity}
                  onChange={(event) => setSeverity(event.target.value as FindingSeverity)}
                >
                  <option value="LEVEL_1_CRITICAL">Level 1 Critical</option>
                  <option value="LEVEL_2_MAJOR">Level 2 Major</option>
                  <option value="LEVEL_3_MINOR">Level 3 Minor</option>
                  <option value="OBSERVATION">Observation</option>
                </select>
              </label>
              <label className="check-control">
                <input
                  checked={capRequired}
                  onChange={(event) => setCapRequired(event.target.checked)}
                  type="checkbox"
                />
                CAP required
              </label>
              <label className="check-control">
                <input
                  checked={evidenceRequired}
                  onChange={(event) => setEvidenceRequired(event.target.checked)}
                  type="checkbox"
                />
                Evidence required
              </label>
              <button className="primary-button" disabled={busy} onClick={() => void convert()} type="button">
                Convert to Finding
              </button>
            </div>
          ) : (
            <>
              <div className="decision-result">
                <span>Canonical Finding</span>
                <strong data-testid="finding-number">{projection.finding.findingNumber}</strong>
                <span data-testid="finding-status">{projection.finding.status}</span>
              </div>
              <FindingFacts finding={projection.finding} />
              <Link className="primary-link" to="/lead-inspector/findings/FND-CAB-2026-001">
                Open Finding dossier
              </Link>
            </>
          )}
        </article>
      ) : (
        <article className="surface-card empty-state">
          <h2>No submitted Potential Finding in this session</h2>
          <p>Start the canonical Cabin checklist as CAA Inspector.</p>
          <Link className="primary-link" to="/inspector/inspector-assignments">Open Inspector assignments</Link>
        </article>
      )}
    </WorkspaceShell>
  );
}
