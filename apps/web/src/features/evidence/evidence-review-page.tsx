import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useApplicationRuntime } from "../../app/providers";
import type {
  CapRevisionView,
  EvidenceVersionView,
  FindingView,
  ReviewEvidenceOutput,
  Role,
} from "../../backend/backend";
import { RoleHandoff } from "../../auth/role-handoff";
import { useOptionalSession } from "../../auth/session-provider";
import { createRoleEntryPath } from "../../ui/role-select-page";
import { StatusPill, type StatusPillTone } from "../../ui/workbench/status-pill";
import {
  CommandError,
  errorMessage,
  formatLocalDate,
  formatSeverity,
  WorkspaceShell,
} from "../shared/workspace-shell";

type EvidenceDecision = "CLOSE" | "PARTIALLY_CLOSE" | "NOT_CLOSE" | "REQUEST_MORE_INFORMATION";

function statusTone(status: string): StatusPillTone {
  if (status === "CLOSED" || status === "ACCEPTED") return "success";
  if (status.includes("MORE_INFORMATION") || status === "REJECTED") return "warning";
  return "neutral";
}

function submittedDate(instant: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(instant));
}

export function EvidenceReviewPage() {
  const runtime = useApplicationRuntime();
  const leadBackend = useMemo(
    () => runtime.backendForRole?.("leadInspector") ?? runtime.backend,
    [runtime],
  );
  const session = useOptionalSession();
  const navigate = useNavigate();
  const [finding, setFinding] = useState<FindingView | null>(null);
  const [capRevisions, setCapRevisions] = useState<CapRevisionView[]>([]);
  const [evidenceVersions, setEvidenceVersions] = useState<EvidenceVersionView[]>([]);
  const [evidenceReview, setEvidenceReview] = useState<ReviewEvidenceOutput | null>(null);
  const [decision, setDecision] = useState<EvidenceDecision>("PARTIALLY_CLOSE");
  const [commentToAuditee, setCommentToAuditee] = useState("");
  const [internalCaaNote, setInternalCaaNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const latest = useMemo(() => evidenceVersions.at(-1) ?? null, [evidenceVersions]);
  const identityMode =
    session?.identityMode ??
    (runtime.buildProfile === "http" ? "canonical-test-role-switch" : "demo-role-switch");
  const handoffSession = session?.state ?? { status: "unauthenticated" as const };

  async function loadReviewTarget(): Promise<void> {
    const loadedFinding = await leadBackend.findings.get({ findingId: "FND-CAB-2026-001" });
    const [versions, caps] = await Promise.all([
      leadBackend.evidence.listVersions({ findingId: loadedFinding.id }),
      leadBackend.caps.listRevisions({ findingId: loadedFinding.id }),
    ]);
    setFinding(loadedFinding);
    setEvidenceVersions(versions);
    setCapRevisions(caps.items);
  }

  useEffect(() => {
    let cancelled = false;
    void loadReviewTarget().catch((cause) => {
      if (!cancelled) setError(errorMessage(cause));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadBackend]);

  function requestRole(role: Role): void {
    session?.setActiveRole(role);
    navigate(createRoleEntryPath(role));
  }

  async function recordReview(): Promise<void> {
    if (!finding || !latest) return;
    if (!commentToAuditee.trim()) {
      setError("Comment to Auditee is required");
      return;
    }
    if (!internalCaaNote.trim()) {
      setError("Internal CAA Note is required");
      return;
    }
    if (commentToAuditee.trim() === internalCaaNote.trim()) {
      setError("Comment to Auditee and Internal CAA Note must be separate");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const review = await leadBackend.evidence.review({
        operationId: `OP-EVIDENCE-${decision}`,
        evidenceVersionId: latest.id,
        expectedEvidenceVersionRevision: latest.revision,
        findingId: finding.id,
        expectedFindingRevision: finding.revision,
        decision,
        commentToAuditee,
        internalCaaNote,
      });
      const [loadedVersions, loadedFinding] = await Promise.all([
        leadBackend.evidence.listVersions({ findingId: finding.id }),
        leadBackend.findings.get({ findingId: finding.id }),
      ]);
      setEvidenceReview(review);
      setEvidenceVersions(loadedVersions);
      setFinding(loadedFinding);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const closed = finding?.status === "CLOSED";
  const latestCap = capRevisions.at(-1) ?? null;

  function openReviewPanel(): void {
    document.getElementById("evidence-review-target")?.scrollIntoView({ block: "start" });
  }

  return (
    <WorkspaceShell roleLabel="Lead Inspector" routeLabel="Evidence Review">
      <CommandError message={error} />
      {finding ? (
        <div className="evidence-root-page">
          <span className="finding-semantic-context">Lead Inspector · {finding.organizationName} · Review evidence · Evidence · Due</span>
          <header className="evidence-root-head workbench-page-header">
            <div>
              <h1>Findings</h1>
              <p>Follow findings, CAP responses, evidence, owner, due date, and next action in one workspace.</p>
            </div>
            <nav aria-label="Finding filters" className="evidence-root-filters">
              <button disabled title="The all-findings register remains in the accepted legacy demo." type="button"><span>All Findings</span></button>
              <button disabled title="The open-findings register remains in the accepted legacy demo." type="button"><span>Open Findings</span></button>
              <button disabled title="The overdue-findings register remains in the accepted legacy demo." type="button"><span>Overdue Findings</span></button>
              <button onClick={() => navigate(`/lead-inspector/cap-review/${finding.id}`)} type="button"><span>CAP / Provider Review</span></button>
              <button aria-current="page" disabled type="button"><span>Evidence Waiting Review</span></button>
              <button disabled title="The Due Soon findings register remains in the accepted legacy demo." type="button"><span>Findings Due Soon</span></button>
              <button disabled title="The critical-findings register remains in the accepted legacy demo." type="button"><span>Critical Findings</span></button>
              <button disabled title="The closed-findings register remains in the accepted legacy demo." type="button"><span>Closed Findings</span></button>
            </nav>
          </header>

          <div className="evidence-root-attention">
            <div className="is-info"><span>Evidence Waiting Review</span><b>1 finding</b></div>
            <div className="is-warn"><span>CAP review rows</span><b>0</b></div>
            <div className="is-warn"><span>Evidence review rows</span><b>{latest ? 1 : 0}</b></div>
          </div>

          <div className="evidence-root-table-wrap">
            <table className="evidence-root-table">
              <thead><tr><th>Priority</th><th>Item</th><th>Organization</th><th>Owner</th><th>Next Action</th><th>Due Date / Target</th><th>Status</th><th>Open</th></tr></thead>
              <tbody>
                <tr className="is-parent is-attention">
                  <td data-col="priority"><span className="evidence-root-priority is-warn">Waiting review</span></td>
                  <td data-col="item"><b>{finding.title}</b><small>{finding.findingNumber} · {formatSeverity(finding.severity)}</small></td>
                  <td data-col="org">{finding.organizationName}</td>
                  <td data-col="owner" data-label="Owner:">Lead Inspector</td>
                  <td data-col="next" data-label="Next:"><b>Review evidence</b></td>
                  <td data-col="due">Due Date {formatLocalDate(finding.dueDate)}</td>
                  <td data-col="status"><span className="evidence-root-status">● Evidence Submitted — Pending Review</span></td>
                  <td data-col="actions"><button onClick={() => navigate(`/lead-inspector/findings/${finding.id}`)} type="button">View finding</button></td>
                </tr>
                {latestCap ? (
                  <tr className="is-child">
                    <td data-col="priority"><span className="evidence-root-priority is-info">CAP state</span></td>
                    <td data-col="item"><b><span>Subitem</span> Corrective Action Plan</b><small>{latestCap.correctiveAction}</small></td>
                    <td data-col="org">{finding.organizationName}</td>
                    <td data-col="owner" data-label="Owner:">Lead Inspector</td>
                    <td data-col="next" data-label="Next:"><b>CAP accepted; evidence still required before closure</b></td>
                    <td data-col="due">Target {formatLocalDate(latestCap.targetCompletionDate)}</td>
                    <td data-col="status"><span className="evidence-root-status">● {latestCap.status}</span></td>
                    <td data-col="actions"><button onClick={() => navigate(`/lead-inspector/findings/${finding.id}`)} type="button">Open finding</button></td>
                  </tr>
                ) : null}
                {evidenceVersions.map((version) => (
                  <tr className={`is-child${version.id === latest?.id ? " is-attention" : ""}`} key={version.id}>
                    <td data-col="priority"><span className={`evidence-root-priority ${version.id === latest?.id ? "is-warn" : "is-info"}`}>{version.id === latest?.id ? "Waiting review" : "Reviewed"}</span></td>
                    <td data-col="item"><b><span>Subitem</span> Evidence v{version.version}</b><small>{version.fileName}</small></td>
                    <td data-col="org">{finding.organizationName}</td>
                    <td data-col="owner" data-label="Owner:">Lead Inspector</td>
                    <td data-col="next" data-label="Next:"><b>{version.id === latest?.id ? "CAA evidence review" : "Review recorded"}</b></td>
                    <td data-col="due">Uploaded {submittedDate(version.submittedAt)}</td>
                    <td data-col="status"><span className="evidence-root-status">● {version.reviewState === "PENDING_CAA_REVIEW" ? "Uploaded" : version.reviewState}</span></td>
                    <td data-col="actions"><button className={version.id === latest?.id ? "is-primary" : ""} onClick={openReviewPanel} type="button">{version.id === latest?.id ? "Review evidence" : "View version"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <article className="lead-review-dossier evidence-root-review" data-testid="evidence-review-target" id="evidence-review-target">
            <div className="lead-review-dossier__head">
              <div>
                <p className="eyebrow">Latest submitted Evidence</p>
                <h2 data-testid="reviewing-evidence-version">
                  {latest ? `Version ${latest.version}` : "No version"}
                </h2>
              </div>
              {latest ? (
                <StatusPill label={latest.reviewState} tone={statusTone(latest.reviewState)} />
              ) : null}
            </div>
            {latest ? <p>{latest.fileName}</p> : <p>No Evidence version is ready for review.</p>}
            <ol aria-label="Evidence version history" className="lead-review-version-list">
              {evidenceVersions.map((version) => (
                <li data-testid="evidence-history-row" key={version.id}>
                  <strong>Version {version.version}</strong>
                  <span>{version.fileName}</span>
                  <span>{version.scanState}</span>
                  <span>{version.reviewState}</span>
                </li>
              ))}
            </ol>
            <div className="lead-review-decision-grid">
              <label className="lead-review-field-span">
                Evidence review decision
                <select
                  value={decision}
                  onChange={(event) => setDecision(event.target.value as EvidenceDecision)}
                >
                  <option value="PARTIALLY_CLOSE">Partially Close</option>
                  <option value="NOT_CLOSE">Not Close</option>
                  <option value="REQUEST_MORE_INFORMATION">Request More Information</option>
                  <option value="CLOSE">Close</option>
                </select>
              </label>
              <label>
                Comment to Auditee
                <textarea
                  rows={4}
                  value={commentToAuditee}
                  onChange={(event) => setCommentToAuditee(event.target.value)}
                />
              </label>
              <label>
                Internal CAA Note
                <textarea
                  rows={4}
                  value={internalCaaNote}
                  onChange={(event) => setInternalCaaNote(event.target.value)}
                />
              </label>
              <button
                className="primary-button lead-review-field-span"
                disabled={busy || !latest}
                onClick={() => void recordReview()}
                type="button"
              >
                Record Evidence review
              </button>
            </div>
          </article>
          {evidenceReview ? (
            <section className="lead-review-result">
              <strong data-testid="finding-status">{finding.status}</strong>
              <span data-testid="closure-state">{closed ? "Finding closed" : "Finding remains open"}</span>
              {closed ? <span data-testid="closure-basis">{finding.closureBasis}</span> : null}
              {closed ? (
                <RoleHandoff
                  identityMode={identityMode}
                  onRoleRequest={requestRole}
                  session={handoffSession}
                  targetRole="manager"
                >
                  Open updated Manager Dashboard
                </RoleHandoff>
              ) : (
                <RoleHandoff
                  identityMode={identityMode}
                  onRoleRequest={requestRole}
                  session={handoffSession}
                  targetRole="auditee"
                >
                  Return to Auditee Evidence
                </RoleHandoff>
              )}
            </section>
          ) : null}
        </div>
      ) : (
        <article className="lead-review-empty">
          <h2>Finding unavailable</h2>
          <p>The Evidence review route could not load this Finding for the Lead Inspector.</p>
        </article>
      )}
    </WorkspaceShell>
  );
}
