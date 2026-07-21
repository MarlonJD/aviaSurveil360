import type { PropsWithChildren, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import type { FindingSeverity, FindingView, Role } from "../../backend/backend";
import { useApplicationRuntime } from "../../app/providers";
import type { ReactSurfaceId } from "../../app/route-contracts";
import { useOptionalSession } from "../../auth/session-provider";
import { ApplicationShell, type NotificationState, type ShellIdentityPresentation } from "../../ui/application-shell";
import { ROLE_ENTRIES, createRoleEntryPath } from "../../ui/role-select-page";

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
  const session = useOptionalSession();
  const navigate = useNavigate();
  const routeRole = roleForLabel(roleLabel);
  const activeRouteId = routeForLabel(routeLabel, routeRole);
  const authenticatedSession =
    session?.state.status === "authenticated" ? session.state : null;
  const activeRole =
    authenticatedSession?.session.roles.includes(routeRole)
      ? routeRole
      : authenticatedSession?.activeRole ?? routeRole;
  const fallbackMode = buildProfile === "http" ? "canonical-test-role-switch" : "demo-role-switch";
  const mode =
    authenticatedSession
      ? session?.identityMode ?? fallbackMode
      : fallbackMode;
  const identity: ShellIdentityPresentation = {
    mode,
    displayName: authenticatedSession?.session.displayName ?? deterministicDisplayName(activeRole),
    organizationLabel:
      authenticatedSession?.session.organizationId ??
      (activeRole === "auditee" ? "Fly Namibia" : "Namibia Civil Aviation Authority"),
    activeRole,
    availableRoles: authenticatedSession?.session.roles ?? ROLE_ENTRIES.map((entry) => entry.role),
  };
  const notificationState: NotificationState =
    buildProfile === "http"
      ? {
          kind: "unavailable",
          reason: "Notification delivery is not connected in this candidate.",
        }
      : { kind: "local", unreadCount: 2, onOpen: () => undefined };
  return (
    <ApplicationShell
      activeRouteId={activeRouteId}
      environmentLabel={buildProfile === "demo" ? "Deterministic mock data" : environmentLabel}
      identity={identity}
      notificationState={notificationState}
      onLogout={() => navigate("/")}
      onRoleRequest={(role) => {
        session?.setActiveRole(role);
        navigate(createRoleEntryPath(role));
      }}
    >
      {children}
    </ApplicationShell>
  );
}

const roleLabels: Record<string, Role> = {
  "CAA Inspector": "inspector",
  "Lead Inspector": "leadInspector",
  "Department Manager": "manager",
  "General Manager": "gm",
  "Finance Review": "finance",
  "Executive Director": "executiveDirector",
  "Auditee — Fly Namibia": "auditee",
  "Admin Preview": "admin",
};

const deterministicNames: Record<Role, string> = {
  inspector: "Aylin Sezer",
  leadInspector: "Caner Yildiz",
  manager: "Mehmet Kaya",
  gm: "Okan Demir",
  finance: "Derya Acar",
  executiveDirector: "Ufuk Aslan",
  auditee: "Fly Namibia",
  admin: "Admin Preview",
};

function deterministicDisplayName(role: Role): string {
  return deterministicNames[role];
}

const routeLabels: Record<string, ReactSurfaceId> = {
  "My Assignments": "inspector-home",
  "Lead Review": "lead-home",
  Dashboard: "manager-home",
  "GM Dashboard": "gm-home",
  "Finance Review": "finance-home",
  "Executive Dashboard": "executive-home",
  "Corrective Actions": "auditee-home",
  Templates: "admin-home",
  "Audit Detail": "audit-detail",
  "Checklist Runner": "checklist-runner",
  "Organization Registry": "organization-registry",
  "Audit Plan Calendar": "audit-plan",
  "Finding Detail": "finding-detail",
  "CAP Review": "cap-review",
  "Evidence Review": "evidence-review",
  "Report Preview": "report-preview",
};

function roleForLabel(label: string): Role {
  return roleLabels[label] ?? "inspector";
}

function routeForLabel(label: string, role: Role): ReactSurfaceId {
  const direct = routeLabels[label];
  if (direct) return direct;
  return ROLE_ENTRIES.find((entry) => entry.role === role)?.routeId ?? "inspector-home";
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
