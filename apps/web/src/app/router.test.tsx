// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppProviders } from "./providers";
import { ScenarioProvider } from "./scenario-context";
import { AppRouter, createRoleEntryPath, ROLE_ENTRIES } from "./router";
import { createMockBackendRuntime } from "../mock/create-mock-backend";
import { seedVisualRuntimeForPath } from "../mock/seed-visual-runtime";

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
    expect(await screen.findByRole("heading", { name: "Finance Review" })).toBeInTheDocument();
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

  it("keeps an HTTP-blocked direct load inside its real parent route with the Plan 2 capability notice", async () => {
    const runtime = createMockBackendRuntime();
    render(
      <AppProviders runtime={{ backend: runtime.backend, backendForRole: runtime.backendForRole, buildProfile: "http", environmentLabel: "Test" }}>
        <ScenarioProvider><MemoryRouter initialEntries={["/inspector/findings"]}><AppRouter /></MemoryRouter></ScenarioProvider>
      </AppProviders>,
    );

    expect(await screen.findByRole("heading", { name: "My Assignments" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("HTTP capability is unavailable until Plan 2 activates this route.");
    expect(screen.queryByText(/demo-only screen|generic placeholder/i)).not.toBeInTheDocument();
  });

  it("direct-loads ui-audit-044 through the Department Manager shell and backend", async () => {
    const runtime = createMockBackendRuntime();
    await seedVisualRuntimeForPath(runtime, "/department-manager/evidence/FND-CAB-2026-001");
    const managerListVersions = vi.spyOn(runtime.backendForRole("manager").evidence, "listVersions");
    render(
      <AppProviders runtime={{ backend: runtime.backend, backendForRole: runtime.backendForRole, buildProfile: "demo", environmentLabel: "Test", subjectId: "USR-MANAGER-NORA" }}>
        <ScenarioProvider><MemoryRouter initialEntries={["/department-manager/evidence/FND-CAB-2026-001"]}><AppRouter /></MemoryRouter></ScenarioProvider>
      </AppProviders>,
    );

    expect(await screen.findByTestId("evidence-review-target")).toBeVisible();
    expect(screen.getByTestId("application-shell")).toHaveAttribute("data-active-role", "manager");
    expect(screen.getByRole("link", { name: "Findings Review" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Evidence Review" })).not.toBeInTheDocument();
    expect(document.querySelector(".evidence-root-page")).not.toHaveTextContent("Lead Inspector workspace");
    expect(managerListVersions).toHaveBeenCalledWith({ findingId: "FND-CAB-2026-001" });
  });

  it("keeps a Lead subject direct-load of ui-audit-044 on the Manager route authority", async () => {
    const runtime = createMockBackendRuntime();
    await seedVisualRuntimeForPath(runtime, "/department-manager/evidence/FND-CAB-2026-001");
    const managerListVersions = vi.spyOn(runtime.backendForRole("manager").evidence, "listVersions");
    const leadListVersions = vi.spyOn(runtime.backendForRole("leadInspector").evidence, "listVersions");
    render(
      <AppProviders runtime={{ backend: runtime.backend, backendForRole: runtime.backendForRole, buildProfile: "demo", environmentLabel: "Test", subjectId: "USR-LEAD-CANER" }}>
        <ScenarioProvider><MemoryRouter initialEntries={["/department-manager/evidence/FND-CAB-2026-001"]}><AppRouter /></MemoryRouter></ScenarioProvider>
      </AppProviders>,
    );

    expect(await screen.findByTestId("evidence-review-target")).toBeVisible();
    expect(screen.getByTestId("application-shell")).toHaveAttribute("data-active-role", "manager");
    expect(managerListVersions).toHaveBeenCalledWith({ findingId: "FND-CAB-2026-001" });
    expect(leadListVersions).not.toHaveBeenCalled();
  });
});
