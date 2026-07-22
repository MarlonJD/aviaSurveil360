#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertAppShellArtifact,
  BRAND_ASSET_BASENAMES,
} from "./assert-app-shell-artifact.mjs";
import { assertHttpArtifact } from "./assert-http-artifact.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRepositoryRoot = path.resolve(path.dirname(scriptPath), "../../..");

const EXACT_ROUTE_PATHS = Object.freeze([
  "/",
  "/inspector/inspector-assignments",
  "/lead-inspector/lead-review",
  "/department-manager/dashboard",
  "/general-manager/gm-dashboard",
  "/finance/finance-review",
  "/executive-director/executive-dashboard",
  "/auditee/service-provider-cap",
  "/admin/templates",
  "/inspector/audits/AUD-2026-001",
  "/inspector/audits/AUD-2026-001/checklist",
  "/department-manager/organizations",
  "/department-manager/audit-plan",
  "/lead-inspector/findings/FND-CAB-2026-001",
  "/lead-inspector/cap-review/FND-CAB-2026-001",
  "/lead-inspector/evidence-review/FND-CAB-2026-001",
  "/department-manager/reports/RPT-CAB-2026-001-V1",
]);

const HTTP_FORBIDDEN_INPUTS = [
  /[/\\]src[/\\]mock[/\\]/i,
  /[/\\]seed-data(?:\.[cm]?[jt]s)?$/i,
  /[/\\](?:entry[/\\])?http-test\.[cm]?[jt]sx?$/i,
  /[/\\]test-profile[/\\]/i,
];

function filesBelow(directory, predicate) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesBelow(absolute, predicate);
    return predicate(absolute) ? [absolute] : [];
  });
}

function normalized(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function mutateSource(relativePath, source, mutation) {
  if (mutation === "undeclared-route" && relativePath.endsWith("src/app/router.tsx")) {
    return `${source}\nconst boundaryRouteMutation = <Route path=\"/scope-leak\" element={<div />} />;\n`;
  }
  if (mutation === "inert-button" && relativePath.endsWith("src/app/router.tsx")) {
    return `${source}\nconst boundaryButtonMutation = <button type=\"button\">Do nothing</button>;\n`;
  }
  if (mutation === "broad-root-import" && relativePath.endsWith("src/app/router.tsx")) {
    return `${source}\nimport \"../../../../css/styles.css\";\n`;
  }
  return source;
}

function mutateVisualSource(source, mutation) {
  if (mutation === "remove-shell-assertion") {
    return source.replace('await expect(page.locator(".workspace-sidebar")).toBeVisible();', "");
  }
  if (mutation === "remove-content-assertion") {
    return source.replace('await expect(page.locator(".workbench-page-header")).toBeVisible();', "");
  }
  if (mutation === "compressed-byte-comparator") {
    return source.replaceAll("compareVisualFrames", "byteDiffRatio");
  }
  if (mutation === "skip-viewport") {
    return source.replace(
      "for (const viewport of VISUAL_VIEWPORTS)",
      "for (const viewport of VISUAL_VIEWPORTS.slice(0, 2))",
    );
  }
  return source;
}

function extractRouteContractPaths(source) {
  return [...source.matchAll(/\bpath:\s*"([^"]+)"/g)].map((match) => match[1]);
}

function assertSourceBoundary(repositoryRoot, mutation) {
  const sourceRoot = path.join(repositoryRoot, "apps/web/src");
  const sourceFiles = filesBelow(sourceRoot, (file) =>
    /\.[cm]?[jt]sx?$/.test(file) && !/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file),
  );
  const sources = new Map(sourceFiles.map((absolute) => {
    const relativePath = normalized(path.relative(repositoryRoot, absolute));
    const original = fs.readFileSync(absolute, "utf8");
    return [relativePath, mutateSource(relativePath, original, mutation)];
  }));

  const routeContracts = sources.get("apps/web/src/app/route-contracts.ts");
  const router = sources.get("apps/web/src/app/router.tsx");
  assert.ok(routeContracts, "Typed React route registry is missing.");
  assert.ok(router, "React router source is missing.");
  assert.deepEqual(
    extractRouteContractPaths(routeContracts),
    EXACT_ROUTE_PATHS,
    "React route registry must remain the exact ordered 17-surface set.",
  );

  const declaredPaths = new Set(EXACT_ROUTE_PATHS);
  for (const match of router.matchAll(/<Route\b[^>]*\bpath="([^"]+)"/g)) {
    assert.ok(
      match[1] === "*" || declaredPaths.has(match[1]),
      `Router contains undeclared React path: ${match[1]}`,
    );
  }
  assert.match(router, /ROLE_ENTRIES\.map\(/, "Role entries must be generated from the declared registry.");
  assert.doesNotMatch(
    router,
    /RoleEntryPlaceholder|candidate React entry route|coming soon/i,
    "Router contains a visible placeholder route or label.",
  );

  for (const [relativePath, source] of sources) {
    assert.doesNotMatch(
      source,
      /(?:from\s*|import\s*)["'][^"']*(?:[/\\]css[/\\]styles\.css|[/\\]js[/\\])[^"']*["']/i,
      `React source imports protected root runtime code: ${relativePath}`,
    );
    for (const openingTag of source.matchAll(/<button\b([^>]*)>/g)) {
      const attributes = openingTag[1];
      const actionable = /\bon[A-Z]\w*\s*=|\bdisabled(?:\s*=|\s|$)|\btype\s*=\s*["'](?:submit|reset)["']|\bformAction\s*=|\{/i.test(attributes);
      assert.ok(actionable, `React source contains an inert button in ${relativePath}: ${openingTag[0]}`);
    }
  }

  const brandRegistrySource = sources.get("apps/web/src/ui/brand-assets.ts");
  assert.ok(brandRegistrySource, "Semantic brand registry is missing.");
  for (const basename of BRAND_ASSET_BASENAMES) {
    assert.match(
      brandRegistrySource,
      new RegExp(`/${basename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`),
      `Semantic brand registry is missing ${basename}.`,
    );
  }
}

export function assertBuildInputBoundary(profile, inputs) {
  assert.ok(Array.isArray(inputs), `${profile} build-input inventory must be an array.`);
  for (const input of inputs) {
    assert.doesNotMatch(input, /[/\\]css[/\\]styles\.css$/i, `${profile} build imports root CSS: ${input}`);
    assert.doesNotMatch(input, /[/\\]js[/\\]/i, `${profile} build imports root JavaScript: ${input}`);
    if (profile === "http") {
      for (const forbidden of HTTP_FORBIDDEN_INPUTS) {
        assert.doesNotMatch(input, forbidden, `HTTP build imports forbidden mock/test input: ${input}`);
      }
    }
  }
}

function assertBuildBoundary(repositoryRoot, mutation) {
  for (const profile of ["demo", "http"]) {
    const artifactRoot = path.join(repositoryRoot, `apps/web/dist/${profile}`);
    assertAppShellArtifact(artifactRoot);
    const inputsPath = path.join(artifactRoot, "build-inputs.json");
    const viteManifestPath = path.join(artifactRoot, ".vite/manifest.json");
    assert.ok(fs.existsSync(inputsPath), `${profile} build-inputs.json is missing.`);
    assert.ok(fs.existsSync(viteManifestPath), `${profile} Vite manifest is missing.`);
    const buildInputs = JSON.parse(fs.readFileSync(inputsPath, "utf8"));
    assert.equal(buildInputs.profile, profile, `${profile} input profile is stale.`);
    const inputs = [...buildInputs.inputs];
    if (profile === "http" && mutation === "http-mock-import") {
      inputs.push(path.join(repositoryRoot, "apps/web/src/mock/seed-data.ts"));
    }
    assertBuildInputBoundary(profile, inputs);
    const viteManifest = fs.readFileSync(viteManifestPath, "utf8");
    assert.doesNotMatch(viteManifest, /(?:src[/\\]mock|seed-data|css[/\\]styles\.css|[/\\]js[/\\])/i);
  }
  assertHttpArtifact(path.join(repositoryRoot, "apps/web/dist/http"));
}

export function assertVisualHarnessSource(source) {
  assert.doesNotMatch(source, /byteDiffRatio/, "Visual parity must compare decoded pixels, not compressed PNG bytes.");
  for (const required of [
    "decodePngFrame",
    "compareVisualFrames",
    "visualComparisonRegions",
    'const surfaces = [...VISUAL_SURFACES]',
    "for (const viewport of VISUAL_VIEWPORTS)",
    "for (const surface of surfaces)",
    'testInfo.attach("react-candidate-viewport"',
    'testInfo.attach("decoded-pixel-region-results"',
    'await expect(page.locator(".workspace-sidebar")).toBeVisible();',
    'await expect(page.locator(".application-topbar")).toBeVisible();',
    'await expect(page.locator(".workspace-content")).toBeVisible();',
    'await expect(page.locator(".workbench-page-header")).toBeVisible();',
  ]) {
    assert.ok(source.includes(required), `Visual parity harness is missing fail-closed contract: ${required}`);
  }
  for (const bypass of ["resolveFocusedSurfaces", "resolveVisualRegions", "shellOnly", "AVIA_VISUAL_SURFACES", "AVIA_VISUAL_REGIONS"]) {
    assert.ok(!source.includes(bypass), `Visual parity harness can bypass the 51-pair matrix via ${bypass}.`);
  }
  assert.match(source, /for \(const comparison of comparisons\)[\s\S]*?comparison\.passed/, "Decoded region results are not asserted.");
}

export function assertParityBoundary(options = {}) {
  const repositoryRoot = path.resolve(options.repositoryRoot ?? defaultRepositoryRoot);
  const mutation = options.mutation ?? null;
  assertSourceBoundary(repositoryRoot, mutation);

  const visualSpecPath = path.join(repositoryRoot, "apps/web/tests/e2e/legacy-visual-parity.spec.ts");
  assert.ok(fs.existsSync(visualSpecPath), "Visual parity spec is missing.");
  const visualSource = mutateVisualSource(fs.readFileSync(visualSpecPath, "utf8"), mutation);
  assertVisualHarnessSource(visualSource);

  if (options.requireBuilds !== false) {
    assertBuildBoundary(repositoryRoot, mutation);
  } else if (mutation === "http-mock-import") {
    assertBuildInputBoundary("http", [path.join(repositoryRoot, "apps/web/src/mock/seed-data.ts")]);
  }

  return { routes: EXACT_ROUTE_PATHS.length, profiles: options.requireBuilds === false ? 0 : 2 };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === scriptPath) {
  const result = assertParityBoundary({
    mutation: process.env.AVIA_BOUNDARY_MUTATION,
    requireBuilds: process.env.AVIA_BOUNDARY_SOURCE_ONLY !== "1",
  });
  console.log(`parity-boundary-scan: ok (${result.routes} routes, ${result.profiles} build profiles)`);
}
