import type { PropsWithChildren, ReactNode } from "react";
import { Link } from "react-router-dom";

import type { FindingSeverity, FindingView } from "../../backend/backend";
import { useApplicationRuntime } from "../../app/providers";

export function formatLocalDate(value: string | null): string {
  if (!value) return "Not set";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatSeverity(value: FindingSeverity): string {
  const labels: Record<FindingSeverity, string> = {
    LEVEL_1_CRITICAL: "Level 1 Critical",
    LEVEL_2_MAJOR: "Level 2 Major",
    LEVEL_3_MINOR: "Level 3 Minor",
    OBSERVATION: "Observation",
  };
  return labels[value];
}

export function WorkspaceShell({
  roleLabel,
  routeLabel,
  children,
}: PropsWithChildren<{ roleLabel: string; routeLabel: string }>) {
  const { buildProfile, environmentLabel } = useApplicationRuntime();
  return (
    <main className="workspace-shell">
      <aside className="workspace-sidebar">
        <Link className="sidebar-brand" to="/">AviaSurveil360</Link>
        <div>
          <span className="sidebar-caption">Active role</span>
          <strong data-testid="active-role">{roleLabel}</strong>
        </div>
        <nav aria-label="Candidate navigation">
          <span aria-current="page">{routeLabel}</span>
        </nav>
        <Link className="switch-role" to="/">Switch role</Link>
      </aside>
      <section className="workspace-content">
        <div className="candidate-boundary">
          <span>Candidate-only</span>
          <span>{buildProfile === "demo" ? "Deterministic mock data" : environmentLabel}</span>
          <span>No production-readiness claim</span>
        </div>
        {children}
      </section>
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="workspace-purpose">{description}</p>
      </div>
      {action ? <div className="page-header__action">{action}</div> : null}
    </header>
  );
}

export function StatusPill({ children }: PropsWithChildren) {
  return <span className="status-pill">{children}</span>;
}

export function FindingFacts({ finding }: { finding: FindingView }) {
  return (
    <dl className="fact-grid">
      <div><dt>Finding</dt><dd>{finding.findingNumber}</dd></div>
      <div><dt>Status</dt><dd>{finding.status}</dd></div>
      <div><dt>Severity</dt><dd>{formatSeverity(finding.severity)}</dd></div>
      <div><dt>Organization</dt><dd>{finding.organizationName}</dd></div>
      <div><dt>Related Audit</dt><dd>{finding.auditId}</dd></div>
      <div><dt>Due Date</dt><dd>{formatLocalDate(finding.dueDate)}</dd></div>
      <div><dt>Current owner</dt><dd>{finding.currentOwnerType}</dd></div>
      <div><dt>Next action</dt><dd>{finding.nextAction}</dd></div>
    </dl>
  );
}

export function CommandError({ message }: { message: string | null }) {
  return message ? <p className="command-error" role="alert">{message}</p> : null;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The candidate action could not be completed.";
}
