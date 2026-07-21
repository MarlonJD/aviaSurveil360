import { expect, test } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  activePage,
  attestAndRequestCheckout,
  launchManagedPersistentContext,
} from "./support/offline-browser";
import { OfflineStaticServer } from "./support/offline-static-server";

test("checked-out field shell survives a real browser restart with the origin server stopped", async () => {
  test.setTimeout(90_000);
  const profileDirectory = await mkdtemp(join(tmpdir(), "aviasurveil360-task6-startup-"));
  const server = new OfflineStaticServer(4186);
  let context = await launchManagedPersistentContext(profileDirectory);
  try {
    await server.start();
    let page = await activePage(context);
    await page.goto(`${server.origin}/inspector/audits/AUD-2026-001`);
    await expect(page.getByTestId("offline-readiness-panel")).toBeVisible();

    await attestAndRequestCheckout(page);
    await expect(page.locator('[data-readiness-code="ephemeral-or-unmanaged-storage"]')).toContainText(
      /restart the browser/i,
    );

    await page.reload();
    await attestAndRequestCheckout(page);
    await expect(page.locator('[data-readiness-code="ephemeral-or-unmanaged-storage"]')).toContainText(
      /restart the browser/i,
    );

    await context.close();
    context = await launchManagedPersistentContext(profileDirectory);
    page = await activePage(context);
    await page.goto(`${server.origin}/inspector/audits/AUD-2026-001`);
    await attestAndRequestCheckout(page);
    await expect(page.locator('[data-readiness-code="ready"]')).toContainText(
      "Ready for official offline checkout",
    );
    await expect(page.getByTestId("offline-package-status")).toContainText("PKG-CAB-2026-001");

    await context.close();
    await server.stop();

    context = await launchManagedPersistentContext(profileDirectory);
    page = await activePage(context);
    await page.goto(`${server.origin}/inspector/audits/AUD-2026-001`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { name: "2026 Cabin Inspection - Fly Namibia" })).toBeVisible();
    await expect(page.getByTestId("offline-package-status")).toContainText("PKG-CAB-2026-001");
    expect(
      await page.evaluate(async () => {
        try {
          await fetch("/v1/offline-origin-probe", { cache: "no-store" });
          return true;
        } catch {
          return false;
        }
      }),
    ).toBe(false);
  } finally {
    await context.close().catch(() => undefined);
    await server.stop().catch(() => undefined);
    await rm(profileDirectory, { recursive: true, force: true });
  }
});
