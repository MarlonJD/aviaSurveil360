import { expect, test } from "@playwright/test";

import { OfflineStaticServer } from "./support/offline-static-server";

function cssUrl(value: string): string {
  const match = /url\(["']?(.*?)["']?\)/.exec(value);
  if (!match) throw new Error(`CSS URL is missing from ${value}`);
  return match[1];
}

test("brand mark, icon, and font are available from the app-shell cache after origin stop", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const server = new OfflineStaticServer(4188);
  try {
    await server.start();
    await page.goto(server.origin);
    await expect(page.getByRole("heading", { name: "AviaSurveil360" })).toBeVisible();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      await document.fonts.ready;
    });

    const before = await page.evaluate(() => {
      const rolePage = document.querySelector(".role-select-page");
      const mark = document.querySelector(".brand-mark");
      const firstRole = document.querySelector(".role-card");
      if (!rolePage || !mark || !firstRole) throw new Error("Brand shell elements are missing");
      const manifestRequest = fetch("/app-shell-assets.json").then((response) => response.json());
      return manifestRequest.then((manifest: { assets: string[] }) => ({
        fontFamily: getComputedStyle(rolePage).fontFamily,
        markBackground: getComputedStyle(mark).backgroundImage,
        iconBackground: getComputedStyle(firstRole, "::before").backgroundImage,
        fontAsset: manifest.assets.find((asset) => /DMSans-Variable.*\.ttf$/.test(asset)),
      }));
    });

    expect(before.fontFamily).toContain("DM Sans");
    expect(before.markBackground).toContain("aviasurveil360-mark");
    expect(before.iconBackground).toContain("air-traffic-control");
    expect(before.fontAsset).toBeTruthy();

    const assetUrls = [
      cssUrl(before.markBackground),
      cssUrl(before.iconBackground),
      new URL(before.fontAsset as string, server.origin).href,
    ];

    await server.stop();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "AviaSurveil360" })).toBeVisible();

    const cachedAssets = await page.evaluate(async (urls) => {
      const cacheNames = await caches.keys();
      const cachesWithAssets = await Promise.all(
        urls.map(async (url) => {
          const hits = await Promise.all(
            cacheNames.map(async (cacheName) => Boolean(await (await caches.open(cacheName)).match(url))),
          );
          return hits.some(Boolean);
        }),
      );
      const fetchedAssets = await Promise.all(
        urls.map(async (url) => {
          const response = await fetch(url);
          return { ok: response.ok, bytes: (await response.arrayBuffer()).byteLength };
        }),
      );
      return { cachesWithAssets, fetchedAssets };
    }, assetUrls);

    expect(cachedAssets.cachesWithAssets).toEqual([true, true, true]);
    expect(cachedAssets.fetchedAssets.every((asset) => asset.ok && asset.bytes > 0)).toBe(true);
  } finally {
    await server.stop().catch(() => undefined);
  }
});
