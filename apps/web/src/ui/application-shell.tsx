import type { PropsWithChildren } from "react";

import type { Role } from "../backend/backend";
import type { ReactSurfaceId } from "../app/route-contracts";
import { ApplicationTopbar, type NotificationState, type ShellIdentityPresentation } from "./application-topbar";
import { CandidateBoundary } from "./candidate-boundary";
import { MobileNavigation } from "./mobile-navigation";
import { RoleNavigation } from "./role-navigation";

export type { NotificationState, ShellIdentityPresentation } from "./application-topbar";

export interface ApplicationShellProps {
  identity: ShellIdentityPresentation;
  activeRouteId: ReactSurfaceId;
  onRoleRequest(role: Role): void;
  onLogout(): void;
  notificationState: NotificationState;
  environmentLabel?: string;
}

export function ApplicationShell({
  identity,
  activeRouteId,
  onRoleRequest,
  onLogout,
  notificationState,
  environmentLabel = "Deterministic mock data",
  children,
}: PropsWithChildren<ApplicationShellProps>) {
  return (
    <main className="workspace-shell" data-active-role={identity.activeRole} data-testid="application-shell">
      <aside className="workspace-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">
            <span className="sidebar-brand-mark__wing sidebar-brand-mark__wing--primary" />
            <span className="sidebar-brand-mark__wing sidebar-brand-mark__wing--secondary" />
            <span className="sidebar-brand-mark__code">AS</span>
          </span>
          <span><strong>AviaSurveil360</strong><small>Aviation Audit System</small></span>
        </div>
        <RoleNavigation activeRole={identity.activeRole} activeRouteId={activeRouteId} />
        <div className="sidebar-footer">
          <button className="nav-item" onClick={onLogout} type="button">
            <span className="nav-item__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M10 17 5 12l5-5" /><path d="M5 12h12" /><path d="M14 4h5v16h-5" /></svg>
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <section className="workspace-content">
        <span className="candidate-boundary" data-testid="active-role">
          {identity.activeRole === "inspector" ? "CAA Inspector" : identity.activeRole === "leadInspector" ? "Lead Inspector" : identity.activeRole}
        </span>
        <MobileNavigation activeRole={identity.activeRole} activeRouteId={activeRouteId} />
        <ApplicationTopbar
          identity={identity}
          onRoleRequest={onRoleRequest}
          onLogout={onLogout}
          notificationState={notificationState}
        />
        <CandidateBoundary mode={identity.mode} environmentLabel={environmentLabel} />
        {children}
      </section>
    </main>
  );
}
