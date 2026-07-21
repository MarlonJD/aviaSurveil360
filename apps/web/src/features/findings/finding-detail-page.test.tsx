// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { MemoryRouter } from "react-router-dom";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AppProviders } from "../../app/providers";
import { ScenarioProvider } from "../../app/scenario-context";
import { createMockBackendRuntime } from "../../mock/create-mock-backend";
import { FindingDetailPage } from "./finding-detail-page";

afterEach(cleanup);

type MockRuntime = ReturnType<typeof createMockBackendRuntime>;

async function seedFinding(runtime: MockRuntime) {
  const inspector = runtime.backendForRole("inspector");
  const packageView = await inspector.inspections.getPackage({ packageId: "PKG-CAB-2026-001" });
  const response = await inspector.inspections.upsertChecklistResponse({
    operationId: "OP-TEST-RESPONSE",
    responseId: "RESP-CAB-EMEQ-PBE-001",
    auditId: "AUD-2026-001",
    questionId: "CAB-EMEQ-PBE-001",
    expectedResponseRevision: null,
    answer: "NON_COMPLIANT",
    comment: "PBE serviceability and accessibility could not be confirmed.",
  });
  const potentialFinding = await inspector.potentialFindings.create({
    operationId: "OP-TEST-PF",
    auditId: "AUD-2026-001",
    questionId: "CAB-EMEQ-PBE-001",
    checklistResponseId: response.id,
    expectedChecklistResponseRevision: response.revision,
    title: "PBE serviceability and accessibility not confirmed",
    description: "The configured cabin check could not confirm PBE serviceability.",
    requiredComment: response.comment,
    inspectionAttachmentIds: [],
  });
  await inspector.inspections.submitChecklist({
    operationId: "OP-TEST-CHECKLIST",
    auditId: packageView.auditId,
    expectedChecklistRevision: packageView.checklistRevision,
  });
  const result = await runtime.backendForRole("leadInspector").potentialFindings.decide({
    operationId: "OP-TEST-CONVERT",
    potentialFindingId: potentialFinding.id,
    expectedPotentialFindingRevision: potentialFinding.revision,
    decision: "CONVERT",
    severity: "LEVEL_1_CRITICAL",
    capRequired: true,
    evidenceRequired: true,
    dueDate: "2026-07-15",
  });
  if (!result.finding) throw new Error("Expected seeded Finding.");
  return result.finding;
}

function renderPage(runtime: MockRuntime) {
  render(
    <AppProviders
      runtime={{
        backend: runtime.backend,
        backendForRole: runtime.backendForRole,
        buildProfile: "demo",
        environmentLabel: "test",
        identityMode: "demo-role-switch",
        subjectId: "USR-LEAD-CANER",
      }}
    >
      <ScenarioProvider>
        <MemoryRouter initialEntries={["/lead-inspector/findings/FND-CAB-2026-001"]}>
          <FindingDetailPage />
        </MemoryRouter>
      </ScenarioProvider>
    </AppProviders>,
  );
}

describe("FindingDetailPage", () => {
  it("direct-loads the canonical finding dossier, lifecycle, basis, and bounded Auditee handoff", async () => {
    const runtime = createMockBackendRuntime();
    await seedFinding(runtime);

    renderPage(runtime);

    const dossier = await screen.findByTestId("finding-dossier");
    expect(within(dossier).getAllByText("CAB-2026-001").length).toBeGreaterThanOrEqual(1);
    expect(within(dossier).getAllByText("WAITING_FOR_CAP").length).toBeGreaterThanOrEqual(1);
    for (const expected of [
      "Fly Namibia",
      "AUD-2026-001",
      "Level 1 Critical",
      "Due Date: 15 Jul 2026",
      "Non-Compliant response and required Inspector comment for CAB-EMEQ-PBE-001",
      "Auditee to submit CAP",
    ]) {
      expect(within(dossier).getByText(expected)).toBeVisible();
    }
    expect(within(dossier).getByText(/Configured Cabin Inspection reference/)).toBeVisible();
    expect(screen.getByRole("list", { name: "Finding lifecycle" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Switch to Fly Namibia Auditee" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Switch to Fly Namibia Auditee" })).toBeNull();
  });
});
