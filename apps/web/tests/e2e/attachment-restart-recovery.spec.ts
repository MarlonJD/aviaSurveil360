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

const subjectId = "USR-INSPECTOR-AMINA";
const packageId = "PKG-CAB-2026-001";
const attachmentBytes = Buffer.from("candidate OPFS inspection attachment\n", "utf8");

test("ready Inspection Attachment bytes and manifest survive browser restart while origin is stopped", async () => {
  test.setTimeout(90_000);
  const profileDirectory = await mkdtemp(join(tmpdir(), "aviasurveil360-task8-attachment-"));
  const server = new OfflineStaticServer(4190);
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
    await page.getByRole("button", { name: "Create Potential Finding" }).click();
    await expect(page.getByTestId("potential-finding-status")).toContainText(
      "PENDING_LEAD_REVIEW",
    );
    await page.getByLabel("Attachment file").setInputFiles({
      name: "pbe-serviceability.pdf",
      mimeType: "application/pdf",
      buffer: attachmentBytes,
    });
    await page.getByRole("button", { name: "Stage Inspection Attachment" }).click();
    await expect(page.getByTestId("inspection-attachment-state")).toContainText(
      "pbe-serviceability.pdf — ready",
    );
    await expect(page.getByTestId("field-sync-state")).toContainText(
      "Saved locally — sync pending (3)",
    );

    await context.close();
    context = await launchManagedPersistentContext(profileDirectory);
    page = await activePage(context);
    await page.goto(`${server.origin}/inspector/audits/AUD-2026-001/checklist`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { name: "Cabin Inspection checklist" })).toBeVisible();
    await expect(page.getByTestId("inspection-attachment-state")).toContainText(
      "pbe-serviceability.pdf — ready",
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
      const [manifests, outbox] = await Promise.all([
        readAll("attachmentManifests"),
        readAll("outbox"),
      ]);
      database.close();
      const manifest = manifests.find(
        (row) => row.subjectId === activeSubjectId && row.packageId === activePackageId,
      );
      if (!manifest || typeof manifest.finalOpfsPath !== "string") {
        throw new Error("ready attachment manifest missing");
      }
      const segments = manifest.finalOpfsPath.split("/").filter(Boolean);
      const fileName = segments.pop();
      if (!fileName) throw new Error("attachment OPFS path invalid");
      let directory = await navigator.storage.getDirectory();
      for (const segment of segments) directory = await directory.getDirectoryHandle(segment);
      const file = await (await directory.getFileHandle(fileName)).getFile();
      const bytes = new Uint8Array(await file.arrayBuffer());
      const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
      const sha256 = `sha256:${[...hash].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
      return {
        manifest,
        byteSize: bytes.byteLength,
        sha256,
        attachmentOutbox: outbox.find(
          (row) =>
            row.subjectId === activeSubjectId &&
            row.packageId === activePackageId &&
            row.commandType === "REGISTER_INSPECTION_ATTACHMENT",
        ),
      };
    }, { activeSubjectId: subjectId, activePackageId: packageId });

    expect(recovered.byteSize).toBe(attachmentBytes.byteLength);
    expect(recovered.manifest).toEqual(
      expect.objectContaining({
        fileName: "pbe-serviceability.pdf",
        stagingState: "ready",
        syncState: "PENDING",
        localBytesPresent: true,
        potentialFindingLocalId: expect.stringMatching(/^PF-LOCAL-/),
        observedByteSize: attachmentBytes.byteLength,
        sha256: recovered.sha256,
      }),
    );
    expect(recovered.attachmentOutbox).toEqual(
      expect.objectContaining({
        state: "BLOCKED_ON_DEPENDENCY",
        dependsOnOperationIds: expect.any(Array),
      }),
    );
  } finally {
    await context.close().catch(() => undefined);
    await server.stop().catch(() => undefined);
    await rm(profileDirectory, { recursive: true, force: true });
  }
});
