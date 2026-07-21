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
  return (
    <header className="application-topbar">
      <div>
        <span className="sidebar-caption">Active role</span>
        <strong data-testid="active-role">{roleLabel(identity.activeRole)}</strong>
      </div>
      {notificationState.kind === "local" ? (
        <div>
          <button
            className="secondary-button"
            type="button"
            aria-expanded={notificationsOpen}
            onClick={() => {
              notificationState.onOpen();
              setNotificationsOpen((value) => !value);
            }}
          >
            Notifications ({notificationState.unreadCount})
          </button>
          {notificationsOpen ? (
            <div className="surface-card" role="status">
              {notificationState.unreadCount} local notification updates
            </div>
          ) : null}
        </div>
      ) : (
        <div>
          <button
            aria-label={`Notifications unavailable: ${notificationState.reason}`}
            className="secondary-button"
            disabled
            type="button"
          >
            Notifications unavailable
          </button>
          <p>{notificationState.reason}</p>
        </div>
      )}
      <div>
        <button
          aria-expanded={profileOpen}
          className="secondary-button"
          onClick={() => setProfileOpen((value) => !value)}
          type="button"
        >
          {identity.displayName}
        </button>
        {profileOpen ? (
          <div className="surface-card" role="menu" aria-label="Profile menu">
            <p>{identity.organizationLabel}</p>
            <p>{roleLabel(identity.activeRole)}</p>
            {identity.availableRoles
              .filter((role) => role !== identity.activeRole)
              .map((role) => (
                <button
                  className="secondary-button"
                  key={role}
                  onClick={() => onRoleRequest(role)}
                  type="button"
                >
                  {roleLabel(role)}
                </button>
              ))}
            <button className="primary-button" onClick={onLogout} type="button">
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
