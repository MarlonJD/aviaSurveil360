import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useScenario } from "../../app/scenario-context";
import {
  CommandError,
  errorMessage,
  FindingFacts,
  PageHeader,
  WorkspaceShell,
} from "../shared/workspace-shell";

type EvidenceDecision = "CLOSE" | "PARTIALLY_CLOSE" | "NOT_CLOSE" | "REQUEST_MORE_INFORMATION";

export function EvidenceReviewPage() {
  const { projection, actions } = useScenario();
  const [decision, setDecision] = useState<EvidenceDecision>("PARTIALLY_CLOSE");
  const [commentToAuditee, setCommentToAuditee] = useState("");
  const [internalCaaNote, setInternalCaaNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([
      actions.refreshFinding("leadInspector"),
      actions.loadEvidenceVersions("leadInspector"),
    ]).catch((cause) => setError(errorMessage(cause)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latest = useMemo(() => projection.evidenceVersions.at(-1), [projection.evidenceVersions]);

  async function recordReview(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await actions.reviewEvidence({ decision, commentToAuditee, internalCaaNote });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const closed = projection.finding?.status === "CLOSED";

  return (
    <WorkspaceShell roleLabel="Lead Inspector" routeLabel="Evidence Review">
      <PageHeader
        eyebrow="CAA verification"
        title="Evidence Review"
        description="Review the exact latest immutable Evidence version; earlier versions remain visible."
      />
      <CommandError message={error} />
      {projection.finding ? (
        <article className="surface-card detail-card">
          <FindingFacts finding={projection.finding} />
          <div className="section-heading">
            <div><p className="eyebrow">Latest submitted Evidence</p><h2 data-testid="reviewing-evidence-version">{latest ? `Version ${latest.version}` : "No version"}</h2></div>
            <span>{latest?.fileName}</span>
          </div>
          <ol className="version-list">
            {projection.evidenceVersions.map((version) => (
              <li data-testid="evidence-history-row" key={version.id}>
                <strong>Version {version.version}</strong>
                <span>{version.fileName}</span>
                <span>{version.reviewState}</span>
              </li>
            ))}
          </ol>
          {!projection.evidenceReview || latest?.reviewState === "PENDING_CAA_REVIEW" ? (
            <div className="form-grid form-grid--two review-fields">
              <label className="field-span-2">
                Evidence review decision
                <select value={decision} onChange={(event) => setDecision(event.target.value as EvidenceDecision)}>
                  <option value="PARTIALLY_CLOSE">Partially Close</option>
                  <option value="NOT_CLOSE">Not Close</option>
                  <option value="REQUEST_MORE_INFORMATION">Request More Information</option>
                  <option value="CLOSE">Close</option>
                </select>
              </label>
              <label>
                Comment to Auditee
                <textarea rows={4} value={commentToAuditee} onChange={(event) => setCommentToAuditee(event.target.value)} />
              </label>
              <label>
                Internal CAA Note
                <textarea rows={4} value={internalCaaNote} onChange={(event) => setInternalCaaNote(event.target.value)} />
              </label>
              <button className="primary-button field-span-2" disabled={busy || !latest} onClick={() => void recordReview()} type="button">
                Record Evidence review
              </button>
            </div>
          ) : null}
          {projection.evidenceReview ? (
            <div className="decision-result">
              <strong data-testid="finding-status">{projection.finding.status}</strong>
              <span data-testid="closure-state">{closed ? "Finding closed" : "Finding remains open"}</span>
              {closed ? <span data-testid="closure-basis">{projection.finding.closureBasis}</span> : null}
            </div>
          ) : null}
          {projection.evidenceReview ? (
            closed ? (
              <Link className="primary-link" to="/department-manager/dashboard">
                Open updated Manager Dashboard
              </Link>
            ) : (
              <Link className="primary-link" to="/auditee/service-provider-cap">
                Return to Auditee Evidence
              </Link>
            )
          ) : null}
        </article>
      ) : <p>Finding unavailable.</p>}
    </WorkspaceShell>
  );
}
