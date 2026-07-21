import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";

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
    <main className="workspace-shell" data-testid="application-shell">
      <aside className="workspace-sidebar">
        <Link className="sidebar-brand primary-link" to="/">AviaSurveil360</Link>
        <RoleNavigation activeRole={identity.activeRole} activeRouteId={activeRouteId} />
        <MobileNavigation activeRole={identity.activeRole} activeRouteId={activeRouteId} />
        <Link className="switch-role primary-link" to="/">Switch role</Link>
      </aside>
      <section className="workspace-content">
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
