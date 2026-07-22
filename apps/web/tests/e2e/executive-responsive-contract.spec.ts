import { expect, test, type Locator, type Page } from "@playwright/test";

const viewports = [
  { id: "desktop", width: 1440, height: 900 },
  { id: "tablet", width: 1024, height: 768 },
  { id: "mobile", width: 390, height: 844 },
] as const;

const taskEightRoutes = [
  ["/general-manager/planning", "gm-planning-page", "Planning"],
  ["/general-manager/report-approvals", "gm-report-approvals-page", "Report Approvals"],
  ["/general-manager/departments", "gm-departments-page", "Departments"],
  ["/general-manager/risk-dashboard", "gm-risk-dashboard-page", "Risk Dashboard"],
  ["/general-manager/settings", "gm-settings-page", "Settings"],
  ["/executive-director/planning", "executive-planning-page", "Planning"],
  ["/executive-director/preliminary-reports", "executive-preliminary-reports-page", "Preliminary Reports"],
  ["/executive-director/final-reports", "executive-final-reports-page", "Final Reports"],
  ["/executive-director/reports/RPT-CAB-2026-001", "executive-report-preview-page", "Final Reports"],
  ["/executive-director/notifications", "executive-notifications-page", "Notifications"],
  ["/executive-director/settings", "executive-settings-page", "Settings"],
] as const;

async function expectInsideViewport(page: Page, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!box || !viewport) return;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(Math.floor(box.x + box.width)).toBeLessThanOrEqual(viewport.width);
  expect(Math.floor(box.y + box.height)).toBeLessThanOrEqual(viewport.height);
}

async function primaryNavigation(page: Page, width: number): Promise<Locator> {
  if (width > 900) return page.locator(".workspace-sidebar").getByRole("navigation", { name: "Primary role navigation" });
  const opener = page.getByRole("button", { name: "Open navigation" });
  await opener.click();
  await expect(opener).toHaveAttribute("aria-expanded", "true");
  return page.locator(".mobile-navigation__drawer").getByRole("navigation", { name: "Primary role navigation" });
}

for (const viewport of viewports) {
  test(`keeps General Manager and Executive Director governance usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);

    for (const [route, testId, activeLabel] of taskEightRoutes) {
      await page.goto(route);
      const routePage = page.getByTestId(testId);
      await expect(routePage).toBeVisible();
      const enabledControls = routePage.locator("a[href]:visible, button:not(:disabled):visible, input:not(:disabled):visible, select:not(:disabled):visible, textarea:not(:disabled):visible");
      for (let index = 0; index < await enabledControls.count(); index += 1) {
        await expectInsideViewport(page, enabledControls.nth(index));
      }
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const navigation = await primaryNavigation(page, viewport.width);
      await expect(navigation.getByRole("link", { name: activeLabel })).toHaveAttribute("aria-current", "page");
      await expect(navigation.locator("a[aria-current='page']")).toHaveCount(1);
      if (viewport.width <= 900) await page.keyboard.press("Escape");
    }

    await page.evaluate(() => localStorage.clear());
    await page.goto("/general-manager/planning");
    const gmPlanning = page.getByTestId("gm-planning-page");
    await expect(gmPlanning.getByTestId("planning-status")).toHaveText("GM_REVIEW");
    await gmPlanning.getByLabel("General Manager decision reason").fill("Operational scope and Finance review confirmed.");
    const forwardPlan = gmPlanning.getByRole("button", { name: "Forward PLAN-2026-CAB-001 to Executive Director" });
    await expectInsideViewport(page, forwardPlan);
    await forwardPlan.click();
    await expect(gmPlanning.getByTestId("planning-status")).toHaveText("EXECUTIVE_DIRECTOR_REVIEW");

    await page.goto("/general-manager/report-approvals");
    const gmReport = page.getByRole("region", { name: "Selected report PR-2026-018-V1" });
    await expect(gmReport).toHaveAttribute("data-report-revision", "2");
    await gmReport.getByLabel("General Manager report decision reason").fill("Exact immutable Preliminary Report version reviewed.");
    await gmReport.getByRole("button", { name: "Forward PR-2026-018-V1 to Executive Director" }).click();
    await expect(gmReport.getByTestId("report-status")).toHaveText("EXECUTIVE_DIRECTOR_REVIEW");

    await page.goto("/executive-director/planning");
    const executivePlanning = page.getByTestId("executive-planning-page");
    await executivePlanning.getByLabel("Executive Director plan decision reason").fill("Final plan authority recorded for revision 3.");
    await executivePlanning.getByRole("button", { name: "Approve and mock-sign PLAN-2026-CAB-001" }).click();
    await expect(executivePlanning.getByTestId("planning-status")).toHaveText("GM_RELEASE");

    await page.goto("/executive-director/preliminary-reports");
    const preliminary = page.getByRole("region", { name: "Selected Preliminary Report PR-2026-018-V1" });
    await expect(preliminary.getByRole("button", { name: "Return PR-2026-018-V1 unavailable" })).toBeDisabled();
    await preliminary.getByLabel("Executive Director report decision reason").fill("Issue exact Preliminary Report version 1.");
    await preliminary.getByRole("button", { name: "Issue and lock PR-2026-018-V1" }).click();
    await expect(preliminary.getByTestId("report-status")).toHaveText("LOCKED");

    await page.goto("/executive-director/final-reports");
    const finalReport = page.getByRole("region", { name: "Selected Final Report RPT-CAB-2026-001-V1" });
    await expect(finalReport).toContainText("No Findings linked — relationship unavailable for RPT-CAB-2026-001-V1");
    await expect(finalReport.getByRole("button", { name: "Return RPT-CAB-2026-001-V1 unavailable" })).toBeDisabled();
    await finalReport.getByRole("link", { name: "Preview RPT-CAB-2026-001-V1" }).click();
    await expect(page).toHaveURL(/\/executive-director\/reports\/RPT-CAB-2026-001$/);
    const reportPreview = page.getByTestId("executive-report-preview-page");
    await expect(reportPreview).toContainText("sha256:candidate-report-v1");
    const downloadPromise = page.waitForEvent("download");
    await reportPreview.getByRole("button", { name: "Download PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("RPT-CAB-2026-001.pdf");
    await expect(reportPreview.getByRole("status")).toContainText("RPT-CAB-2026-001-V1");

    await page.goto("/executive-director/notifications");
    const notification = page.getByRole("article", { name: "Notification NOT-EXEC-001" });
    await notification.getByRole("button", { name: "Mark NOT-EXEC-001 read" }).click();
    await expect(notification).toContainText("Read · revision 2");
    await page.reload();
    await expect(page.getByRole("article", { name: "Notification NOT-EXEC-001" })).toContainText("Read · revision 2");

    await page.goto("/general-manager/settings");
    const gmSettings = page.getByTestId("gm-settings-page");
    await gmSettings.getByRole("button", { name: "Edit profile" }).click();
    await gmSettings.getByLabel("Display name").fill("Omar GM Updated");
    await gmSettings.getByRole("button", { name: "Save profile" }).click();
    await page.reload();
    await expect(page.getByTestId("gm-settings-page")).toContainText("Omar GM Updated");

    await page.goto("/executive-director/settings");
    const executiveSettings = page.getByTestId("executive-settings-page");
    await executiveSettings.getByRole("button", { name: "Edit profile" }).click();
    await executiveSettings.getByLabel("Display name").fill("Zara ED Updated");
    await executiveSettings.getByRole("button", { name: "Save profile" }).click();
    await page.reload();
    await expect(page.getByTestId("executive-settings-page")).toContainText("Zara ED Updated");
    await expect(page.getByTestId("executive-settings-page")).not.toContainText("Omar GM Updated");
  });
}
