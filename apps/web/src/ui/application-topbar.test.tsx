// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApplicationTopbar, type ShellIdentityPresentation } from "./application-topbar";

afterEach(() => cleanup());

const identity: ShellIdentityPresentation = {
  mode: "demo-role-switch",
  displayName: "Asha Inspector",
  organizationLabel: "Namibia Civil Aviation Authority",
  activeRole: "inspector",
  availableRoles: ["inspector", "leadInspector"],
};

describe("ApplicationTopbar", () => {
  it("opens local notifications with explicit local UI state", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <ApplicationTopbar
        identity={identity}
        onRoleRequest={() => undefined}
        onLogout={() => undefined}
        notificationState={{ kind: "local", unreadCount: 3, onOpen }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    expect(onOpen).toHaveBeenCalledOnce();
    expect(screen.getByText("3 local notification updates")).toBeInTheDocument();
  });

  it("shows profile identity and calls logout from a real menu", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    const onRoleRequest = vi.fn();
    render(
      <ApplicationTopbar
        identity={identity}
        onRoleRequest={onRoleRequest}
        onLogout={onLogout}
        notificationState={{ kind: "local", unreadCount: 0, onOpen: () => undefined }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Asha Inspector/i }));
    expect(screen.getByText("Namibia Civil Aviation Authority")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lead Inspector" }));
    expect(onRoleRequest).toHaveBeenCalledWith("leadInspector");
    await user.click(screen.getByRole("button", { name: "Logout" }));
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("disables unavailable normal HTTP notifications with the exact reason", () => {
    render(
      <ApplicationTopbar
        identity={{ ...identity, mode: "oidc-session" }}
        onRoleRequest={() => undefined}
        onLogout={() => undefined}
        notificationState={{
          kind: "unavailable",
          reason: "Notification delivery is not connected in this candidate.",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /Notifications unavailable/i })).toBeDisabled();
    expect(screen.getByText("Notification delivery is not connected in this candidate.")).toBeVisible();
  });
});
