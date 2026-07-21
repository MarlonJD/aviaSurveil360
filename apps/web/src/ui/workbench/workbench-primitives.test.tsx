// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataRegister } from "./data-register";
import { DecisionPanel } from "./decision-panel";
import { DueState } from "./due-state";
import { EmptyErrorState } from "./empty-error-state";
import { FactGrid } from "./fact-grid";
import { LifecycleStepper } from "./lifecycle-stepper";
import { PageHeader } from "./page-header";
import { StatusPill } from "./status-pill";

afterEach(cleanup);

describe("oversight workbench primitives", () => {
  it("renders a page header with purpose, action, and required operational context", () => {
    render(
      <PageHeader
        eyebrow="Inspector workbench"
        title="Cabin Inspection"
        description="Review the assigned package before checklist execution."
        primaryAction={<button type="button">Run checklist</button>}
        facts={[
          { label: "Owner", value: "CAA Inspector" },
          { label: "Next action", value: "Run assigned Cabin checklist" },
          { label: "Status", value: "In progress" },
          { label: "Due Date", value: "15 Jul 2026" },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Cabin Inspection" })).toBeVisible();
    expect(screen.getByText("Review the assigned package before checklist execution.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Run checklist" })).toBeVisible();
    const facts = screen.getByTestId("page-header-facts");
    expect(within(facts).getAllByRole("term").map((term) => term.textContent)).toEqual([
      "Owner",
      "Next action",
      "Status",
      "Due Date",
    ]);
  });

  it("keeps fact grids semantic and in caller-defined order", () => {
    render(
      <FactGrid
        items={[
          { label: "Organization", value: "Fly Namibia" },
          { label: "Finding", value: "OPS-2026-001" },
          { label: "Due Date", value: "22 Jul 2026" },
        ]}
      />,
    );

    expect(screen.getAllByRole("definition")[0]).toBeVisible();
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual([
      "Organization",
      "Finding",
      "Due Date",
    ]);
    expect(screen.getAllByRole("definition").map((definition) => definition.textContent)).toEqual([
      "Fly Namibia",
      "OPS-2026-001",
      "22 Jul 2026",
    ]);
  });

  it("renders register tables and mobile record cards without dropping decision fields", () => {
    render(
      <DataRegister
        caption="CAP revisions"
        columns={[
          { key: "revision", header: "Revision" },
          { key: "owner", header: "Owner" },
          { key: "decision", header: "Decision" },
        ]}
        rows={[
          { id: "CAP-REV-1", revision: "1", owner: "Fly Namibia", decision: "Needs CAA review" },
        ]}
        rowKey={(row) => row.id}
      />,
    );

    const table = screen.getByRole("table", { name: "CAP revisions" });
    expect(within(table).getByRole("columnheader", { name: "Decision" })).toBeVisible();
    expect(within(table).getByRole("cell", { name: "Needs CAA review" })).toBeVisible();
    const card = screen.getByRole("article", { name: /CAP-REV-1/i });
    expect(within(card).getByText("Decision")).toBeVisible();
    expect(within(card).getByText("Needs CAA review")).toBeVisible();
  });

  it("marks only the explicit lifecycle stage current and does not close from CAP acceptance", () => {
    render(
      <LifecycleStepper
        ariaLabel="Finding lifecycle"
        currentStageId="cap-accepted"
        stages={[
          { id: "finding", label: "Finding issued" },
          { id: "cap-accepted", label: "CAP accepted" },
          { id: "closed", label: "Finding closed" },
        ]}
      />,
    );

    expect(screen.getByRole("list", { name: "Finding lifecycle" })).toBeVisible();
    expect(screen.getByText("CAP accepted").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Finding closed").closest("li")).toHaveAttribute("data-state", "pending");
  });

  it("requires authorized decision handlers or disabled reasons and prevents pending repeat submits", async () => {
    expect(() =>
      render(
        <DecisionPanel
          title="CAA decision"
          actions={[{ id: "approve", label: "Approve CAP" }]}
        />,
      ),
    ).toThrow(/handler or disabled reason/i);

    const submit = vi.fn();
    render(
      <DecisionPanel
        title="CAA decision"
        actions={[
          { id: "accept", label: "Accept evidence", onSelect: submit, pending: true },
          { id: "request", label: "Request more information", disabledReason: "Auditee evidence is missing." },
        ]}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Accept evidence" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Accept evidence" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Request more information/ })).toBeDisabled();
    expect(screen.getByText("Auditee evidence is missing.")).toBeVisible();
  });

  it("uses literal Due Date, Due Soon, and Overdue language", () => {
    render(
      <>
        <DueState dueDate="2026-07-21" today="2026-07-21" />
        <DueState dueDate="2026-07-24" today="2026-07-21" />
        <DueState dueDate="2026-07-20" today="2026-07-21" />
      </>,
    );

    expect(screen.getByText(/Due Date: 21 Jul 2026/)).toBeVisible();
    expect(screen.getByText(/Due Soon: 24 Jul 2026/)).toBeVisible();
    expect(screen.getByText(/Overdue: 20 Jul 2026/)).toBeVisible();
  });

  it("gives status pills text, icon, and an accessible name", () => {
    render(<StatusPill tone="warning" label="Due Soon" />);

    expect(screen.getByRole("status", { name: "Status: Due Soon" })).toBeVisible();
    expect(screen.getByText("Due Soon")).toBeVisible();
  });

  it("preserves page identity for empty, loading, and error states", () => {
    render(
      <>
        <EmptyErrorState kind="empty" pageTitle="Evidence Review" title="No evidence submitted" />
        <EmptyErrorState kind="loading" pageTitle="CAP Review" title="Loading CAP package" />
        <EmptyErrorState kind="error" pageTitle="Audit Detail" title="Could not load audit" />
      </>,
    );

    expect(screen.getByRole("heading", { name: "Evidence Review: No evidence submitted" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "CAP Review: Loading CAP package" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Audit Detail: Could not load audit" })).toBeVisible();
  });
});
