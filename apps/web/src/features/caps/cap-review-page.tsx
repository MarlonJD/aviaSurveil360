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

export function CapReviewPage() {
  const { projection, actions } = useScenario();
  const [commentToAuditee, setCommentToAuditee] = useState("");
  const [internalCaaNote, setInternalCaaNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void actions.refreshFinding("leadInspector").catch((cause) => setError(errorMessage(cause)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function accept(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await actions.reviewCap({
        decision: "ACCEPT",
        commentToAuditee,
        internalCaaNote,
      });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspaceShell roleLabel="Lead Inspector" routeLabel="CAP Review">
      <PageHeader
        eyebrow="CAA decision"
        title="CAP Review"
        description="CAP acceptance is separate from Auditee submission and never closes the Finding."
      />
      <CommandError message={error} />
      {projection.finding ? (
        <article className="surface-card detail-card">
          <FindingFacts finding={projection.finding} />
          <div className="form-grid form-grid--two review-fields">
            <label>
              Comment to Auditee
              <textarea rows={4} value={commentToAuditee} onChange={(event) => setCommentToAuditee(event.target.value)} />
            </label>
            <label>
              Internal CAA Note
              <textarea rows={4} value={internalCaaNote} onChange={(event) => setInternalCaaNote(event.target.value)} />
            </label>
          </div>
          {!projection.capReview ? (
            <button className="primary-button" disabled={busy} onClick={() => void accept()} type="button">
              Accept CAP
            </button>
          ) : (
            <div className="decision-result">
              <strong data-testid="finding-status">{projection.finding.status}</strong>
              <span data-testid="closure-state">Finding remains open</span>
            </div>
          )}
          {projection.capReview ? (
            <Link className="primary-link" to="/executive-director/executive-dashboard">
              Check report authority
            </Link>
          ) : null}
        </article>
      ) : <p>Finding unavailable.</p>}
    </WorkspaceShell>
  );
}
