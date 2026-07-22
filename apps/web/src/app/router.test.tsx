// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { AppProviders } from "./providers";
import { AppRouter, createRoleEntryPath, ROLE_ENTRIES } from "./router";
import { createMockBackendRuntime } from "../mock/create-mock-backend";

afterEach(() => cleanup());

describe("authorized role-entry inventory", () => {
  it("matches the eight verified legacy entry routes in display order", () => {
    expect(ROLE_ENTRIES.map(({ role, route }) => `${role}:${route}`)).toEqual([
      "inspector:inspector-assignments",
      "leadInspector:lead-review",
      "manager:dashboard",
      "gm:gm-dashboard",
      "finance:finance-review",
      "executiveDirector:executive-dashboard",
      "auditee:service-provider-cap",
      "admin:templates",
    ]);
  });

  it("creates stable URL paths without importing legacy globals", () => {
    expect(createRoleEntryPath("leadInspector")).toBe("/lead-inspector/lead-review");
    expect(createRoleEntryPath("auditee")).toBe("/auditee/service-provider-cap");
  });

  it("renders the actionable Finance workspace instead of a route-name placeholder", async () => {
    const runtime = createMockBackendRuntime();
    render(
      <AppProviders
        runtime={{
          backend: runtime.backend,
          backendForRole: runtime.backendForRole,
          buildProfile: "demo",
          environmentLabel: "Test",
        }}
      >
        <MemoryRouter initialEntries={["/finance/finance-review"]}>
          <AppRouter />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(screen.getByRole("heading", { name: "Finance Review" })).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "2026 Cabin Surveillance — Fly Namibia" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve Budget" })).toBeInTheDocument();
    expect(screen.queryByText(/candidate React entry route/i)).not.toBeInTheDocument();
  });

  it("renders the presentational role-selection shell on the root route", () => {
    const runtime = createMockBackendRuntime();
    render(
      <AppProviders
        runtime={{
          backend: runtime.backend,
          backendForRole: runtime.backendForRole,
          buildProfile: "demo",
          environmentLabel: "Test",
        }}
      >
        <MemoryRouter initialEntries={["/"]}>
          <AppRouter />
        </MemoryRouter>
      </AppProviders>,
    );

    expect(screen.getByTestId("role-select-panel")).toBeInTheDocument();
    expect(screen.getAllByTestId("role-card-icon")).toHaveLength(8);
  });

  it("redirects an undeclared path to role selection without rendering a placeholder", async () => {
    const runtime = createMockBackendRuntime();
    render(
      <AppProviders runtime={{ backend: runtime.backend, backendForRole: runtime.backendForRole, buildProfile: "demo", environmentLabel: "Test" }}>
        <MemoryRouter initialEntries={["/scope-leak"]}><AppRouter /></MemoryRouter>
      </AppProviders>,
    );

    expect(await screen.findByTestId("role-select-panel")).toBeInTheDocument();
    expect(screen.queryByText(/placeholder|coming soon|candidate React entry route/i)).not.toBeInTheDocument();
  });
});
