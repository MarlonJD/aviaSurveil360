import { expect, test, type Page } from "@playwright/test";

import {
  expectCanonicalScenarioTranscript,
  type CanonicalScenarioTranscript,
} from "./support/scenario-transcript";

async function submitEvidence(page: Page, version: number, fileName: string): Promise<void> {
  await page.getByTestId("evidence-file").setInputFiles({
    name: fileName,
    mimeType: "application/pdf",
    buffer: Buffer.from(`%PDF-1.7\n1 0 obj\n<</Type/Catalog/Version(${version})>>\nendobj\n%%EOF\n`),
  });
  await expect(page.getByTestId("selected-evidence-file")).toHaveText(fileName);
  await page.getByRole("button", { name: "Submit Evidence version" }).click();
  await expect(page.getByTestId("evidence-version-count")).toHaveText(String(version));
}

async function recordEvidenceDecision(
  page: Page,
  decision: "PARTIALLY_CLOSE" | "NOT_CLOSE" | "CLOSE",
  publicComment: string,
  internalNote: string,
): Promise<void> {
  await page.getByLabel("Evidence review decision").selectOption(decision);
  await page.getByLabel("Comment to Auditee").fill(publicComment);
  await page.getByLabel("Internal CAA Note").fill(internalNote);
  await page.getByRole("button", { name: "Record Evidence review" }).click();
}

test.beforeEach(async ({ request }, testInfo) => {
  if (testInfo.project.name !== "http") return;
  const apiURL = process.env.AVIA_HTTP_API_URL ?? "http://127.0.0.1:58081";
  const token = process.env.AVIA_CANONICAL_TEST_TOKEN ?? "";
  const response = await request.post(`${apiURL}/__test/reset`, {
    headers: { "x-avia-test-token": token },
  });
  expect(response.ok()).toBe(true);
});

test("canonical Cabin Inspection lifecycle is backend-shaped and organization-safe", async ({
  page,
}, testInfo) => {
  const consoleIssues: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleIssues.push(`pageerror: ${error.message}`));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "AviaSurveil360" })).toBeVisible();
  await expect(page.getByRole("link", { name: /CAA Inspector/i })).toBeVisible();
  await page.getByRole("link", { name: /CAA Inspector/i }).click();

  await expect(page).toHaveURL(/\/inspector\/inspector-assignments$/);
  await expect(page.getByRole("heading", { name: "My Assignments" })).toBeVisible();
  await expect(page.getByText("2026 Cabin Inspection - Fly Namibia")).toBeVisible();
  await page.getByRole("link", { name: "Open Cabin Inspection" }).click();

  await expect(page.getByTestId("audit-id")).toHaveText("AUD-2026-001");
  await page.getByRole("link", { name: "Run Cabin checklist" }).click();
  await expect(page.getByRole("heading", { name: "Cabin Inspection checklist" })).toBeVisible();
  await expect(page.getByTestId("checklist-question-row")).toHaveCount(6);
  await expect(page.getByTestId("question-CAB-GALLEY-001")).toContainText(
    "Assigned to another Inspector — read-only",
  );

  await page.getByTestId("question-CAB-EMEQ-PBE-001").click();
  await page.getByLabel("Checklist answer").selectOption("NON_COMPLIANT");
  await page
    .getByLabel("Inspector comment")
    .fill("PBE serviceability and accessibility could not be confirmed for this Audit.");
  await page.getByRole("button", { name: "Save response" }).click();
  await expect(page.getByTestId("response-status")).toHaveText("NON_COMPLIANT");
  await page.getByRole("button", { name: "Create Potential Finding" }).click();
  await expect(page.getByTestId("potential-finding-id")).toHaveText("PF-2026-001");
  await expect(page.getByTestId("potential-finding-status")).toHaveText(
    "PENDING_LEAD_REVIEW",
  );
  await expect(page.getByTestId("active-role")).toHaveText("CAA Inspector");
  await page.getByRole("button", { name: "Submit checklist to Lead Inspector" }).click();
  await expect(page.getByTestId("checklist-status")).toHaveText("SUBMITTED");
  await page.getByRole("link", { name: "Switch to Lead Inspector" }).click();

  await expect(page).toHaveURL(/\/lead-inspector\/lead-review$/);
  await expect(page.getByText("PF-2026-001")).toBeVisible();
  await page.getByLabel("Finding severity").selectOption("LEVEL_1_CRITICAL");
  await expect(page.getByLabel("CAP required")).toBeChecked();
  await expect(page.getByLabel("Evidence required")).toBeChecked();
  await page.getByRole("button", { name: "Convert to Finding" }).click();
  await expect(page.getByTestId("finding-number")).toHaveText("CAB-2026-001");
  await expect(page.getByTestId("finding-status")).toHaveText("WAITING_FOR_CAP");
  await page.getByRole("link", { name: "Open Finding dossier" }).click();

  for (const expected of [
    "Fly Namibia",
    "AUD-2026-001",
    "Level 1 Critical",
    "Auditee to submit CAP",
    "15 Jul 2026",
  ]) {
    await expect(page.getByTestId("finding-dossier")).toContainText(expected);
  }
  await page.getByRole("link", { name: "Switch to Fly Namibia Auditee" }).click();

  await expect(page).toHaveURL(/\/auditee\/service-provider-cap$/);
  await expect(page.getByRole("heading", { name: "Corrective Actions (CAP)" })).toBeVisible();
  await expect(page.getByTestId("auditee-scope")).toHaveText("Fly Namibia only");
  await expect(page.locator("body")).not.toContainText("SkyCargo Air");
  await expect(page.locator("body")).not.toContainText("Internal CAA Note");
  await page
    .getByLabel("Root cause")
    .fill(
      "Pre-flight cabin equipment serviceability checks did not reconcile the PBE position with the deferred defect list.",
    );
  await page
    .getByLabel("Corrective action")
    .fill(
      "Replace or service the affected PBE, update the cabin defect record, and confirm serviceability before release.",
    );
  await page
    .getByLabel("Preventive action")
    .fill(
      "Add a supervisor review of emergency equipment checks and monthly sampling of PBE serviceability records.",
    );
  await page.getByLabel("Responsible person").fill("Fly Namibia Cabin Safety Manager");
  await page.getByLabel("Target completion date").fill("2026-07-15");
  await page.getByLabel("Comment to CAA").fill("CAP submitted for CAA review.");
  await page.getByRole("button", { name: "Submit CAP" }).click();
  await expect(page.getByTestId("finding-status")).toHaveText("CAP_SUBMITTED");
  await expect(page.getByRole("button", { name: /Accept CAP/i })).toHaveCount(0);
  await page.getByRole("link", { name: "Switch to CAA CAP Review" }).click();

  await expect(page.getByRole("heading", { name: "CAP Review" })).toBeVisible();
  await page
    .getByLabel("Comment to Auditee")
    .fill("CAP accepted. Submit the required PBE serviceability record.");
  await page
    .getByLabel("Internal CAA Note")
    .fill("CAP actions are credible; Evidence verification remains required.");
  await page.getByRole("button", { name: "Accept CAP" }).click();
  await expect(page.getByTestId("finding-status")).toHaveText("EVIDENCE_REQUIRED");
  await expect(page.getByTestId("closure-state")).toHaveText("Finding remains open");

  await page.getByRole("link", { name: "Check report authority" }).click();
  await expect(page.getByRole("heading", { name: "Executive Director Dashboard" })).toBeVisible();
  await page.getByLabel("Report decision reason").fill("Issue the exact candidate report version.");
  await page.getByRole("button", { name: "Issue and lock report" }).click();
  await expect(page.getByTestId("report-status")).toHaveText("LOCKED");
  await expect(page.getByTestId("report-finding-status")).toHaveText("EVIDENCE_REQUIRED");
  await expect(page.getByText("Report issue did not close the Finding")).toBeVisible();

  await page.getByRole("link", { name: "Open Department Manager dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Department Manager Dashboard" })).toBeVisible();
  await page.getByRole("button", { name: "Use authorized closure" }).click();
  await expect(page.getByRole("alert")).toHaveText("Authorized closure reason is required.");
  await expect(page.getByTestId("manager-canonical-status")).toHaveText("EVIDENCE_REQUIRED");
  await page.getByRole("link", { name: "Return to Fly Namibia Evidence" }).click();

  await submitEvidence(
    page,
    1,
    "Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf",
  );
  await page.getByRole("link", { name: "Switch to Evidence Review" }).click();
  await expect(page.getByTestId("reviewing-evidence-version")).toHaveText("Version 1");
  await recordEvidenceDecision(
    page,
    "PARTIALLY_CLOSE",
    "The serviceability record is accepted; provide cabin position confirmation.",
    "Version 1 covers serviceability but not accessibility.",
  );
  await expect(page.getByTestId("finding-status")).toHaveText(
    "EVIDENCE_MORE_INFORMATION_REQUESTED",
  );
  await expect(page.getByTestId("closure-state")).toHaveText("Finding remains open");

  await page.getByRole("link", { name: "Return to Auditee Evidence" }).click();
  await submitEvidence(
    page,
    2,
    "Fly_Namibia_PBE_Position_Confirmation_CAB-2026-001.pdf",
  );
  await page.getByRole("link", { name: "Switch to Evidence Review" }).click();
  await expect(page.getByTestId("reviewing-evidence-version")).toHaveText("Version 2");
  await recordEvidenceDecision(
    page,
    "NOT_CLOSE",
    "The position image is insufficient; provide the signed cabin record.",
    "Version 2 lacks the signed accountable record.",
  );
  await expect(page.getByTestId("finding-status")).toHaveText(
    "EVIDENCE_MORE_INFORMATION_REQUESTED",
  );
  await expect(page.getByTestId("closure-state")).toHaveText("Finding remains open");

  await page.getByRole("link", { name: "Return to Auditee Evidence" }).click();
  await submitEvidence(page, 3, "Fly_Namibia_PBE_Signed_Record_CAB-2026-001.pdf");
  await page.getByRole("link", { name: "Switch to Evidence Review" }).click();
  await expect(page.getByTestId("reviewing-evidence-version")).toHaveText("Version 3");
  await recordEvidenceDecision(
    page,
    "CLOSE",
    "Evidence accepted and verified.",
    "Version 3 completes the configured PBE verification basis.",
  );
  await expect(page.getByTestId("finding-status")).toHaveText("CLOSED");
  await expect(page.getByTestId("closure-state")).toHaveText("Finding closed");
  await expect(page.getByTestId("closure-basis")).toHaveText("EVIDENCE_VERIFIED");
  await expect(page.getByTestId("evidence-history-row")).toHaveCount(3);

  await page.getByRole("link", { name: "Open updated Manager Dashboard" }).click();
  await expect(page.getByTestId("manager-closed-findings")).toHaveText("1");
  await expect(page.getByTestId("manager-canonical-status")).toHaveText("CLOSED");
  await page.getByRole("link", { name: "Open report preview" }).click();
  await expect(page.getByRole("heading", { name: "Cabin Inspection Report Preview" })).toBeVisible();
  await expect(page.getByTestId("report-status")).toHaveText("LOCKED");
  await expect(page.getByTestId("report-finding-status")).toHaveText("CLOSED");
  await expect(page.getByText("Evidence accepted and verified")).toBeVisible();

  await page.getByRole("link", { name: "View as Fly Namibia Auditee" }).click();
  await expect(page.getByTestId("finding-status")).toHaveText("CLOSED");
  await expect(page.getByTestId("evidence-version-count")).toHaveText("3");
  const finalAuditeeBody = await page.locator("body").innerText();
  const auditeeForbiddenDataPresent = /SkyCargo Air|Internal CAA Note|Inspector workload|internal risk|enforcement deliberation/i.test(
    finalAuditeeBody,
  );
  expect(auditeeForbiddenDataPresent).toBe(false);

  const transcript: CanonicalScenarioTranscript = {
    auditId: "AUD-2026-001",
    questionId: "CAB-EMEQ-PBE-001",
    potentialFindingId: "PF-2026-001",
    findingNumber: "CAB-2026-001",
    afterConversion: "WAITING_FOR_CAP",
    afterCapSubmission: "CAP_SUBMITTED",
    afterCapAcceptance: "EVIDENCE_REQUIRED",
    afterPartialClose: "EVIDENCE_MORE_INFORMATION_REQUESTED",
    afterNotClose: "EVIDENCE_MORE_INFORMATION_REQUESTED",
    afterEvidenceClose: "CLOSED",
    closureBasis: "EVIDENCE_VERIFIED",
    evidenceVersions: 3,
    reportStatus: "LOCKED",
    reportFindingStatus: "EVIDENCE_REQUIRED",
    managerClosedFindings: 1,
    auditeeForbiddenDataPresent,
  };
  expectCanonicalScenarioTranscript(transcript);
  await testInfo.attach("canonical-scenario-transcript", {
    body: JSON.stringify(transcript, null, 2),
    contentType: "application/json",
  });
  expect(consoleIssues).toEqual([]);
});
