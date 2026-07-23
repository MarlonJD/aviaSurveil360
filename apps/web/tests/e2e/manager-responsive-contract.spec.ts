import { expect, test, type Locator, type Page } from "@playwright/test";

const viewports = [
  { id: "desktop", width: 1440, height: 900 },
  { id: "tablet", width: 1024, height: 768 },
  { id: "mobile", width: 390, height: 844 },
] as const;

async function expectActionInsideViewport(page: Page, action: Locator): Promise<void> {
  await action.scrollIntoViewIfNeeded();
  await expect(action).toBeVisible();
  const box = await action.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!box || !viewport) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
}

async function primaryNavigation(page: Page, width: number): Promise<Locator> {
  if (width > 900) return page.locator(".workspace-sidebar").getByRole("navigation", { name: "Primary role navigation" });
  const opener = page.getByRole("button", { name: "Open navigation" });
  await expect(opener).toHaveAttribute("aria-expanded", "false");
  await opener.click();
  await expect(opener).toHaveAttribute("aria-expanded", "true");
  return page.locator(".mobile-navigation__drawer").getByRole("navigation", { name: "Primary role navigation" });
}

async function navigatePrimary(page: Page, width: number, name: string, path: string): Promise<void> {
  const navigation = await primaryNavigation(page, width);
  const link = navigation.getByRole("link", { name });
  await expectActionInsideViewport(page, link);
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
}

for (const viewport of viewports) {
  test(`keeps Manager shell, routes, controls, and record actions usable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/department-manager/evidence/FND-CAB-2026-001");
    await expect(page.getByRole("heading", { name: "Finding unavailable" })).toBeVisible();
    await expect(page.getByText("The Evidence review route could not load this Finding for the Department Manager.")).toBeVisible();

    let navigation = await primaryNavigation(page, viewport.width);
    await expect(navigation.getByRole("link", { name: "Findings Review" })).toHaveAttribute("aria-current", "page");
    await expect(navigation.getByRole("link", { name: "Evidence Review" })).toHaveCount(0);
    await expect(navigation.locator("a[aria-current='page']")).toHaveCount(1);
    if (viewport.width <= 900) {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
    }

    await navigatePrimary(page, viewport.width, "Findings Review", "/department-manager/findings-review");
    const findingsPage = page.getByTestId("manager-findings-review-page");
    await expect(findingsPage).toBeVisible();
    await expect(findingsPage.getByLabel("Status")).toBeVisible();
    const unavailableEvidence = findingsPage.getByRole("button", { name: "Evidence unavailable for FND-SKYCARGO-2026-099" });
    await expect(unavailableEvidence).toBeDisabled();
    await expect(unavailableEvidence).toHaveAttribute("title", "Finding FND-SKYCARGO-2026-099 has no declared Department Manager Evidence-review route.");

    await navigatePrimary(page, viewport.width, "Audits", "/department-manager/audits");
    const auditsPage = page.getByTestId("manager-audits-page");
    await expect(auditsPage.getByRole("heading", { level: 1, name: "Audit Work Queue" })).toBeVisible();
    await expect(auditsPage.getByLabel("Status")).toBeVisible();
    await expectActionInsideViewport(page, auditsPage.getByRole("button", { name: "Open Audit AUD-2026-001" }));

    const dashboardTransitions = [
      ["Open Audits", "/department-manager/audits", "manager-audits-page"],
      ["Open Inspection Team", "/department-manager/inspection-team", "manager-inspection-team-page"],
      ["Open Findings Review", "/department-manager/findings-review", "manager-findings-review-page"],
      ["Open CAP Monitoring", "/department-manager/cap-monitoring", "manager-cap-monitoring-page"],
      ["Open Checklist Management", "/department-manager/checklist-management", "manager-checklist-management-page"],
      ["Open Reports Approval", "/department-manager/preliminary-reports/PR-2026-018", "manager-preliminary-review-page"],
    ] as const;
    for (const [actionName, path, testId] of dashboardTransitions) {
      await page.goto("/department-manager/dashboard");
      const action = page.getByRole("link", { name: actionName });
      await expectActionInsideViewport(page, action);
      await action.click();
      await expect(page).toHaveURL(new RegExp(`${path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
      await expect(page.getByTestId(testId)).toBeVisible();
    }

    await page.goto("/department-manager/inspection-team");
    const teamPage = page.getByTestId("manager-inspection-team-page");
    const openTeam = teamPage.getByRole("button", { name: "Open Inspection Team for AUD-2026-001" });
    await expectActionInsideViewport(page, openTeam);
    await openTeam.click();
    const teamDossier = teamPage.getByRole("region", { name: "Inspection Team for Audit AUD-2026-001" });
    await expect(teamDossier).toContainText("USR-LEAD-CANER");
    await expect(teamDossier).toContainText("USR-INSPECTOR-AMINA");
    await teamDossier.getByRole("tab", { name: "Assignments" }).click();
    await expect(teamDossier.getByRole("tabpanel")).toContainText("CAB-EMEQ-PBE-001");
    const auditLink = teamDossier.getByRole("link", { name: "Open Audit AUD-2026-001" });
    await expectActionInsideViewport(page, auditLink);
    await auditLink.click();
    await expect(page).toHaveURL(/\/department-manager\/audits\?auditId=AUD-2026-001$/);
    await expect(page.getByRole("region", { name: "Audit AUD-2026-001 dossier" })).toContainText("USR-INSPECTOR-AMINA");

    await page.goto("/department-manager/organizations");
    const organizationLink = page.locator("a[aria-label='Open organization ORG-FLY-NAMIBIA']:visible");
    await expectActionInsideViewport(page, organizationLink);
    await organizationLink.click();
    await expect(page).toHaveURL(/\/department-manager\/organizations\/ORG-FLY-NAMIBIA$/);
  });
}
