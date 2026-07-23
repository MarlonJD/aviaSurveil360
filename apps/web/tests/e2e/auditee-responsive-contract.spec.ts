import { expect, test, type Locator, type Page } from "@playwright/test";

const viewports = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
] as const;

const routes = [
  ["/auditee/service-provider-cap", "auditee-page", "Corrective Actions (CAP)"],
  ["/auditee/inspection-coordination", "auditee-inspection-coordination-page", "Inspection Coordination"],
  ["/auditee/preliminary-reports", "auditee-preliminary-reports-page", "Preliminary Reports"],
  ["/auditee/final-reports", "auditee-final-reports-page", "Final Reports"],
  ["/auditee/reports/RPT-CAB-2026-001", "auditee-report-preview-page", "Final Reports"],
  ["/auditee/messages", "auditee-messages-page", "Messages"],
  ["/auditee/documents", "auditee-documents-page", "Documents"],
  ["/auditee/settings", "auditee-settings-page", "Settings"],
] as const;

async function expectControlBounds(page: Page, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!box || !viewport) return;
  const identity = await target.evaluate((element) => `${element.tagName.toLowerCase()}.${element.className || "no-class"}[${element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 80) ?? "no-label"}]`);
  expect(box.width, identity).toBeGreaterThanOrEqual(44);
  expect(box.height, identity).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(Math.floor(box.x + box.width)).toBeLessThanOrEqual(viewport.width);
}

async function navigation(page: Page, width: number): Promise<Locator> {
  if (width > 900) return page.locator(".workspace-sidebar").getByRole("navigation", { name: "Primary role navigation" });
  await page.getByRole("button", { name: "Open navigation" }).click();
  return page.locator(".mobile-navigation__drawer").getByRole("navigation", { name: "Primary role navigation" });
}

for (const viewport of viewports) {
  test(`keeps the complete Auditee portal safe and usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.evaluate(() => localStorage.clear()).catch(() => undefined);

    for (const [path, testId, activeLabel] of routes) {
      await page.goto(path);
      const routePage = page.getByTestId(testId);
      await expect(routePage).toBeVisible();
      await expect(routePage).not.toContainText(/Internal CAA Note|inspector workload|risk score|enforcement deliberation|ORG-SKYCARGO|SkyCargo Air|noticeWithheld|UNANNOUNCED/i);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const enabled = routePage.locator("a[href]:visible, button:not(:disabled):visible, input:not(:disabled):visible, select:not(:disabled):visible, textarea:not(:disabled):visible");
      for (let index = 0; index < await enabled.count(); index += 1) await expectControlBounds(page, enabled.nth(index));
      const primary = await navigation(page, viewport.width);
      await expect(primary.getByRole("link", { name: activeLabel })).toHaveAttribute("aria-current", "page");
      await expect(primary.locator("a[aria-current='page']")).toHaveCount(1);
      if (viewport.width <= 900) {
        await primary.getByRole("link", { name: activeLabel }).click();
        await expect(page.getByRole("dialog", { name: "Primary navigation" })).toBeHidden();
      }
    }

    await page.goto("/auditee/inspection-coordination");
    const coordination = page.getByTestId("auditee-inspection-coordination-page");
    await expect(coordination).toContainText("2026");
    await coordination.getByLabel("Alternative date").fill("2026-06-22");
    await coordination.getByRole("button", { name: "Propose Alternative Date" }).click();
    await expect(coordination.getByRole("status")).toContainText("AUD-2026-001 alternative date 2026-06-22 submitted to CAA");
    await page.reload();
    await expect(page.getByTestId("auditee-inspection-coordination-page")).toContainText("ALTERNATIVE_PROPOSED");
    await expect(page.getByTestId("auditee-inspection-coordination-page")).toContainText("22 Jun 2026");

    await page.goto("/department-manager/preliminary-reports/PR-2026-018");
    const departmentReport = page.getByTestId("manager-preliminary-review-page");
    await departmentReport.getByLabel("Department Manager decision reason").fill("Exact Preliminary Report version approved for General Manager review.");
    await departmentReport.getByRole("button", { name: "Forward PR-2026-018-V1 to General Manager" }).click();
    await expect(departmentReport.getByTestId("manager-preliminary-status")).toHaveText("GM_REVIEW");

    await page.goto("/general-manager/report-approvals");
    const generalManagerReport = page.getByRole("region", { name: "Selected report PR-2026-018-V1" });
    await generalManagerReport.getByLabel("General Manager report decision reason").fill("Exact Preliminary Report version approved for Executive Director review.");
    await generalManagerReport.getByRole("button", { name: "Forward PR-2026-018-V1 to Executive Director" }).click();
    await expect(generalManagerReport.getByTestId("report-status")).toHaveText("EXECUTIVE_DIRECTOR_REVIEW");

    await page.goto("/executive-director/preliminary-reports");
    const executivePreliminary = page.getByRole("region", { name: "Selected Preliminary Report PR-2026-018-V1" });
    await executivePreliminary.getByLabel("Executive Director report decision reason").fill("Issue and lock the exact Preliminary Report version for Fly Namibia.");
    await executivePreliminary.getByRole("button", { name: "Issue and lock PR-2026-018-V1" }).click();
    await expect(executivePreliminary.getByTestId("report-status")).toHaveText("LOCKED");

    await page.goto("/executive-director/final-reports");
    const executiveFinal = page.getByRole("region", { name: "Selected Final Report RPT-CAB-2026-001-V1" });
    await executiveFinal.getByLabel("Executive Director report decision reason").fill("Issue and lock the exact Final Report version for Fly Namibia.");
    await executiveFinal.getByRole("button", { name: "Issue and lock RPT-CAB-2026-001-V1" }).click();
    await expect(executiveFinal.getByTestId("report-status")).toHaveText("LOCKED");

    await page.goto("/auditee/preliminary-reports");
    const preliminary = page.getByTestId("auditee-preliminary-reports-page");
    await expect(preliminary).toContainText("PR-2026-018-V1");
    await expect(preliminary).toContainText("Response Due Date: Not configured");
    await expect(preliminary).toContainText("CAA-visible comment: No CAA-visible comment recorded");
    const previewButton = viewport.width <= 640
      ? preliminary.getByRole("button", { name: "Preview mobile PR-2026-018-V1" })
      : preliminary.getByRole("button", { name: "Preview PR-2026-018-V1" });
    await previewButton.click();
    await expect(preliminary.getByRole("region", { name: "Preliminary Report preview PR-2026-018-V1" })).toBeVisible();

    await page.goto("/auditee/reports/RPT-CAB-2026-001");
    const report = page.getByTestId("auditee-report-preview-page");
    await expect(report).toContainText("No Findings linked — relationship unavailable for RPT-CAB-2026-001-V1");
    await report.getByRole("link", { name: "Findings Overview" }).click();
    await expect(page).toHaveURL(/#auditee-report-findings$/);
    const reportDownload = page.waitForEvent("download");
    await report.getByRole("button", { name: "Download RPT-CAB-2026-001-V1" }).click();
    expect((await reportDownload).suggestedFilename()).toBe("RPT-CAB-2026-001.pdf");

    await page.goto("/auditee/messages");
    const messages = page.getByTestId("auditee-messages-page");
    await messages.getByRole("button", { name: "Compose message to CAA" }).click();
    await messages.getByLabel("Subject").fill("Inspection access details");
    await messages.getByLabel("Message").fill("Fly Namibia will provide the requested access details.");
    await messages.getByRole("button", { name: "Send in-app message" }).click();
    await expect(messages).toContainText("Inspection access details");
    await page.reload();
    await expect(page.getByTestId("auditee-messages-page")).toContainText("Inspection access details");

    await page.goto("/auditee/documents");
    const documents = page.getByTestId("auditee-documents-page");
    await expect(documents).toContainText("RPT-CAB-2026-001-V1");
    await expect(documents.locator("tbody tr")).toHaveCount(2);
    await expect(documents.locator("tbody")).toContainText("RELEASED");
    const documentDownload = page.waitForEvent("download");
    await documents.getByRole("button", { name: "Download RPT-CAB-2026-001-V1" }).click();
    expect((await documentDownload).suggestedFilename()).toBe("RPT-CAB-2026-001.pdf");

    await page.goto("/auditee/settings");
    const settings = page.getByTestId("auditee-settings-page");
    await settings.getByRole("button", { name: "Edit profile" }).click();
    await settings.getByLabel("Display name").fill("Fly Namibia Quality Lead");
    await settings.getByRole("button", { name: "Save profile" }).click();
    await page.reload();
    await expect(page.getByTestId("auditee-settings-page")).toContainText("Fly Namibia Quality Lead");
    await expect(page.getByRole("checkbox", { name: "Due Date reminders" })).toBeDisabled();
  });
}
