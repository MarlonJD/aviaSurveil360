import { useState } from "react";

import type { Role } from "../backend/backend";
import type { ReactSurfaceId } from "../app/route-contracts";
import type { RoleSelectionMode } from "./role-select-page";
import { roleLabel } from "./role-select-page";

export interface ShellIdentityPresentation {
  mode: RoleSelectionMode;
  displayName: string;
  organizationLabel: string;
  activeRole: Role;
  availableRoles: readonly Role[];
}

export type NotificationState =
  | { kind: "local"; unreadCount: number; onOpen(): void }
  | { kind: "unavailable"; reason: string };

function initials(name: string): string {
  return name.split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
}

export function ApplicationTopbar({
  identity,
  onRoleRequest,
  onLogout,
  notificationState,
  activeRouteId,
}: {
  identity: ShellIdentityPresentation;
  onRoleRequest(role: Role): void;
  onLogout(): void;
  notificationState: NotificationState;
  activeRouteId?: ReactSurfaceId;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const auditeeChrome = identity.activeRole === "auditee";
  const managerChrome = identity.activeRole === "manager";
  if (auditeeChrome || managerChrome) {
    const managerCrumbs: Partial<Record<ReactSurfaceId, string>> = {
      "manager-home": "Dashboard",
      "organization-registry": "Dashboard  ›  Organizations",
      "audit-plan": "Dashboard  ›  Planning",
      "report-preview": "Dashboard  ›  Reports Approval",
    };
    const routeCrumbs = auditeeChrome ? "Corrective Actions (CAP)" : managerCrumbs[activeRouteId ?? "manager-home"] ?? "Dashboard";
    return (
      <header className={`application-topbar application-topbar--root ${auditeeChrome ? "application-topbar--auditee auditee-root-topbar" : "application-topbar--manager manager-root-topbar"}`}>
        <div className="auditee-root-topbar__crumbs"><b>{routeCrumbs}</b></div>
        <div className="auditee-root-topbar__spacer" />
        <label className="auditee-root-topbar__experience">
          <span>Experience</span>
          <select
            aria-label="Experience"
            onChange={(event) => onRoleRequest(event.target.value as Role)}
            value={identity.activeRole}
          >
            {identity.availableRoles.map((role) => <option key={role} value={role}>{role === "auditee" ? "Service Provider Portal - Service Provider" : roleLabel(role)}</option>)}
          </select>
        </label>
        <div className="auditee-root-topbar__notification">
          {notificationState.kind === "local" ? (
            <button
              aria-expanded={notificationsOpen}
              aria-label="Notifications"
              className="auditee-root-topbar__icon"
              onClick={() => {
                notificationState.onOpen();
                setNotificationsOpen((value) => !value);
              }}
              type="button"
            >
              <span aria-hidden="true">🔔</span>
              {notificationState.unreadCount ? <span className="auditee-root-topbar__badge">{notificationState.unreadCount}</span> : null}
            </button>
          ) : (
            <button
              aria-label={`Notifications unavailable: ${notificationState.reason}`}
              className="auditee-root-topbar__icon"
              disabled
              title={notificationState.reason}
              type="button"
            >
              <span aria-hidden="true">🔔</span>
            </button>
          )}
          {notificationsOpen ? <p className="topbar-popover" role="status">{notificationState.kind === "local" ? `${notificationState.unreadCount} local notification updates` : notificationState.reason}</p> : null}
        </div>
        <div className="auditee-root-topbar__who">
          <span className="auditee-root-topbar__avatar">{initials(identity.displayName)}</span>
          <span className="auditee-root-topbar__identity">
            <strong>{identity.displayName}</strong>
            <small>{auditeeChrome ? `Service Provider Portal · ${identity.organizationLabel}` : "Department Manager"}</small>
          </span>
        </div>
      </header>
    );
  }
  return (
    <header className="application-topbar">
      <button
        aria-expanded={helpOpen}
        aria-label="Help"
        className="topbar-icon-button"
        onClick={() => setHelpOpen((value) => !value)}
        type="button"
      >
        ?
      </button>
      {helpOpen ? <p className="topbar-popover" role="status">Candidate help is available in this workbench.</p> : null}
      <div className="topbar-control">
        {notificationState.kind === "local" ? (
          <button
            aria-expanded={notificationsOpen}
            aria-label="Notifications"
            className="topbar-icon-button"
            type="button"
            onClick={() => {
              notificationState.onOpen();
              setNotificationsOpen((value) => !value);
            }}
          >
            <span aria-hidden="true">🔔</span>
            {notificationState.unreadCount ? <span className="topbar-notification-dot">{auditeeChrome ? notificationState.unreadCount : null}</span> : null}
          </button>
        ) : (
          <>
            <button
              aria-label={`Notifications unavailable: ${notificationState.reason}`}
              aria-describedby="topbar-notification-unavailable"
              className="topbar-icon-button"
              disabled
              title={notificationState.reason}
              type="button"
            >
              <span aria-hidden="true">🔔</span>
            </button>
            <span className="topbar-unavailable-reason" id="topbar-notification-unavailable">{notificationState.reason}</span>
          </>
        )}
        {notificationsOpen ? <p className="topbar-popover" role="status">{notificationState.kind === "local" ? `${notificationState.unreadCount} local notification updates` : notificationState.reason}</p> : null}
      </div>
      <div className="topbar-control">
        <button
          aria-expanded={profileOpen}
          className="topbar-profile"
          onClick={() => setProfileOpen((value) => !value)}
          type="button"
        >
          <span className="topbar-avatar">{initials(identity.displayName)}</span>
          {auditeeChrome ? (
            <span className="topbar-profile__identity">
              <strong>{identity.displayName}</strong>
              <small>Service Provider Portal · {identity.organizationLabel}</small>
            </span>
          ) : <span>{identity.displayName}</span>}
          <span className="topbar-profile__chevron" aria-hidden="true">⌄</span>
        </button>
        {identity.mode === "oidc-session" ? null : (
          <a
            aria-label="Switch role"
            className="topbar-switch-role"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              onLogout();
            }}
            title="Switch role"
          />
        )}
        {profileOpen ? (
          <div className="topbar-profile-menu" role="menu" aria-label="Profile menu">
            <p>{identity.organizationLabel}</p>
            <p>{roleLabel(identity.activeRole)}</p>
            {identity.availableRoles.filter((role) => role !== identity.activeRole).map((role) => (
              <button key={role} onClick={() => onRoleRequest(role)} type="button">{roleLabel(role)}</button>
            ))}
            <button onClick={onLogout} type="button">Logout</button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
