import { useState } from "react";

import type { Role } from "../backend/backend";
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
}: {
  identity: ShellIdentityPresentation;
  onRoleRequest(role: Role): void;
  onLogout(): void;
  notificationState: NotificationState;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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
            {notificationState.unreadCount ? <span className="topbar-notification-dot" /> : null}
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
          <span>{identity.displayName}</span>
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
