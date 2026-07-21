// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { RoleNavigation } from "./role-navigation";

afterEach(() => cleanup());

describe("RoleNavigation", () => {
  it("derives primary navigation from the route registry in order", () => {
    render(
      <MemoryRouter>
        <RoleNavigation activeRole="manager" activeRouteId="manager-home" />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Dashboard",
      "Organizations",
      "Audit Plan Calendar",
    ]);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps contextual detail routes out of primary navigation while activating their parent", () => {
    render(
      <MemoryRouter>
        <RoleNavigation activeRole="inspector" activeRouteId="audit-detail" />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["My Assignments"]);
    expect(screen.queryByRole("link", { name: "Audit Detail" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Assignments" })).toHaveAttribute("aria-current", "page");
  });
});
