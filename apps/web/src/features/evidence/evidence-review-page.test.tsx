// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { MemoryRouter } from "react-router-dom";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppProviders } from "../../app/providers";
import { ScenarioProvider } from "../../app/scenario-context";
import type { FindingView } from "../../backend/backend";
import { createMockBackendRuntime } from "../../mock/create-mock-backend";
import { EvidenceReviewPage } from "./evidence-review-page";

afterEach(cleanup);

type MockRuntime = ReturnType<typeof createMockBackendRuntime>;

async function seedFinding(runtime: MockRuntime): Promise<FindingView> {
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

async function submitEvidenceVersion(runtime: MockRuntime, finding: FindingView, fileName: string) {
  const auditee = runtime.backendForRole("auditee");
  const upload = await auditee.evidence.beginUpload({
    operationId: `OP-TEST-EVIDENCE-BEGIN-${fileName}`,
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    fileName,
    declaredMediaType: "application/pdf",
    byteSize: 12,
    sha256: `sha256:${fileName}`,
  });
  await auditee.evidence.completeUpload({
    operationId: `OP-TEST-EVIDENCE-COMPLETE-${fileName}`,
    uploadId: upload.uploadId,
    sha256: `sha256:${fileName}`,
    byteSize: 12,
  });
  return runtime.backendForRole("leadInspector").findings.get({ findingId: finding.id });
}

async function seedEvidenceVersions(runtime: MockRuntime) {
  const lead = runtime.backendForRole("leadInspector");
  const auditee = runtime.backendForRole("auditee");
  let finding = await seedFinding(runtime);
  const cap = await auditee.caps.submit({
    operationId: "OP-TEST-CAP",
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    rootCause: "Root cause ready for evidence.",
    correctiveAction: "Replace affected PBE.",
    preventiveAction: "Monthly PBE sampling.",
    responsiblePerson: "Fly Namibia Cabin Safety Manager",
    targetCompletionDate: "2026-07-15",
    commentToCaa: "CAP submitted for CAA review.",
  });
  finding = await lead.findings.get({ findingId: finding.id });
  await lead.caps.review({
    operationId: "OP-TEST-CAP-ACCEPT",
    capRevisionId: cap.capRevisionId,
    expectedCapRevision: cap.capRevision,
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    decision: "ACCEPT",
    commentToAuditee: "CAP accepted. Submit evidence.",
    internalCaaNote: "Evidence verification remains required.",
  });
  finding = await lead.findings.get({ findingId: finding.id });
  finding = await submitEvidenceVersion(
    runtime,
    finding,
    "Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf",
  );
  const firstVersion = (await lead.evidence.listVersions({ findingId: finding.id })).at(-1);
  if (!firstVersion) throw new Error("Expected first Evidence version.");
  await lead.evidence.review({
    operationId: "OP-TEST-EVIDENCE-V1-REVIEW",
    evidenceVersionId: firstVersion.id,
    expectedEvidenceVersionRevision: firstVersion.revision,
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    decision: "PARTIALLY_CLOSE",
    commentToAuditee: "Serviceability accepted; provide cabin position confirmation.",
    internalCaaNote: "Version 1 does not verify accessibility.",
  });
  finding = await lead.findings.get({ findingId: finding.id });
  finding = await submitEvidenceVersion(
    runtime,
    finding,
    "Fly_Namibia_PBE_Position_Confirmation_CAB-2026-001.pdf",
  );
  return finding;
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
        <MemoryRouter initialEntries={["/lead-inspector/evidence-review/FND-CAB-2026-001"]}>
          <EvidenceReviewPage />
        </MemoryRouter>
      </ScenarioProvider>
    </AppProviders>,
  );
}

describe("EvidenceReviewPage", () => {
  it("direct-loads Finding plus immutable Evidence versions and requires public review reasons", async () => {
    const runtime = createMockBackendRuntime();
    await seedEvidenceVersions(runtime);
    const leadEvidence = runtime.backendForRole("leadInspector").evidence;
    const listSpy = vi.spyOn(leadEvidence, "listVersions");

    renderPage(runtime);

    expect(await screen.findByTestId("reviewing-evidence-version")).toHaveTextContent("Version 2");
    expect(listSpy).toHaveBeenCalledWith({ findingId: "FND-CAB-2026-001" });
    const history = screen.getByRole("list", { name: "Evidence version history" });
    expect(within(history).getAllByTestId("evidence-history-row")).toHaveLength(2);
    expect(within(history).getByText("Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf")).toBeVisible();
    expect(within(history).getByText("PARTIALLY_ACCEPTED")).toBeVisible();
    expect(within(history).getByText("Fly_Namibia_PBE_Position_Confirmation_CAB-2026-001.pdf")).toBeVisible();

    await userEvent.selectOptions(screen.getByLabelText("Evidence review decision"), "REQUEST_MORE_INFORMATION");
    await userEvent.click(screen.getByRole("button", { name: "Record Evidence review" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Comment to Auditee is required");

    await userEvent.selectOptions(screen.getByLabelText("Evidence review decision"), "CLOSE");
    await userEvent.type(screen.getByLabelText("Comment to Auditee"), "Evidence accepted and verified.");
    await userEvent.type(
      screen.getByLabelText("Internal CAA Note"),
      "Version 2 completes the configured PBE verification basis.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Record Evidence review" }));

    expect(await screen.findByTestId("finding-status")).toHaveTextContent("CLOSED");
    expect(screen.getByTestId("closure-state")).toHaveTextContent("Finding closed");
    expect(screen.getByTestId("closure-basis")).toHaveTextContent("EVIDENCE_VERIFIED");
  });
});
