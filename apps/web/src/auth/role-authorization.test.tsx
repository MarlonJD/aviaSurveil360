// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { REACT_ROUTE_CONTRACTS } from "../app/route-contracts";
import type { Role } from "../backend/backend";
import { RoleGuard } from "./role-guard";
import { RoleHandoff } from "./role-handoff";
import type { SessionState } from "./session-client";

const allRoles: Role[] = [
  "inspector",
  "leadInspector",
  "manager",
  "finance",
  "gm",
  "executiveDirector",
  "auditee",
  "admin",
];

function authenticated(activeRole: Role, roles: Role[] = [activeRole]): SessionState {
  return {
    status: "authenticated",
    activeRole,
    session: {
      subjectId: `subject-${activeRole}`,
      displayName: "Role Tester",
      organizationId: "CAA",
      roles,
    },
  };
}

afterEach(() => cleanup());

describe("RoleGuard route authority", () => {
  it.each(REACT_ROUTE_CONTRACTS.filter((contract) => contract.requiredRole))(
    "allows only %s to mount %s",
    (contract) => {
      const allowed = contract.requiredRole!;
      const disallowed = allRoles.find((role) => role !== allowed)!;

      const { rerender } = render(
        <MemoryRouter initialEntries={[contract.path]}>
          <RoleGuard requiredRole={allowed} state={authenticated(allowed)}>
            <div data-testid="protected-content">{contract.id}</div>
          </RoleGuard>
        </MemoryRouter>,
      );
      expect(screen.getByTestId("protected-content")).toHaveTextContent(contract.id);

      rerender(
        <MemoryRouter initialEntries={[contract.path]}>
          <RoleGuard requiredRole={allowed} state={authenticated(disallowed)}>
            <div data-testid="protected-content">{contract.id}</div>
          </RoleGuard>
        </MemoryRouter>,
      );
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
      expect(screen.getByTestId("route-forbidden")).toHaveTextContent("Not available for this role");
    },
  );

  it("fails closed for unauthenticated and unsupported direct route loads before children mount", () => {
    render(
      <MemoryRouter initialEntries={["/lead-inspector/lead-review"]}>
        <RoleGuard requiredRole="leadInspector" state={{ status: "unauthenticated" }}>
          <div data-testid="lead-fetch">Lead fetch mounted</div>
        </RoleGuard>
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("lead-fetch")).not.toBeInTheDocument();
    expect(screen.getByTestId("route-unauthenticated")).toBeInTheDocument();
  });
});

describe("RoleHandoff", () => {
  it("lets demo and canonical-test modes switch Backend authority", async () => {
    const onRoleRequest = vi.fn();
    render(
      <RoleHandoff
        identityMode="canonical-test-role-switch"
        session={authenticated("inspector", ["inspector", "leadInspector"])}
        targetRole="leadInspector"
        onRoleRequest={onRoleRequest}
      >
        Open Lead review
      </RoleHandoff>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Open Lead review" }));
    expect(onRoleRequest).toHaveBeenCalledWith("leadInspector");
  });

  it("does not fabricate a normal OIDC role that is absent from the session", () => {
    render(
      <RoleHandoff
        identityMode="oidc-session"
        session={authenticated("inspector", ["inspector"])}
        targetRole="leadInspector"
        onRoleRequest={vi.fn()}
      >
        Open Lead review
      </RoleHandoff>,
    );

    expect(screen.getByRole("button", { name: "Open Lead review" })).toBeDisabled();
    expect(screen.getByText("Your session does not include Lead Inspector authority.")).toBeInTheDocument();
  });
});
