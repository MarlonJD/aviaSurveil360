import { expect, test, type BrowserContext, type Page } from "@playwright/test";

async function installManagedOfflineReadiness(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    Object.defineProperties(navigator.storage, {
      persisted: { configurable: true, value: async () => true },
      persist: { configurable: true, value: async () => true },
      estimate: {
        configurable: true,
        value: async () => ({ usage: 8 * 1024 * 1024, quota: 512 * 1024 * 1024 }),
      },
    });
    if (navigator.serviceWorker) {
      Object.defineProperty(navigator.serviceWorker, "ready", {
        configurable: true,
        value: Promise.resolve({}),
      });
    }
  });
}

async function markBrowserRestartVerified(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open("aviasurveil360-offline-foundation");
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("foundation", "readwrite");
      transaction.objectStore("foundation").put({
        key: "restart-canary",
        value: { bootId: "verified-prior-browser-boot", verified: false },
      });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
}

test("normal OIDC session gates protected routes and uses server session authority", async ({
  context,
  page,
}) => {
  test.setTimeout(120_000);
  await installManagedOfflineReadiness(context);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Sign in to AviaSurveil360/i })).toBeVisible();
  await expect(page.getByTestId("application-shell")).toHaveCount(0);
  await expect(page.getByText(/Lead Review/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Sign in with organization identity" }).click();
  await page.getByLabel(/username or email/i).fill("inspector.local");
  await page.getByRole("textbox", { name: "Password" }).fill("LocalInspectorPass123!");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/inspector\/inspector-assignments$/);
  const session = await page.evaluate(async () => {
    const response = await fetch("/auth/session", { credentials: "same-origin" });
    return {
      ok: response.ok,
      status: response.status,
      body: await response.json(),
    };
  });
  expect(session.ok).toBe(true);
  expect(session.body).toMatchObject({
    subjectId: "154ec5ac-6f97-4f55-916f-d2f142fc6211",
    organizationId: "CAA",
    roles: ["inspector"],
  });

  await expect(page.getByRole("navigation", { name: /Primary role navigation/i })).toContainText(
    "My Assignments",
  );
  await expect(page.getByRole("navigation", { name: /Primary role navigation/i })).not.toContainText(
    "Lead Review",
  );

  await page.goto("/lead-inspector/lead-review");
  await expect(page.getByText("Not available for this role")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Lead Review/i })).toHaveCount(0);

  await page.goto("/inspector/audits/AUD-2026-001");
  await markBrowserRestartVerified(page);
  await page.getByLabel(/managed Chrome policy/i).check();
  await page.getByLabel(/encrypted managed profile/i).check();
  await page.getByRole("button", { name: "Check out for offline use" }).click();
  await expect(page.locator('[data-readiness-code="ready"]')).toBeVisible();
  await expect(page.getByTestId("offline-package-status")).toContainText("PKG-CAB-2026-001");

  await page.getByRole("button", { name: "Local Inspector" }).click();
  await page.getByRole("menu", { name: "Profile menu" })
    .getByRole("button", { name: "Logout" })
    .click();
  await expect(page.getByRole("heading", { name: /Sign in to AviaSurveil360/i })).toBeVisible();
  const loggedOut = await page.evaluate(async () => {
    const response = await fetch("/auth/session", { credentials: "same-origin" });
    return response.status;
  });
  expect(loggedOut).toBe(401);

  await expect(page.getByRole("link", { name: /Register/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Reset password/i })).toHaveCount(0);
});
