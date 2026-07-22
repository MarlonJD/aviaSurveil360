import { useEffect, useMemo, useState } from "react";

import { useApplicationRuntime } from "../../app/providers";
import type { AuditEventView, ReportVersionView } from "../../backend/backend";
import { CommandError, errorMessage, PageHeader, WorkspaceShell } from "../shared/workspace-shell";

export function ManagerPreliminaryReviewPage() {
  const runtime = useApplicationRuntime();
  const backend = useMemo(() => runtime.backendForRole?.("manager") ?? runtime.backend, [runtime]);
  const [versions, setVersions] = useState<ReportVersionView[]>([]);
  const [history, setHistory] = useState<AuditEventView[]>([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = versions.find((version) => version.reportVersionId === "PR-2026-018-V1") ?? null;

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      backend.reports.getVersion({ reportVersionId: "PR-2026-018-V0" }),
      backend.reports.getVersion({ reportVersionId: "PR-2026-018-V1" }),
      backend.auditTrail.list({ entityType: "report_version", entityId: "PR-2026-018-V0" }),
    ]).then(([v0, v1, events]) => { if (!cancelled) { setVersions([v0, v1]); setHistory(events.items); } }).catch((cause) => !cancelled && setError(errorMessage(cause)));
    return () => { cancelled = true; };
  }, [backend]);

  async function decide(decision: "RETURN" | "FORWARD") {
    if (!current) return;
    if (!reason.trim()) { setError("Department Manager decision reason is required"); return; }
    setBusy(true); setError(null);
    try {
      const updated = await backend.reports.decide({
        operationId: `OP-PR-2026-018-V1-${decision}`,
        reportVersionId: current.reportVersionId,
        expectedReportVersionRevision: current.revision,
        decision,
        reason,
      });
      setVersions((items) => items.map((item) => item.reportVersionId === updated.reportVersionId ? updated : item));
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }

  return (
    <WorkspaceShell roleLabel="Department Manager" routeLabel="Preliminary Report Review">
      <div className="manager-ops-page" data-testid="manager-preliminary-review-page">
        <PageHeader eyebrow="Immutable report approval" title="Preliminary Report Review" description="Return or forward only the exact Department Review version with a recorded reason. Issuance remains Executive Director authority." />
        <CommandError message={error} />
        <div className="manager-ops-layout"><section aria-label="Preliminary Report version history" className="manager-ops-register">{versions.map((version) => <article className="manager-ops-card" key={version.reportVersionId}><p className="eyebrow">Immutable version {version.version}</p><h2>{version.reportVersionId}</h2><p>{version.status} · revision {version.revision}</p><code>{version.contentHash}</code>{history.filter((event) => event.entityId === version.reportVersionId).map((event) => <div key={event.eventId}><strong>Return reason</strong><p>{event.reason}</p></div>)}</article>)}</section>{current ? <section aria-label={`Department review ${current.reportVersionId}`} className="manager-ops-dossier"><p className="eyebrow">Current approval stage</p><h2>Department decision</h2><strong data-testid="manager-preliminary-status">{current.status}</strong>{current.status === "DEPARTMENT_REVIEW" ? <><label>Department Manager decision reason<textarea rows={4} value={reason} onChange={(event) => setReason(event.target.value)} /></label><div className="manager-ops-actions"><button disabled={busy} onClick={() => void decide("RETURN")} type="button">Return {current.reportVersionId} to Lead Inspector</button><button disabled={busy} onClick={() => void decide("FORWARD")} type="button">Forward {current.reportVersionId} to General Manager</button></div></> : <p>This immutable version is now owned by the next declared approval stage.</p>}</section> : null}</div>
      </div>
    </WorkspaceShell>
  );
}
