import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "@playwright/test";

import {
  assertBaselineUpdateMode,
  assertViewportScreenshotContract,
  byteDiffRatio,
  driveReactSurface,
  installDeterministicPageState,
  maxDiffForSurface,
  resolveFocusedSurfaces,
  resolveVisualRegions,
  validateBaselineManifest,
  VISUAL_BASELINE_ROOT,
  VISUAL_SURFACE_BY_ID,
  VISUAL_VIEWPORTS,
  VISUAL_VIEWPORT_BY_ID,
  type BaselineManifest,
} from "./support/legacy-parity-fixtures";

test.describe.configure({ mode: "serial" });

const appRoot = process.cwd();
const repoRoot = resolve(appRoot, "../..");
const baselineRoot = resolve(repoRoot, VISUAL_BASELINE_ROOT);
const manifestPath = resolve(baselineRoot, "baseline-manifest.json");
const visualRegions = resolveVisualRegions(undefined, { allowShellOnly: true });
const shellOnly = visualRegions.includes("shell");
const surfaces = shellOnly
  ? resolveFocusedSurfaces("role-select,inspector-home")
  : resolveFocusedSurfaces();

assertBaselineUpdateMode({
  command: "test:e2e:visual-parity",
  env: { AVIA_UPDATE_LEGACY_BASELINES: process.env.AVIA_UPDATE_LEGACY_BASELINES },
});

function readManifest(): BaselineManifest {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as BaselineManifest;
  validateBaselineManifest(manifest, {
    baselineDir: baselineRoot,
    expectedSurfaces: VISUAL_SURFACE_BY_ID,
    expectedViewports: VISUAL_VIEWPORT_BY_ID,
  });
  return manifest;
}

const manifest = readManifest();

for (const viewport of VISUAL_VIEWPORTS) {
  for (const surface of surfaces) {
    test(`${shellOnly ? "checks shell geometry for" : "compares React"} ${surface.id} at ${viewport.id}`, async ({ page }) => {
      const baselineItem = manifest.items.find(
        (item) => item.surfaceId === surface.id && item.viewport === viewport.id,
      );
      if (!baselineItem) throw new Error(`Missing baseline item for ${surface.id}/${viewport.id}.`);

      await page.setViewportSize(viewport);
      await installDeterministicPageState(page);
      await driveReactSurface(page, surface);
      if (shellOnly) {
        await expect(page.locator("body")).toContainText(surface.expectedHeading);
        if (surface.id === "role-select") {
          await expect(page.locator(".role-select-page")).toBeVisible();
          await expect(page.locator("[data-testid='role-select-panel']")).toBeVisible();
          await expect(page.locator(".role-card")).toHaveCount(8);
        } else {
          await expect(page.locator("[data-testid='application-shell']")).toBeVisible();
          await expect(page.locator(".workspace-sidebar")).toBeVisible();
          await expect(page.locator(".application-topbar")).toBeVisible();
          await expect(page.locator(".workspace-content")).toBeVisible();
        }
        const touchTargets = await page.locator("a:visible, button:visible").evaluateAll((elements) =>
          elements.map((element) => {
            const rect = element.getBoundingClientRect();
            return { width: rect.width, height: rect.height, text: element.textContent?.trim() ?? "" };
          }),
        );
        expect(touchTargets.every((target) => target.width >= 44 && target.height >= 44)).toBe(true);
        return;
      }
      const screenshot = await page.screenshot({ fullPage: false });
      assertViewportScreenshotContract({
        fullPage: false,
        viewport,
        imageSize: baselineItem.viewportSize,
      });

      const baseline = readFileSync(resolve(baselineRoot, baselineItem.file));
      const ratio = byteDiffRatio(baseline, screenshot);
      const threshold = maxDiffForSurface(surface);
      expect(
        ratio,
        `${surface.id}/${viewport.id}/viewport ratio ${ratio.toFixed(5)} max ${threshold.toFixed(2)}`,
      ).toBeLessThanOrEqual(threshold);
    });
  }
}
