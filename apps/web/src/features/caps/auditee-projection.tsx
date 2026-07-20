import type { FindingView } from "../../backend/backend";
import { formatLocalDate, formatSeverity } from "../shared/workspace-shell";

export interface AuditeeFindingProjection {
  id: string;
  findingNumber: string;
  auditId: string;
  organizationName: string;
  title: string;
  description: string;
  status: FindingView["status"];
  severity: FindingView["severity"];
  dueDate: string | null;
  currentOwnerType: FindingView["currentOwnerType"];
  nextAction: string;
  closureBasis: FindingView["closureBasis"];
}

export function createAuditeeFindingProjection(finding: FindingView): AuditeeFindingProjection {
  return {
    id: finding.id,
    findingNumber: finding.findingNumber,
    auditId: finding.auditId,
    organizationName: finding.organizationName,
    title: finding.title,
    description: finding.description,
    status: finding.status,
    severity: finding.severity,
    dueDate: finding.dueDate,
    currentOwnerType: finding.currentOwnerType,
    nextAction: finding.nextAction,
    closureBasis: finding.closureBasis,
  };
}

export function AuditeeFindingSummary({ finding }: { finding: AuditeeFindingProjection }) {
  return (
    <article className="surface-card finding-summary">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Finding dossier</p>
          <h2>{finding.findingNumber}</h2>
        </div>
        <span className="status-pill" data-testid="finding-status">{finding.status}</span>
      </div>
      <p>{finding.title}</p>
      <dl className="fact-grid">
        <div><dt>Organization</dt><dd>{finding.organizationName}</dd></div>
        <div><dt>Related Audit</dt><dd>{finding.auditId}</dd></div>
        <div><dt>Severity</dt><dd>{formatSeverity(finding.severity)}</dd></div>
        <div><dt>Due Date</dt><dd>{formatLocalDate(finding.dueDate)}</dd></div>
        <div><dt>Current owner</dt><dd>{finding.currentOwnerType}</dd></div>
        <div><dt>Next action</dt><dd>{finding.nextAction}</dd></div>
      </dl>
    </article>
  );
}
