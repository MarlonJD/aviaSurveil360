import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertBaselineUpdateMode,
  assertViewportScreenshotContract,
  compareVisualFrames,
  hashBytes,
  patchedFrame,
  resolveFocusedSurfaces,
  resolveVisualRegions,
  solidFrame,
  validateBaselineManifest,
  validateGeometrySnapshot,
  validateMaskContract,
  type BaselineManifest,
  type RectMask,
} from "../e2e/support/legacy-parity-fixtures";

function withTempDir<T>(callback: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "aviasurveil360-visual-contract-"));
  try {
    return callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function singleItemManifest(fileSha256: string): BaselineManifest {
  return {
    schemaVersion: 1,
    generatedAt: "2026-06-15T09:00:00.000Z",
    baselineVersion: "react-legacy-parity-v1",
    surfaceCount: 1,
    viewportCount: 1,
    source: {
      commit: "candidate-source",
      files: {
        "index.html": "sha256:source-index",
        "css/styles.css": "sha256:source-css",
        "js/app.js": "sha256:source-app",
        "js/views.js": "sha256:source-views",
        "js/data.js": "sha256:source-data",
      },
      auditDocument: {
        path: "docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md",
        sha256: "sha256:audit-doc",
      },
      packageLockSha256: "sha256:package-lock",
    },
    environment: {
      playwrightVersion: "1.61.1",
      chromiumVersion: "chromium-test",
      nodeVersion: "26.0.0",
      platform: "darwin",
      arch: "arm64",
      osRelease: "contract",
    },
    items: [
      {
        auditId: "ui-audit-001",
        surfaceId: "role-select",
        parityMode: "strict-shell",
        viewport: "desktop",
        viewportSize: { width: 100, height: 100 },
        file: "desktop/role-select.png",
        sha256: fileSha256,
      sourceRoute: {
          legacyView: "login",
          legacyParams: {},
          reactPath: "/",
        },
      },
    ],
  };
}

describe("visual parity contract", () => {
  it("fails an unmasked deterministic patch outside the strict region ratio", () => {
    const baseline = solidFrame(100, 100, [11, 12, 13, 255]);
    const candidate = patchedFrame(baseline, { x: 0, y: 0, width: 20, height: 20 }, [240, 240, 240, 255]);

    const result = compareVisualFrames(baseline, candidate, {
      region: { id: "viewport", x: 0, y: 0, width: 100, height: 100 },
      masks: [],
      maxDiffPixelRatio: 0.03,
    });

    expect(result.passed).toBe(false);
    expect(result.diffPixelRatio).toBeCloseTo(0.04, 3);
  });

  it("tolerates a perturbation only inside one allowlisted dynamic leaf", () => {
    const baseline = solidFrame(100, 100, [11, 12, 13, 255]);
    const mask: RectMask = {
      selector: "[data-visual-dynamic='clock']",
      rationale: "Clock text is deterministic in normal capture and isolated for contract testing.",
      expectedCount: 1,
      rects: [{ x: 10, y: 10, width: 10, height: 10 }],
    };

    const insideCandidate = patchedFrame(
      baseline,
      { x: 10, y: 10, width: 10, height: 10 },
      [240, 240, 240, 255],
    );
    const outsideCandidate = patchedFrame(
      baseline,
      { x: 30, y: 10, width: 20, height: 20 },
      [240, 240, 240, 255],
    );

    expect(
      compareVisualFrames(baseline, insideCandidate, {
        region: { id: "viewport", x: 0, y: 0, width: 100, height: 100 },
        masks: [mask],
        maxDiffPixelRatio: 0.03,
      }).passed,
    ).toBe(true);
    expect(
      compareVisualFrames(baseline, outsideCandidate, {
        region: { id: "viewport", x: 0, y: 0, width: 100, height: 100 },
        masks: [mask],
        maxDiffPixelRatio: 0.03,
      }).passed,
    ).toBe(false);
  });

  it("fails a four-pixel shell geometry shift", () => {
    expect(() =>
      validateGeometrySnapshot(
        {
          shell: { x: 0, y: 0, width: 100, height: 100 },
          sidebar: { x: 0, y: 0, width: 24, height: 100 },
          topbar: { x: 24, y: 0, width: 76, height: 12 },
          content: { x: 24, y: 12, width: 76, height: 88 },
        },
        {
          shell: { x: 4, y: 0, width: 100, height: 100 },
          sidebar: { x: 0, y: 0, width: 24, height: 100 },
          topbar: { x: 24, y: 0, width: 76, height: 12 },
          content: { x: 24, y: 12, width: 76, height: 88 },
        },
      ),
    ).toThrow(/shell geometry/i);
  });

  it("rejects broad masks and masks covering more than five percent of the viewport", () => {
    const broadMask: RectMask = {
      selector: "body",
      rationale: "Too broad.",
      expectedCount: 1,
      rects: [{ x: 0, y: 0, width: 10, height: 10 }],
    };
    const largeMask: RectMask = {
      selector: "[data-visual-dynamic='large']",
      rationale: "This intentionally covers too much viewport area.",
      expectedCount: 1,
      rects: [{ x: 0, y: 0, width: 30, height: 30 }],
    };

    expect(() => validateMaskContract([broadMask], { width: 100, height: 100 })).toThrow(/broad/i);
    expect(() => validateMaskContract([largeMask], { width: 100, height: 100 })).toThrow(/5%/);
  });

  it("fails missing baselines, altered PNG hashes, stale source hashes, stale lockfile hashes, wrong metadata, and full-page input", () => {
    withTempDir((dir) => {
      const pngPath = join(dir, "desktop", "role-select.png");
      const manifest = singleItemManifest("sha256:missing");

      expect(() =>
        validateBaselineManifest(manifest, {
          baselineDir: dir,
          expectedSource: manifest.source,
          expectedEnvironment: manifest.environment,
        }),
      ).toThrow(/missing baseline/i);

      mkdirSync(join(dir, "desktop"), { recursive: true });
      writeFileSync(pngPath, Buffer.from("png-v1"));
      expect(() =>
        validateBaselineManifest(manifest, {
          baselineDir: dir,
          expectedSource: manifest.source,
          expectedEnvironment: manifest.environment,
        }),
      ).toThrow(/hash drift/i);

      const realHash = hashBytes(Buffer.from("png-v1"));
      expect(() =>
        validateBaselineManifest(singleItemManifest(realHash), {
          baselineDir: dir,
          expectedSource: {
            ...manifest.source,
            files: { ...manifest.source.files, "index.html": "sha256:stale" },
          },
          expectedEnvironment: manifest.environment,
        }),
      ).toThrow(/source metadata/i);

      expect(() =>
        validateBaselineManifest(singleItemManifest(realHash), {
          baselineDir: dir,
          expectedSource: { ...manifest.source, packageLockSha256: "sha256:stale-lock" },
          expectedEnvironment: manifest.environment,
        }),
      ).toThrow(/package-lock/i);

      expect(() =>
        validateBaselineManifest(singleItemManifest(realHash), {
          baselineDir: dir,
          expectedSource: manifest.source,
          expectedEnvironment: { ...manifest.environment, platform: "linux" },
        }),
      ).toThrow(/platform/i);

      expect(() =>
        assertViewportScreenshotContract({
          fullPage: true,
          viewport: { width: 100, height: 100 },
          imageSize: { width: 100, height: 240 },
        }),
      ).toThrow(/fullPage:false/i);
    });
  });

  it("allows baseline writes only through the guarded update command", () => {
    expect(() =>
      assertBaselineUpdateMode({
        command: "test:e2e:visual-parity",
        env: { AVIA_UPDATE_LEGACY_BASELINES: "1" },
      }),
    ).toThrow(/visual:baseline:update/i);

    expect(() =>
      assertBaselineUpdateMode({
        command: "visual:baseline:update",
        env: { AVIA_UPDATE_LEGACY_BASELINES: "1" },
      }),
    ).not.toThrow();
  });

  it("rejects unknown, duplicate, empty surface filters and unsupported region filters", () => {
    expect(() => resolveFocusedSurfaces("role-select,role-select")).toThrow(/duplicate/i);
    expect(() => resolveFocusedSurfaces("")).toThrow(/empty/i);
    expect(() => resolveFocusedSurfaces("not-a-surface")).toThrow(/unknown/i);

    expect(resolveFocusedSurfaces("role-select").map((surface) => surface.id)).toEqual(["role-select"]);
    expect(resolveVisualRegions("shell", { allowShellOnly: true })).toEqual(["shell"]);
    expect(() => resolveVisualRegions("shell")).toThrow(/Task 6/i);
    expect(() => resolveVisualRegions("content")).toThrow(/unsupported/i);
  });
});
