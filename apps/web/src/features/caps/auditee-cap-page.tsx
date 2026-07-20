import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useScenario } from "../../app/scenario-context";
import {
  CommandError,
  errorMessage,
  PageHeader,
  WorkspaceShell,
} from "../shared/workspace-shell";
import {
  AuditeeFindingSummary,
  createAuditeeFindingProjection,
} from "./auditee-projection";

interface CapDraft {
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  responsiblePerson: string;
  targetCompletionDate: string;
  commentToCaa: string;
}

const emptyCap: CapDraft = {
  rootCause: "",
  correctiveAction: "",
  preventiveAction: "",
  responsiblePerson: "",
  targetCompletionDate: "",
  commentToCaa: "",
};

export function AuditeeCapPage() {
  const { projection, actions } = useScenario();
  const [cap, setCap] = useState<CapDraft>(emptyCap);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void actions.loadAuditeeFindings().catch((cause) => setError(errorMessage(cause)));
    if (projection.finding) {
      void actions.loadEvidenceVersions("auditee").catch((cause) => setError(errorMessage(cause)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publicFinding = useMemo(
    () => projection.finding ? createAuditeeFindingProjection(projection.finding) : null,
    [projection.finding],
  );
  const canSubmitCap = projection.finding?.status === "WAITING_FOR_CAP";
  const canSubmitEvidence =
    projection.finding?.status === "EVIDENCE_REQUIRED" ||
    projection.finding?.status === "EVIDENCE_MORE_INFORMATION_REQUESTED";

  function updateCap(field: keyof CapDraft, value: string): void {
    setCap((current) => ({ ...current, [field]: value }));
  }

  async function run(command: () => Promise<void>): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await command();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>): void {
    setSelectedFile(event.target.files?.[0] ?? null);
  }

  return (
    <WorkspaceShell roleLabel="Auditee — Fly Namibia" routeLabel="Corrective Actions">
      <PageHeader
        eyebrow="Auditee Portal"
        title="Corrective Actions (CAP)"
        description="Respond only for your organization. CAP acceptance and Finding closure remain CAA decisions."
      />
      <p className="scope-banner" data-testid="auditee-scope">Fly Namibia only</p>
      <CommandError message={error} />
      {publicFinding ? <AuditeeFindingSummary finding={publicFinding} /> : (
        <article className="surface-card empty-state"><p>No Fly Namibia Finding is available.</p></article>
      )}

      {canSubmitCap ? (
        <section className="surface-card form-section">
          <div className="section-heading">
            <div><p className="eyebrow">Auditee submission</p><h2>CAP revision 1</h2></div>
            <span>CAA review follows submission</span>
          </div>
          <div className="form-grid form-grid--two">
            <label className="field-span-2">
              Root cause
              <textarea rows={4} value={cap.rootCause} onChange={(event) => updateCap("rootCause", event.target.value)} />
            </label>
            <label className="field-span-2">
              Corrective action
              <textarea rows={4} value={cap.correctiveAction} onChange={(event) => updateCap("correctiveAction", event.target.value)} />
            </label>
            <label className="field-span-2">
              Preventive action
              <textarea rows={4} value={cap.preventiveAction} onChange={(event) => updateCap("preventiveAction", event.target.value)} />
            </label>
            <label>
              Responsible person
              <input value={cap.responsiblePerson} onChange={(event) => updateCap("responsiblePerson", event.target.value)} />
            </label>
            <label>
              Target completion date
              <input type="date" value={cap.targetCompletionDate} onChange={(event) => updateCap("targetCompletionDate", event.target.value)} />
            </label>
            <label className="field-span-2">
              Comment to CAA
              <textarea rows={3} value={cap.commentToCaa} onChange={(event) => updateCap("commentToCaa", event.target.value)} />
            </label>
          </div>
          <button
            className="primary-button"
            disabled={busy}
            onClick={() => void run(() => actions.submitCap(cap))}
            type="button"
          >
            Submit CAP
          </button>
        </section>
      ) : null}

      {projection.finding?.status === "CAP_SUBMITTED" ? (
        <section className="workflow-footer">
          <div><span>CAP state</span><strong>Submitted for separate CAA review</strong></div>
          <Link className="primary-link" to="/lead-inspector/cap-review/FND-CAB-2026-001">
            Switch to CAA CAP Review
          </Link>
        </section>
      ) : null}

      {(canSubmitEvidence || projection.evidenceVersions.length > 0 || projection.finding?.status === "CLOSED") ? (
        <section className="surface-card form-section">
          <div className="section-heading">
            <div><p className="eyebrow">Immutable history</p><h2>Evidence versions</h2></div>
            <strong data-testid="evidence-version-count">{projection.evidenceVersions.length}</strong>
          </div>
          {projection.evidenceVersions.length ? (
            <ol className="version-list">
              {projection.evidenceVersions.map((version) => (
                <li key={version.id}>
                  <strong>Version {version.version}</strong>
                  <span>{version.fileName}</span>
                  <span>{version.reviewState}</span>
                </li>
              ))}
            </ol>
          ) : <p>No Evidence version submitted yet.</p>}
          {canSubmitEvidence ? (
            <div className="upload-panel">
              <label>
                Mock Evidence file
                <input data-testid="evidence-file" type="file" accept="application/pdf" onChange={chooseFile} />
              </label>
              <span data-testid="selected-evidence-file">{selectedFile?.name ?? "No file selected"}</span>
              <button
                className="primary-button"
                disabled={busy || !selectedFile}
                onClick={() => selectedFile && void run(() => actions.submitEvidence(selectedFile))}
                type="button"
              >
                Submit Evidence version
              </button>
            </div>
          ) : null}
          {projection.finding?.status === "EVIDENCE_SUBMITTED" ? (
            <Link className="primary-link" to="/lead-inspector/evidence-review/FND-CAB-2026-001">
              Switch to Evidence Review
            </Link>
          ) : null}
        </section>
      ) : null}
    </WorkspaceShell>
  );
}
