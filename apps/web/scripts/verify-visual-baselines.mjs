#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { release } from "node:os";
import { dirname, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const appRoot = resolve(scriptDir, "..");
const repoRoot = resolve(scriptDir, "../../..");
const baselineDir = resolve(appRoot, "tests/visual-baselines/react-legacy-parity");
const manifestPath = resolve(baselineDir, "baseline-manifest.json");
const baselineVersion = "react-legacy-parity-v1";
const fixedTimeIso = "2026-06-15T09:00:00.000Z";

const viewports = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 390, height: 844 },
};

const expectedSurfaces = {
  "role-select": {
    auditId: "ui-audit-001",
    parityMode: "strict-shell",
    reactPath: "/",
    legacyView: "login",
    legacyParams: {},
  },
  "inspector-home": {
    auditId: "ui-audit-002",
    parityMode: "content-adapted",
    reactPath: "/inspector/inspector-assignments",
    legacyView: "inspector-assignments",
    legacyParams: {},
  },
  "lead-home": {
    auditId: "ui-audit-013",
    parityMode: "content-adapted",
    reactPath: "/lead-inspector/lead-review",
    legacyView: "lead-review",
    legacyParams: {},
  },
  "manager-home": {
    auditId: "ui-audit-027",
    parityMode: "content-adapted",
    reactPath: "/department-manager/dashboard",
    legacyView: "dashboard",
    legacyParams: {},
  },
  "gm-home": {
    auditId: "ui-audit-052",
    parityMode: "content-adapted",
    reactPath: "/general-manager/gm-dashboard",
    legacyView: "gm-dashboard",
    legacyParams: {},
  },
  "finance-home": {
    auditId: "ui-audit-058",
    parityMode: "content-adapted",
    reactPath: "/finance/finance-review",
    legacyView: "finance-review",
    legacyParams: {},
  },
  "executive-home": {
    auditId: "ui-audit-059",
    parityMode: "content-adapted",
    reactPath: "/executive-director/executive-dashboard",
    legacyView: "executive-dashboard",
    legacyParams: {},
  },
  "auditee-home": {
    auditId: "ui-audit-066",
    parityMode: "content-adapted",
    reactPath: "/auditee/service-provider-cap",
    legacyView: "service-provider-cap",
    legacyParams: {},
  },
  "admin-home": {
    auditId: "ui-audit-076",
    parityMode: "content-adapted",
    reactPath: "/admin/templates",
    legacyView: "template-preview",
    legacyParams: { id: "TPL-CABIN-2026" },
  },
  "audit-detail": {
    auditId: "ui-audit-007",
    parityMode: "content-adapted",
    reactPath: "/inspector/audits/AUD-2026-001",
    legacyView: "audit-detail",
    legacyParams: { auditId: "AUD-2026-001" },
  },
  "checklist-runner": {
    auditId: "ui-audit-008",
    parityMode: "content-adapted",
    reactPath: "/inspector/audits/AUD-2026-001/checklist",
    legacyView: "checklist",
    legacyParams: { auditId: "AUD-2026-001", questionId: "cab-em-eq-pbe" },
  },
  "organization-registry": {
    auditId: "ui-audit-041",
    parityMode: "content-adapted",
    reactPath: "/department-manager/organizations",
    legacyView: "organizations",
    legacyParams: {},
  },
  "audit-plan": {
    auditId: "ui-audit-028",
    parityMode: "content-adapted",
    reactPath: "/department-manager/audit-plan",
    legacyView: "planning",
    legacyParams: {},
  },
  "finding-detail": {
    auditId: "ui-audit-009",
    parityMode: "content-adapted",
    reactPath: "/lead-inspector/findings/FND-CAB-2026-001",
    legacyView: "finding",
    legacyParams: { findingId: "CAB-2026-011" },
  },
  "cap-review": {
    auditId: "ui-audit-022",
    parityMode: "content-adapted",
    reactPath: "/lead-inspector/cap-review/FND-CAB-2026-001",
    legacyView: "cap-review-detail",
    legacyParams: { findingId: "CAB-2026-011" },
  },
  "evidence-review": {
    auditId: "ui-audit-044",
    parityMode: "content-adapted",
    reactPath: "/lead-inspector/evidence-review/FND-CAB-2026-001",
    legacyView: "findings",
    legacyParams: { filter: "evreview" },
  },
  "report-preview": {
    auditId: "ui-audit-030",
    parityMode: "content-adapted",
    reactPath: "/department-manager/reports/RPT-CAB-2026-001-V1",
    legacyView: "reports-approval",
    legacyParams: { reportId: "PR-2026-018" },
  },
};

const sourceFiles = [
  "index.html",
  "css/styles.css",
  "js/app.js",
  "js/views.js",
  "js/data.js",
];

function fail(message) {
  throw new Error(message);
}

function hashBytes(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function hashFile(relativePath) {
  return hashBytes(readFileSync(resolve(repoRoot, relativePath)));
}

function safeBaselinePath(relativeFile) {
  if (
    relativeFile.startsWith("/") ||
    relativeFile.includes("..") ||
    relativeFile.split(/[\\/]/).some((part) => part === "")
  ) {
    fail(`Unsafe baseline path: ${relativeFile}`);
  }
  const absolute = resolve(baselineDir, relativeFile);
  const rel = relative(baselineDir, absolute);
  if (rel.startsWith("..") || rel === "" || rel.split(sep)[0] === "..") {
    fail(`Baseline path escapes root: ${relativeFile}`);
  }
  return absolute;
}

function listPngFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir).sort()) {
    const absolute = resolve(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) files.push(...listPngFiles(absolute, base));
    else if (entry.endsWith(".png")) files.push(relative(base, absolute).split(sep).join("/"));
  }
  return files;
}

function assertNotIgnored(absolutePath) {
  const result = spawnSync("git", ["check-ignore", "-q", relative(repoRoot, absolutePath)], {
    cwd: repoRoot,
    stdio: "ignore",
  });
  if (result.status === 0) fail(`Visual baseline path is ignored by git: ${relative(repoRoot, absolutePath)}`);
  if (result.status !== 1) fail(`git check-ignore failed for ${relative(repoRoot, absolutePath)}`);
}

function currentSourceMetadata() {
  const files = {};
  for (const file of sourceFiles) files[file] = hashFile(file);
  return {
    files,
    auditDocument: {
      path: "docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md",
      sha256: hashFile("docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md"),
    },
    packageLockSha256: hashFile("apps/web/package-lock.json"),
  };
}

async function currentEnvironmentMetadata() {
  const playwrightPackage = JSON.parse(
    readFileSync(resolve(appRoot, "node_modules/@playwright/test/package.json"), "utf8"),
  );
  const browser = await chromium.launch({ headless: true });
  try {
    return {
      playwrightVersion: playwrightPackage.version,
      chromiumVersion: browser.version(),
      nodeVersion: process.versions.node,
      platform: process.platform,
      arch: process.arch,
      osRelease: release(),
    };
  } finally {
    await browser.close();
  }
}

function assertRecordEqual(label, actual, expected) {
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  if (actualKeys.join("\n") !== expectedKeys.join("\n")) {
    fail(`${label} metadata keys mismatch.`);
  }
  for (const key of expectedKeys) {
    if (actual[key] !== expected[key]) fail(`${label} metadata mismatch for ${key}.`);
  }
}

function assertObjectEqual(label, actual, expected) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) fail(`${label} mismatch.`);
}

async function verify() {
  if (process.env.AVIA_UPDATE_LEGACY_BASELINES === "1") {
    fail("verify-visual-baselines.mjs is read-only and must not run in baseline update mode.");
  }
  if (!existsSync(manifestPath)) fail("Missing visual baseline manifest.");
  assertNotIgnored(manifestPath);

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.schemaVersion !== 1) fail("Unsupported baseline manifest schema.");
  if (manifest.generatedAt !== fixedTimeIso) fail("Baseline manifest generatedAt is not deterministic.");
  if (manifest.baselineVersion !== baselineVersion) fail(`Unexpected baseline version: ${manifest.baselineVersion}`);
  if (manifest.surfaceCount !== 17) fail("Baseline manifest must record exactly 17 surfaces.");
  if (manifest.viewportCount !== 3) fail("Baseline manifest must record exactly 3 viewports.");
  if (!Array.isArray(manifest.items) || manifest.items.length !== 51) {
    fail(`Baseline manifest must list exactly 51 PNGs; got ${manifest.items?.length ?? 0}.`);
  }
  if (!/^[0-9a-f]{40}$/.test(manifest.source?.commit ?? "")) {
    fail("Baseline manifest source commit must be a full git SHA.");
  }

  const expectedSource = currentSourceMetadata();
  assertRecordEqual("source", manifest.source.files, expectedSource.files);
  if (manifest.source.auditDocument.path !== expectedSource.auditDocument.path) {
    fail("source metadata mismatch for audit document path.");
  }
  if (manifest.source.auditDocument.sha256 !== expectedSource.auditDocument.sha256) {
    fail("source metadata mismatch for audit document hash.");
  }
  if (manifest.source.packageLockSha256 !== expectedSource.packageLockSha256) {
    fail("package-lock metadata mismatch.");
  }

  const expectedEnvironment = await currentEnvironmentMetadata();
  for (const key of Object.keys(expectedEnvironment)) {
    if (manifest.environment[key] !== expectedEnvironment[key]) {
      fail(`${key} metadata mismatch.`);
    }
  }

  const seenKeys = new Set();
  const seenFiles = new Set();
  for (const item of manifest.items) {
    const key = `${item.surfaceId}/${item.viewport}`;
    if (seenKeys.has(key)) fail(`Duplicate baseline item: ${key}`);
    seenKeys.add(key);
    if (seenFiles.has(item.file)) fail(`Duplicate baseline file: ${item.file}`);
    seenFiles.add(item.file);

    const surface = expectedSurfaces[item.surfaceId];
    if (!surface) fail(`Unexpected baseline surface: ${item.surfaceId}`);
    if (!viewports[item.viewport]) fail(`Unexpected baseline viewport: ${item.viewport}`);
    if (item.auditId !== surface.auditId) fail(`Route mismatch for ${item.surfaceId}: audit id.`);
    if (item.parityMode !== surface.parityMode) fail(`Route mismatch for ${item.surfaceId}: parity mode.`);
    if (item.sourceRoute.reactPath !== surface.reactPath) fail(`Route mismatch for ${item.surfaceId}: React path.`);
    if (item.sourceRoute.legacyView !== surface.legacyView) fail(`Route mismatch for ${item.surfaceId}: legacy view.`);
    assertObjectEqual(`Route mismatch for ${item.surfaceId}: legacy params`, item.sourceRoute.legacyParams, surface.legacyParams);
    assertObjectEqual(`Viewport metadata for ${key}`, item.viewportSize, viewports[item.viewport]);

    const absolute = safeBaselinePath(item.file);
    assertNotIgnored(absolute);
    if (!existsSync(absolute)) fail(`Missing baseline PNG: ${item.file}`);
    const realHash = hashBytes(readFileSync(absolute));
    if (realHash !== item.sha256) fail(`Baseline hash drift for ${item.file}.`);
  }

  const expectedKeys = [];
  for (const surfaceId of Object.keys(expectedSurfaces)) {
    for (const viewportId of Object.keys(viewports)) expectedKeys.push(`${surfaceId}/${viewportId}`);
  }
  expectedKeys.sort();
  const actualKeys = [...seenKeys].sort();
  if (actualKeys.join("\n") !== expectedKeys.join("\n")) {
    fail("Baseline manifest does not contain the exact 17x3 surface matrix.");
  }

  const extraFiles = listPngFiles(baselineDir).filter((file) => !seenFiles.has(file));
  if (extraFiles.length) fail(`Unexpected extra baseline PNG file(s): ${extraFiles.join(", ")}`);

  process.stdout.write(`Verified ${manifest.items.length} visual baseline PNGs in ${relative(repoRoot, baselineDir)}.\n`);
}

verify().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
