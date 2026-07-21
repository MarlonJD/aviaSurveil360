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

test("two clients keep N and N-1 shells plus pending local sentinels until explicit site-data clearing", async () => {
  test.setTimeout(90_000);
  const profileDirectory = await mkdtemp(join(tmpdir(), "aviasurveil360-task6-update-"));
  const server = new OfflineStaticServer(4187);
  let context = await launchManagedPersistentContext(profileDirectory);
  try {
    await server.start();
    let firstPage = await activePage(context);
    await firstPage.goto(`${server.origin}/inspector/audits/AUD-2026-001`);
    await attestAndRequestCheckout(firstPage);
    await expect(
      firstPage.locator('[data-readiness-code="ephemeral-or-unmanaged-storage"]'),
    ).toBeVisible();

    await context.close();
    context = await launchManagedPersistentContext(profileDirectory);
    firstPage = await activePage(context);
    await firstPage.goto(`${server.origin}/inspector/audits/AUD-2026-001`);
    await attestAndRequestCheckout(firstPage);
    await expect(firstPage.locator('[data-readiness-code="ready"]')).toBeVisible();

    const secondPage = await context.newPage();
    await secondPage.goto(`${server.origin}/inspector/audits/AUD-2026-001`);
    await expect(secondPage.getByTestId("offline-package-status")).toBeVisible();

    await firstPage.evaluate(async () => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("aviasurveil360-offline-foundation");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction("foundation", "readwrite");
        transaction.objectStore("foundation").put({
          key: "pending-outbox-sentinel",
          value: { count: 1 },
        });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      database.close();
      const root = await navigator.storage.getDirectory();
      const handle = await root.getFileHandle("pending-update-sentinel.bin", { create: true });
      const writable = await handle.createWritable();
      await writable.write(new Uint8Array([10, 20, 30, 40]));
      await writable.close();
    });

    server.setShellVersion(2);
    await Promise.all([
      firstPage.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update()),
      secondPage.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update()),
    ]);
    await expect
      .poll(() =>
        firstPage.evaluate(async () =>
          Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
        ),
      )
      .toBe(true);

    expect(
      await firstPage.evaluate(async () => {
        const cacheNames = await caches.keys();
        const root = await navigator.storage.getDirectory();
        const file = await (await root.getFileHandle("pending-update-sentinel.bin")).getFile();
        const bytes = [...new Uint8Array(await file.arrayBuffer())];
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("aviasurveil360-offline-foundation");
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const sentinel = await new Promise<unknown>((resolve, reject) => {
          const request = database.transaction("foundation").objectStore("foundation").get(
            "pending-outbox-sentinel",
          );
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        database.close();
        return { cacheNames, bytes, sentinelPresent: Boolean(sentinel) };
      }),
    ).toMatchObject({
      bytes: [10, 20, 30, 40],
      sentinelPresent: true,
      cacheNames: expect.arrayContaining([
        "aviasurveil360-app-shell-v1",
        "aviasurveil360-app-shell-v2",
      ]),
    });
    await expect(firstPage.getByTestId("offline-package-status")).toBeVisible();
    await expect(secondPage.getByTestId("offline-package-status")).toBeVisible();

    const cdp = await context.newCDPSession(firstPage);
    await cdp.send("Storage.clearDataForOrigin", { origin: server.origin, storageTypes: "all" });
    await firstPage.goto(`${server.origin}/inspector/audits/AUD-2026-001`);
    await expect(firstPage.getByTestId("offline-package-status")).toHaveCount(0);
    await expect(firstPage.getByText(/Local package missing.*cannot be recovered/i)).toBeVisible();
  } finally {
    await context.close().catch(() => undefined);
    await server.stop().catch(() => undefined);
    await rm(profileDirectory, { recursive: true, force: true });
  }
});
