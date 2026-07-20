// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "./providers";
import { createRoleEntryPath, ROLE_ENTRIES, RoleEntryPlaceholder } from "./router";
import { createMockBackend } from "../mock/create-mock-backend";

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

  it("renders an honest placeholder for a ledger-classified entry", () => {
    render(
      <AppProviders
        runtime={{
          backend: createMockBackend(),
          buildProfile: "demo",
          environmentLabel: "Test",
        }}
      >
        <MemoryRouter>
          <RoleEntryPlaceholder entry={ROLE_ENTRIES[4]} />
        </MemoryRouter>
      </AppProviders>,
    );
    expect(screen.getByRole("heading", { name: "Finance Review" })).toBeInTheDocument();
    expect(screen.getByText(/candidate React entry route/i)).toBeInTheDocument();
  });
});
