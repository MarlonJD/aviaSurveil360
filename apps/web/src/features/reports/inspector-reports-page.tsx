import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useApplicationRuntime } from "../../app/providers";
import type { DocumentMetadataView, FindingView } from "../../backend/backend";
import { StatusPill } from "../../ui/workbench/status-pill";
import { CommandError, errorMessage, formatLocalDate, WorkspaceShell } from "../shared/workspace-shell";

const sourceReports = [
  ["CAB-2026-011", "Emergency equipment serviceability record incomplete", "10 May 2026"],
  ["CAB-2026-014", "Cabin inspection document index improvement", "18 Jun 2026"],
  ["OPS-2025-014", "Pre-flight documentation filing incomplete", "4 Dec 2025"],
] as const;

export function InspectorReportsPage() {
  const runtime = useApplicationRuntime();
  const backend = useMemo(() => runtime.backendForRole?.("inspector") ?? runtime.backend, [runtime]);
  const [documents, setDocuments] = useState<DocumentMetadataView[]>([]);
  const [cabFinding, setCabFinding] = useState<FindingView | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      backend.documents?.list({}) ?? Promise.resolve({ items: [], nextCursor: null }),
      backend.findings.list({ limit: 50 }),
    ]).then(([documentPage, findingPage]) => {
      if (cancelled) return;
      setDocuments(documentPage.items.filter((item) => item.kind === "REPORT"));
      setCabFinding(findingPage.items.find((item) => item.id === "FND-CAB-2026-001") ?? null);
    }).catch((cause) => !cancelled && setError(errorMessage(cause)));
    return () => { cancelled = true; };
  }, [backend]);
  const allReportsClosed = cabFinding?.status === "CLOSED";
  return <WorkspaceShell roleLabel="CAA Inspector" routeLabel="Inspector Reports">
    <div className="inspector-secondary-page" data-testid="inspector-reports-page">
      <header className="inspector-secondary-head workbench-page-header"><div><h1>Reports</h1><p>Report previews and historical closure reports (view only).</p></div></header>
      <CommandError message={error} />
      <h2 className="inspector-section-heading">Past Reports</h2>
      <section className="inspector-work-queue inspector-report-queue" aria-label={allReportsClosed ? "Past closure reports" : "Report previews and historical reports"}>
        <div className="inspector-work-queue__head" aria-hidden="true"><span>Priority</span><span>Item</span><span>Organization</span><span>Owner</span><span>Next Action</span><span>Due Date / Target</span><span>Status</span><span>Open</span></div>
        {sourceReports.map(([id, sourceTitle, sourceDate], index) => {
          const isCabPreview = id === "CAB-2026-011";
          const isClosed = isCabPreview ? cabFinding?.status === "CLOSED" : true;
          const statusLabel = isClosed ? "Closed" : cabFinding ? cabFinding.status.replaceAll("_", " ") : "Draft preview";
          const title = isCabPreview && cabFinding ? cabFinding.title : sourceTitle;
          const date = isCabPreview && cabFinding ? formatLocalDate(cabFinding.dueDate) : sourceDate;
          return <article className={`inspector-work-row inspector-work-row--${isClosed ? "success" : "warning"}`} key={id}>
          <div className="inspector-work-row__priority"><StatusPill label={statusLabel} tone={isClosed ? "success" : "warning"} /></div>
          <div className="inspector-work-row__item"><h3>{title}</h3><p>{id} · {isCabPreview && cabFinding ? cabFinding.severity.replaceAll("_", " ") : id === "OPS-2025-014" ? "Level 3 Minor" : "Observation"}</p></div>
          <p className="inspector-work-row__organization">{isCabPreview && cabFinding ? cabFinding.organizationName : "Fly Namibia"}</p>
          <p className="inspector-work-row__owner"><span>Owner: </span>{isClosed ? "—" : "Lead Inspector"}</p>
          <p className="inspector-work-row__action"><span>Next: </span>{isClosed ? "View only — historical report" : cabFinding?.nextAction ?? "Draft preview pending Finding lifecycle"}</p>
          <p aria-label={`Due Date ${statusLabel} ${date}`} className="inspector-work-row__due"><span>Due Date </span>{isClosed ? <span className="inspector-report-closed-label">Closed </span> : null}{date}</p>
          <div className="inspector-work-row__status"><StatusPill label={statusLabel} tone={isClosed ? "success" : "warning"} /></div>
          {isCabPreview ? (
            <Link aria-label={`Preview CAB-2026-011 ${isClosed ? "closure" : "draft"} report`} className="inspector-secondary-button inspector-work-row__open" to="/inspector/closure-reports/CR-CAB-2026-001"><span>View report</span></Link>
          ) : (
            <button
              aria-label={`Report preview unavailable for ${id}`}
              className="inspector-secondary-button inspector-work-row__open"
              data-document-id={documents[index]?.id}
              disabled
              title={`Report ${id} does not have a declared Inspector report-detail route.`}
              type="button"
            >
              <span>View report</span>
            </button>
          )}
        </article>})}
      </section>
    </div>
  </WorkspaceShell>;
}
