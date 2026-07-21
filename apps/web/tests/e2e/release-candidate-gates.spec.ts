import { expect, test } from "@playwright/test";

const apiURL = process.env.AVIA_HTTP_API_URL ?? "http://127.0.0.1:58081";
const token = process.env.AVIA_CANONICAL_TEST_TOKEN ?? "";

test.beforeEach(async ({ request }, testInfo) => {
  if (testInfo.project.name !== "http") return;
  const response = await request.post(`${apiURL}/__test/reset`, {
    headers: { "x-avia-test-token": token },
  });
  expect(response.ok()).toBe(true);
});

test("local candidate has keyboard-reachable role entries, literal boundaries, and a stable reset", async ({
  page,
  request,
}, testInfo) => {
  const consoleIssues: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleIssues.push(`pageerror: ${error.message}`));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "AviaSurveil360" })).toBeVisible();
  await expect(page.locator(".role-card")).toHaveCount(8);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /CAA Inspector/i })).toBeFocused();
  const inspectorTarget = await page.getByRole("link", { name: /CAA Inspector/i }).evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return { width: bounds.width, height: bounds.height, outlineStyle: style.outlineStyle };
  });
  expect(inspectorTarget.width).toBeGreaterThanOrEqual(44);
  expect(inspectorTarget.height).toBeGreaterThanOrEqual(44);
  expect(inspectorTarget.outlineStyle).not.toBe("none");

  await page.getByRole("link", { name: /Finance Review/i }).click();
  await expect(page.getByText("Candidate-only", { exact: true })).toBeVisible();
  await expect(page.getByText("No production-readiness claim", { exact: true })).toBeVisible();
  await page.getByLabel("Finance decision reason").fill("Release-candidate reset check.");
  await page.getByRole("button", { name: "Approve Budget" }).click();
  await expect(page.getByTestId("planning-status")).toHaveText("GM_REVIEW");

  if (testInfo.project.name === "http") {
    const reset = await request.post(`${apiURL}/__test/reset`, {
      headers: { "x-avia-test-token": token },
    });
    expect(reset.ok()).toBe(true);
    await page.reload();
  } else {
    await page.getByRole("link", { name: "Switch role" }).click();
    await page.getByRole("link", { name: /Auditee/i }).click();
    await page.getByRole("button", { name: "Reset demo" }).click();
    await expect(page.getByRole("heading", { name: "Corrective Actions (CAP)" })).toBeVisible();
    await page.getByLabel("Experience").selectOption("finance");
  }
  await expect(page.getByTestId("planning-status")).toHaveText("FINANCE_REVIEW");
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/production-ready|real production|automatic enforcement/i);
  expect(consoleIssues).toEqual([]);
});
