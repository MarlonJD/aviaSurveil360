import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
] as const;

test.beforeEach(async ({ request }, testInfo) => {
  if (testInfo.project.name !== "http") return;
  const apiURL = process.env.AVIA_HTTP_API_URL ?? "http://127.0.0.1:58081";
  const token = process.env.AVIA_CANONICAL_TEST_TOKEN ?? "";
  const response = await request.post(`${apiURL}/__test/reset`, {
    headers: { "x-avia-test-token": token },
  });
  expect(response.ok()).toBe(true);
});

async function expectNoCriticalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

for (const viewport of viewports) {
  test(`first-production route matrix is actionable at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const consoleIssues: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleIssues.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => consoleIssues.push(`pageerror: ${error.message}`));

    await page.goto("/");
    await page.getByRole("link", { name: /Auditee/i }).click();
    await expect(page.getByRole("heading", { name: "Corrective Actions (CAP)" })).toBeVisible();
    await expect(page.getByTestId("auditee-scope")).toContainText("Fly Namibia");
    await expect(page.getByRole("table", { name: "My Findings" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /SkyCargo Air|Internal CAA Note|Inspector workload|internal risk|enforcement deliberation/i,
    );
    await expectNoCriticalOverflow(page);
    await page.getByLabel("Experience").selectOption("manager");
    await expect(page.getByRole("heading", { name: "Department Manager Dashboard" })).toBeVisible();
    await page.getByRole("link", { name: "Open Organizations" }).click();
    await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible();
    await expect(page.getByTestId("organization-row")).toHaveCount(2);
    await expect(page.getByTestId("organization-row").first()).toContainText("Fly Namibia");
    await expect(page.locator("body")).not.toContainText("Internal CAA Note");
    if (viewport.width <= 900) await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("link", { name: "Planning" }).click();
    await expect(page.getByRole("heading", { name: "Department Planning" })).toBeVisible();
    await expect(page.getByTestId("planning-status")).toHaveText("FINANCE_REVIEW");
    await expectNoCriticalOverflow(page);

    await page.getByLabel("Experience").selectOption("finance");
    await expect(page.getByRole("heading", { name: "Finance Review" })).toBeVisible();
    await page.getByRole("button", { name: "Approve Budget" }).click();
    await page.getByLabel("Finance decision reason").fill(
      "Budget envelope confirmed for the configured inspection.",
    );
    await page.getByRole("button", { name: "Confirm Finance Decision" }).click();
    await expect(page.getByTestId("planning-status")).toHaveText("GM_REVIEW");
    await expect(page.getByTestId("planning-owner")).toHaveText("General Manager");

    await page.getByRole("button", { name: "Continue as General Manager" }).click();
    await expect(page.getByRole("heading", { name: "General Manager Dashboard" })).toBeVisible();
    await page.getByRole("button", { name: "Forward to Executive Director" }).click();
    await page.getByLabel("General Manager decision reason").fill(
      "Operational scope is ready for final approval.",
    );
    await page.getByRole("button", { name: "Confirm General Manager Decision" }).click();
    await expect(page.getByTestId("planning-status")).toHaveText("EXECUTIVE_DIRECTOR_REVIEW");

    await page.getByRole("button", { name: "Continue as Executive Director" }).click();
    await expect(page.getByRole("heading", { name: "Executive Director Dashboard" })).toBeVisible();
    await page.getByRole("button", { name: /Review plan/i }).click();
    await page.getByLabel("Plan decision reason").fill(
      "The annual surveillance item is approved for release.",
    );
    await page.getByRole("button", { name: "Approve Plan" }).click();
    await expect(page.getByTestId("planning-status")).toHaveText("GM_RELEASE");

    await page.getByRole("button", { name: "Continue as General Manager" }).click();
    await page.getByRole("button", { name: "Release Plan" }).click();
    await page.getByLabel("General Manager decision reason").fill(
      "Release the approved item to department preparation.",
    );
    await page.getByRole("button", { name: "Confirm General Manager Decision" }).click();
    await expect(page.getByTestId("planning-status")).toHaveText("RELEASED");
    await expect(page.getByTestId("planning-owner")).toHaveText("Department Manager");

    await page.getByLabel("Experience").selectOption("admin");
    await expect(page.getByRole("heading", { name: "Template Preview — Cabin Inspection" })).toBeVisible();
    await expect(page.getByTestId("template-version")).toHaveText("Version 1");
    const questions = page.getByRole("table", { name: "Published checklist questions" });
    await expect(questions.locator("tbody tr")).toHaveCount(6);
    await expect(questions).toContainText("Configured Cabin Inspection reference — GALLEY");
    await page.getByRole("link", { name: "Back to templates" }).click();
    await expect(page.getByRole("heading", { name: "Checklist Templates" })).toBeVisible();
    await page.getByRole("link", { name: "Preview CTV-CABIN-1" }).click();
    await expect(page.getByRole("heading", { name: "Template Preview — Cabin Inspection" })).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/enforcement deliberation|internal risk|Inspector workload/i);
    await expectNoCriticalOverflow(page);
    expect(consoleIssues).toEqual([]);
  });
}
