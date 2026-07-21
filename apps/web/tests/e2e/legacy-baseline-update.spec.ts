import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { release } from "node:os";
import { dirname, resolve } from "node:path";

import { expect, test, type Browser } from "@playwright/test";

import {
  APP_PACKAGE_LOCK,
  assertBaselineUpdateMode,
  assertViewportScreenshotContract,
  driveLegacySurface,
  hashBytes,
  installDeterministicPageState,
  LEGACY_AUDIT_DOCUMENT,
  LEGACY_SOURCE_HASH_FILES,
  resolveFocusedSurfaces,
  VISUAL_BASELINE_ROOT,
  VISUAL_BASELINE_VERSION,
  VISUAL_FIXED_TIME_ISO,
  VISUAL_LEGACY_BASE_URL,
  VISUAL_VIEWPORTS,
  type BaselineManifest,
  type BaselineManifestItem,
} from "./support/legacy-parity-fixtures";

test.describe.configure({ mode: "serial" });

const appRoot = process.cwd();
const repoRoot = resolve(appRoot, "../..");
const baselineRoot = resolve(repoRoot, VISUAL_BASELINE_ROOT);
const manifestPath = resolve(baselineRoot, "baseline-manifest.json");
const surfaces = resolveFocusedSurfaces();
const manifestItems: BaselineManifestItem[] = [];
let serverProcess: ChildProcessWithoutNullStreams | null = null;
let chromiumVersion = "";

function repoPath(relativePath: string): string {
  return resolve(repoRoot, relativePath);
}

function sourceMetadata() {
  const files = Object.fromEntries(
    LEGACY_SOURCE_HASH_FILES.map((relativePath) => [
      relativePath,
      hashBytes(readFileSync(repoPath(relativePath))),
    ]),
  );
  return {
    commit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim(),
    files,
    auditDocument: {
      path: LEGACY_AUDIT_DOCUMENT,
      sha256: hashBytes(readFileSync(repoPath(LEGACY_AUDIT_DOCUMENT))),
    },
    packageLockSha256: hashBytes(readFileSync(repoPath(APP_PACKAGE_LOCK))),
  };
}

function environmentMetadata(browser: Browser) {
  const playwrightPackage = JSON.parse(
    readFileSync(resolve(appRoot, "node_modules/@playwright/test/package.json"), "utf8"),
  ) as { version: string };
  return {
    playwrightVersion: playwrightPackage.version,
    chromiumVersion: browser.version(),
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch,
    osRelease: release(),
  };
}

async function waitForLegacyServer(): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(VISUAL_LEGACY_BASE_URL, { method: "HEAD" });
      if (response.ok) return;
    } catch {
      await new Promise((resolveAttempt) => setTimeout(resolveAttempt, 125));
    }
  }
  throw new Error("Legacy oracle server did not start on 127.0.0.1:4173.");
}

test.beforeAll(async ({ browser }) => {
  assertBaselineUpdateMode({
    command: "visual:baseline:update",
    env: { AVIA_UPDATE_LEGACY_BASELINES: process.env.AVIA_UPDATE_LEGACY_BASELINES },
  });
  chromiumVersion = browser.version();
  rmSync(baselineRoot, { recursive: true, force: true });
  mkdirSync(baselineRoot, { recursive: true });
  serverProcess = spawn(process.execPath, ["scripts/serve-legacy.mjs"], {
    cwd: appRoot,
    env: { ...process.env, PORT: "4173" },
    stdio: "pipe",
  });
  serverProcess.stderr.on("data", (chunk) => process.stderr.write(chunk));
  await waitForLegacyServer();
});

test.afterAll(async ({ browser }) => {
  const source = sourceMetadata();
  const environment = { ...environmentMetadata(browser), chromiumVersion };
  const manifest: BaselineManifest = {
    schemaVersion: 1,
    generatedAt: VISUAL_FIXED_TIME_ISO,
    baselineVersion: VISUAL_BASELINE_VERSION,
    surfaceCount: new Set(manifestItems.map((item) => item.surfaceId)).size,
    viewportCount: new Set(manifestItems.map((item) => item.viewport)).size,
    source,
    environment,
    items: [...manifestItems].sort((left, right) =>
      `${left.viewport}/${left.surfaceId}`.localeCompare(`${right.viewport}/${right.surfaceId}`),
    ),
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  if (serverProcess) {
    serverProcess.kill("SIGTERM");
    await new Promise((resolveExit) => serverProcess?.once("exit", resolveExit));
    serverProcess = null;
  }
});

for (const viewport of VISUAL_VIEWPORTS) {
  for (const surface of surfaces) {
    test(`captures legacy baseline for ${surface.id} at ${viewport.id}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await installDeterministicPageState(page);
      await driveLegacySurface(page, surface);
      await expect(page.locator("body")).toContainText(surface.expectedHeading);

      const relativeFile = `${viewport.id}/${surface.id}.png`;
      const absoluteFile = resolve(baselineRoot, relativeFile);
      mkdirSync(dirname(absoluteFile), { recursive: true });
      const screenshot = await page.screenshot({ path: absoluteFile, fullPage: false });
      assertViewportScreenshotContract({
        fullPage: false,
        viewport,
        imageSize: viewport,
      });
      manifestItems.push({
        auditId: surface.auditId,
        surfaceId: surface.id,
        parityMode: surface.parityMode,
        viewport: viewport.id,
        viewportSize: { width: viewport.width, height: viewport.height },
        file: relativeFile,
        sha256: hashBytes(screenshot),
        sourceRoute: {
          legacyView: surface.legacy.view,
          legacyParams: surface.legacy.params,
          reactPath: surface.reactPath,
        },
      });
    });
  }
}
