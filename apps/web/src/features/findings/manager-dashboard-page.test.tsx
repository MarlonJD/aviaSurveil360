// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { AppProviders } from "../../app/providers";
import { ScenarioProvider } from "../../app/scenario-context";
import { createMockBackendRuntime } from "../../mock/create-mock-backend";
import { ManagerDashboardPage } from "./manager-dashboard-page";

afterEach(cleanup);

function renderPage() {
  const runtime = createMockBackendRuntime();
  render(
    <AppProviders
      runtime={{
        backend: runtime.backend,
        backendForRole: runtime.backendForRole,
        buildProfile: "demo",
        environmentLabel: "test",
        identityMode: "demo-role-switch",
        subjectId: "USR-MANAGER-MEHMET",
      }}
    >
      <ScenarioProvider>
        <MemoryRouter initialEntries={["/department-manager/dashboard"]}>
          <ManagerDashboardPage />
        </MemoryRouter>
      </ScenarioProvider>
    </AppProviders>,
  );
  return runtime;
}

describe("ManagerDashboardPage", () => {
  it("direct-loads the accepted attention hierarchy with advisory management indicators", async () => {
    const runtime = renderPage();

    expect(await screen.findByRole("heading", { name: "Department Manager Dashboard" })).toBeVisible();
    const indicators = screen.getByRole("region", { name: "Management indicators" });
    expect(within(indicators).getAllByRole("article")).toHaveLength(6);
    expect(screen.getByRole("heading", { name: "What needs attention?" })).toBeVisible();
    expect(screen.getByRole("table", { name: "Priority Findings" })).toBeVisible();
    expect(screen.getByRole("table", { name: "Upcoming Surveillance" })).toBeVisible();
    expect(screen.getByText(/Oversight Health Index is advisory/i)).toBeVisible();
    expect(screen.getByText(/does not trigger automatic legal, enforcement, certificate, or Finding-closure decisions/i)).toBeVisible();

    await expect(runtime.backendForRole("finance").dashboards.getManagerProjection({})).rejects.toThrow(
      /management authority/i,
    );
  });

  it("keeps the manager workspace controls on real registered routes", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "What needs attention?" });

    expect(screen.getByRole("link", { name: "Open Planning" })).toHaveAttribute(
      "href",
      "/department-manager/audit-plan",
    );
    expect(screen.getByRole("link", { name: "Open Organizations" })).toHaveAttribute(
      "href",
      "/department-manager/organizations",
    );
    expect(screen.queryByRole("button", { name: /automatic enforcement/i })).toBeNull();
  });
});
