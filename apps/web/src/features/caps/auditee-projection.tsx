import type { FindingView } from "../../backend/backend";
import { formatLocalDate, formatSeverity } from "../shared/workspace-shell";

export interface AuditeeFindingProjection {
  id: string;
  findingNumber: string;
  auditId: string;
  organizationName: string;
  title: string;
  description: string;
  regulatoryReference: string | null;
  findingBasis: string;
  status: FindingView["status"];
  severity: FindingView["severity"];
  dueDate: string | null;
  dueState: FindingView["dueState"];
  currentOwnerType: FindingView["currentOwnerType"];
  nextAction: string;
  capRequired: boolean;
  evidenceRequired: boolean;
  issuedAt: string | null;
  closedAt: string | null;
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
    regulatoryReference: finding.regulatoryReference,
    findingBasis: finding.findingBasis,
    status: finding.status,
    severity: finding.severity,
    dueDate: finding.dueDate,
    dueState: finding.dueState,
    currentOwnerType: finding.currentOwnerType,
    nextAction: finding.nextAction,
    capRequired: finding.capRequired,
    evidenceRequired: finding.evidenceRequired,
    issuedAt: finding.issuedAt,
    closedAt: finding.closedAt,
    closureBasis: finding.closureBasis,
  };
}

export function AuditeeFindingSummary({ finding }: { finding: AuditeeFindingProjection }) {
  return (
    <article className="auditee-finding-summary">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Finding dossier</p>
          <h2>{finding.findingNumber}</h2>
        </div>
        <span className="status-pill" data-testid="finding-status">{finding.status}</span>
      </div>
      <p>{finding.title}</p>
      <dl className="auditee-finding-summary__facts">
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
