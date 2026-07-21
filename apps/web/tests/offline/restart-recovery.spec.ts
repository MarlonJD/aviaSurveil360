import { expect, test } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  activePage,
  attestAndRequestCheckout,
  launchManagedPersistentContext,
} from "../e2e/support/offline-browser";
import { OfflineStaticServer } from "../e2e/support/offline-static-server";

const subjectId = "USR-INSPECTOR-AMINA";
const packageId = "PKG-CAB-2026-001";

test("pending and in-flight field work survives a browser restart while the origin stays stopped", async () => {
  test.setTimeout(90_000);
  const profileDirectory = await mkdtemp(join(tmpdir(), "aviasurveil360-task7-restart-"));
  const server = new OfflineStaticServer(4188);
  let context = await launchManagedPersistentContext(profileDirectory);
  try {
    await server.start();
    let page = await activePage(context);
    await page.goto(`${server.origin}/inspector/audits/AUD-2026-001`);
    await attestAndRequestCheckout(page);
    await expect(
      page.locator('[data-readiness-code="ephemeral-or-unmanaged-storage"]'),
    ).toBeVisible();

    await context.close();
    context = await launchManagedPersistentContext(profileDirectory);
    page = await activePage(context);
    await page.goto(`${server.origin}/inspector/audits/AUD-2026-001`);
    await attestAndRequestCheckout(page);
    await expect(page.locator('[data-readiness-code="ready"]')).toBeVisible();
    await page.getByRole("link", { name: "Run Cabin checklist" }).click();
    await expect(page.getByRole("heading", { name: "Cabin Inspection checklist" })).toBeVisible();
    await server.stop();

    await page.getByLabel("Checklist answer").selectOption("NON_COMPLIANT");
    await page.getByLabel("Inspector comment").fill("PBE record unavailable offline.");
    await page.getByRole("button", { name: "Save response" }).click();
    await expect(page.getByTestId("field-sync-state")).toContainText(
      "Saved locally — sync pending (1)",
    );

    await page.evaluate(async ({ activeSubjectId, activePackageId }) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("aviasurveil360-offline-foundation");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction("outbox", "readwrite");
        const store = transaction.objectStore("outbox");
        const request = store.getAll();
        request.onsuccess = () => {
          const row = (request.result as Array<Record<string, unknown>>).find(
            (candidate) =>
              candidate.subjectId === activeSubjectId &&
              candidate.packageId === activePackageId &&
              candidate.state === "PENDING",
          );
          if (!row) {
            transaction.abort();
            return;
          }
          row.state = "IN_FLIGHT";
          row.attemptCount = 1;
          store.put(row);
        };
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error ?? new Error("Pending outbox row absent"));
      });
      database.close();
    }, { activeSubjectId: subjectId, activePackageId: packageId });

    await page.getByLabel("Checklist answer").selectOption("OBSERVATION");
    await page.getByLabel("Inspector comment").fill("Later offline edit waits for acknowledgement.");
    await page.getByRole("button", { name: "Save response" }).click();
    await expect(page.getByTestId("field-sync-state")).toContainText(
      "Saved locally — sync pending (2)",
    );

    await context.close();
    context = await launchManagedPersistentContext(profileDirectory);
    page = await activePage(context);
    await page.goto(`${server.origin}/inspector/audits/AUD-2026-001/checklist`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { name: "Cabin Inspection checklist" })).toBeVisible();
    await expect(page.getByLabel("Checklist answer")).toHaveValue("OBSERVATION");
    await expect(page.getByLabel("Inspector comment")).toHaveValue(
      "Later offline edit waits for acknowledgement.",
    );
    await expect(page.getByTestId("field-sync-state")).toContainText(
      "Saved locally — sync pending (2)",
    );

    const recovered = await page.evaluate(async ({ activeSubjectId, activePackageId }) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("aviasurveil360-offline-foundation");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const readAll = (storeName: string) =>
        new Promise<Array<Record<string, unknown>>>((resolve, reject) => {
          const request = database.transaction(storeName).objectStore(storeName).getAll();
          request.onsuccess = () => resolve(request.result as Array<Record<string, unknown>>);
          request.onerror = () => reject(request.error);
        });
      const [responses, outbox] = await Promise.all([
        readAll("checklistResponses"),
        readAll("outbox"),
      ]);
      database.close();
      return {
        responses: responses.filter(
          (row) => row.subjectId === activeSubjectId && row.packageId === activePackageId,
        ),
        outbox: outbox.filter(
          (row) => row.subjectId === activeSubjectId && row.packageId === activePackageId,
        ),
      };
    }, { activeSubjectId: subjectId, activePackageId: packageId });

    expect(recovered.responses).toEqual([
      expect.objectContaining({
        answer: "OBSERVATION",
        comment: "Later offline edit waits for acknowledgement.",
        syncState: "PENDING",
      }),
    ]);
    expect(recovered.outbox).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ state: "IN_FLIGHT", attemptCount: 1 }),
        expect.objectContaining({
          state: "BLOCKED_ON_DEPENDENCY",
          dependsOnOperationIds: expect.any(Array),
        }),
      ]),
    );
  } finally {
    await context.close().catch(() => undefined);
    await server.stop().catch(() => undefined);
    await rm(profileDirectory, { recursive: true, force: true });
  }
});
