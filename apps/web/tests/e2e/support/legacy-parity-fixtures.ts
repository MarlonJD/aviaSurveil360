import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

import { expect, type Page } from "@playwright/test";

import type { ReactSurfaceId } from "../../../src/app/route-contracts";
import type { VisualParityMode } from "../../../src/parity/legacy-screen-manifest";

export const VISUAL_FIXED_TIME_ISO = "2026-06-15T09:00:00.000Z";
export const VISUAL_BASELINE_VERSION = "react-legacy-parity-v1";
export const VISUAL_BASELINE_ROOT = "apps/web/tests/visual-baselines/react-legacy-parity";
export const VISUAL_LEGACY_BASE_URL = "http://127.0.0.1:4173";
export const VISUAL_REACT_BASE_URL = "http://127.0.0.1:4174";

export type VisualViewportId = "desktop" | "tablet" | "mobile";
export type VisualRegionFilter = "all" | "shell";

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Size {
  x: number;
  y: number;
}

export interface RegionRect extends Rect {
  id: string;
}

export interface RectMask {
  selector: string;
  rationale: string;
  expectedCount: number;
  rects: Rect[];
}

export interface VisualFrame extends Size {
  data: Uint8ClampedArray;
}

export interface VisualComparisonResult {
  passed: boolean;
  diffPixels: number;
  comparedPixels: number;
  diffPixelRatio: number;
}

export interface LegacyRouteFixture {
  role: string | null;
  view: string;
  params: Record<string, string>;
}

export interface VisualSurfaceFixture {
  id: ReactSurfaceId;
  auditId: string;
  parityMode: VisualParityMode;
  reactPath: string;
  legacy: LegacyRouteFixture;
  stableSelector: string;
  expectedHeading: string;
  expectedRoleText: string | null;
  expectedOwnerText: string | null;
  expectedNextActionText: string | null;
  expectedStatusText: string | null;
  expectedDueDateText: string | null;
  expectedPrimaryActionText: string | null;
  expectedPrivacyAbsence: string[];
  contentAdaptationReason?: string;
  masks: RectMask[];
}

export interface BaselineManifestSource {
  commit: string;
  files: Record<string, string>;
  auditDocument: {
    path: string;
    sha256: string;
  };
  packageLockSha256: string;
}

export interface BaselineManifestEnvironment {
  playwrightVersion: string;
  chromiumVersion: string;
  nodeVersion: string;
  platform: NodeJS.Platform | string;
  arch: NodeJS.Architecture | string;
  osRelease: string;
}

export interface BaselineManifestItem {
  auditId: string;
  surfaceId: ReactSurfaceId;
  parityMode: VisualParityMode;
  viewport: VisualViewportId | string;
  viewportSize: Size;
  file: string;
  sha256: string;
  sourceRoute: {
    legacyView: string;
    legacyParams: Record<string, string>;
    reactPath: string;
  };
}

export interface BaselineManifest {
  schemaVersion: 1;
  generatedAt: string;
  baselineVersion: string;
  surfaceCount: number;
  viewportCount: number;
  source: BaselineManifestSource;
  environment: BaselineManifestEnvironment;
  items: BaselineManifestItem[];
}

export interface ValidateBaselineManifestOptions {
  baselineDir: string;
  expectedSource?: BaselineManifestSource;
  expectedEnvironment?: BaselineManifestEnvironment;
  expectedSurfaces?: ReadonlyMap<ReactSurfaceId, VisualSurfaceFixture>;
  expectedViewports?: ReadonlyMap<string, Size>;
}

export const VISUAL_VIEWPORTS = [
  { id: "desktop", width: 1440, height: 900 },
  { id: "tablet", width: 1024, height: 768 },
  { id: "mobile", width: 390, height: 844 },
] as const;

export const VISUAL_VIEWPORT_BY_ID = new Map<string, Size>(
  VISUAL_VIEWPORTS.map((viewport) => [viewport.id, viewport]),
);

export const LEGACY_SOURCE_HASH_FILES = [
  "index.html",
  "css/styles.css",
  "js/app.js",
  "js/views.js",
  "js/data.js",
] as const;

export const LEGACY_AUDIT_DOCUMENT = "docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md";
export const APP_PACKAGE_LOCK = "apps/web/package-lock.json";

export const VISUAL_SURFACES: readonly VisualSurfaceFixture[] = [
  {
    id: "role-select",
    auditId: "ui-audit-001",
    parityMode: "strict-shell",
    reactPath: "/",
    legacy: { role: null, view: "login", params: {} },
    stableSelector: ".login-selector",
    expectedHeading: "AviaSurveil360",
    expectedRoleText: null,
    expectedOwnerText: null,
    expectedNextActionText: null,
    expectedStatusText: null,
    expectedDueDateText: null,
    expectedPrimaryActionText: "Explore the clickable demo",
    expectedPrivacyAbsence: ["Internal CAA Note", "Inspector workload", "enforcement deliberation"],
    masks: [],
  },
  {
    id: "inspector-home",
    auditId: "ui-audit-002",
    parityMode: "content-adapted",
    reactPath: "/inspector/inspector-assignments",
    legacy: { role: "inspector", view: "inspector-assignments", params: {} },
    stableSelector: "main.content",
    expectedHeading: "My Assignments",
    expectedRoleText: "Inspector",
    expectedOwnerText: "Aylin Sezer",
    expectedNextActionText: "Start",
    expectedStatusText: "In Progress",
    expectedDueDateText: "15 Jun 2026",
    expectedPrimaryActionText: "Open",
    expectedPrivacyAbsence: ["Internal CAA Note", "enforcement deliberation"],
    contentAdaptationReason: "React may bind the same assignment queue to backend-shaped cards.",
    masks: [],
  },
  {
    id: "lead-home",
    auditId: "ui-audit-013",
    parityMode: "content-adapted",
    reactPath: "/lead-inspector/lead-review",
    legacy: { role: "leadInspector", view: "lead-review", params: { auditId: "AUD-2026-001" } },
    stableSelector: "main.content",
    expectedHeading: "Lead Inspector Review",
    expectedRoleText: "Lead Inspector",
    expectedOwnerText: "Caner Yildiz",
    expectedNextActionText: "review",
    expectedStatusText: "report",
    expectedDueDateText: "15 Jun 2026",
    expectedPrimaryActionText: "Review",
    expectedPrivacyAbsence: ["SkyCargo Air", "enforcement deliberation"],
    contentAdaptationReason: "Potential Finding review uses the accepted lead queue pattern.",
    masks: [],
  },
  {
    id: "manager-home",
    auditId: "ui-audit-027",
    parityMode: "content-adapted",
    reactPath: "/department-manager/dashboard",
    legacy: { role: "manager", view: "dashboard", params: {} },
    stableSelector: "main.content",
    expectedHeading: "Dashboard",
    expectedRoleText: "Department Manager",
    expectedOwnerText: "Mehmet Kaya",
    expectedNextActionText: "overdue",
    expectedStatusText: "Open",
    expectedDueDateText: "Due",
    expectedPrimaryActionText: "Open",
    expectedPrivacyAbsence: ["enforcement deliberation"],
    contentAdaptationReason: "Manager dashboard may adapt KPI content while preserving workbench hierarchy.",
    masks: [],
  },
  {
    id: "gm-home",
    auditId: "ui-audit-052",
    parityMode: "content-adapted",
    reactPath: "/general-manager/gm-dashboard",
    legacy: { role: "gm", view: "gm-dashboard", params: {} },
    stableSelector: "main.content",
    expectedHeading: "General Manager Dashboard",
    expectedRoleText: "General Manager",
    expectedOwnerText: "Okan Demir",
    expectedNextActionText: "review",
    expectedStatusText: "Pending",
    expectedDueDateText: "Due",
    expectedPrimaryActionText: "Open",
    expectedPrivacyAbsence: ["Internal CAA Note", "enforcement deliberation"],
    contentAdaptationReason: "Authority dashboard content can adapt to the current candidate planning read model.",
    masks: [],
  },
  {
    id: "finance-home",
    auditId: "ui-audit-058",
    parityMode: "content-adapted",
    reactPath: "/finance/finance-review",
    legacy: { role: "finance", view: "finance-review", params: {} },
    stableSelector: "main.content",
    expectedHeading: "Finance Review",
    expectedRoleText: "Finance Review",
    expectedOwnerText: "Derya Acar",
    expectedNextActionText: "budget",
    expectedStatusText: "Finance",
    expectedDueDateText: "Target",
    expectedPrimaryActionText: "Approve",
    expectedPrivacyAbsence: ["Internal CAA Note", "enforcement deliberation"],
    contentAdaptationReason: "Finance review preserves approval composition with candidate planning state.",
    masks: [],
  },
  {
    id: "executive-home",
    auditId: "ui-audit-059",
    parityMode: "content-adapted",
    reactPath: "/executive-director/executive-dashboard",
    legacy: { role: "executiveDirector", view: "executive-dashboard", params: {} },
    stableSelector: "main.content",
    expectedHeading: "Executive Director Dashboard",
    expectedRoleText: "Executive Director",
    expectedOwnerText: "Ufuk Aslan",
    expectedNextActionText: "approval",
    expectedStatusText: "Pending",
    expectedDueDateText: "Due",
    expectedPrimaryActionText: "Approve",
    expectedPrivacyAbsence: ["Internal CAA Note", "Inspector workload"],
    contentAdaptationReason: "Executive dashboard preserves final decision hierarchy with candidate data.",
    masks: [],
  },
  {
    id: "auditee-home",
    auditId: "ui-audit-066",
    parityMode: "content-adapted",
    reactPath: "/auditee/service-provider-cap",
    legacy: { role: "auditee", view: "service-provider-cap", params: {} },
    stableSelector: "main.content",
    expectedHeading: "Corrective Actions",
    expectedRoleText: "Service Provider Portal",
    expectedOwnerText: "Fly Namibia",
    expectedNextActionText: "Submit",
    expectedStatusText: "CAP",
    expectedDueDateText: "Due Date",
    expectedPrimaryActionText: "Submit",
    expectedPrivacyAbsence: ["Internal CAA Note", "SkyCargo Air", "Inspector workload"],
    contentAdaptationReason: "Auditee route combines My Findings, CAP, and Evidence request states.",
    masks: [],
  },
  {
    id: "admin-home",
    auditId: "ui-audit-076",
    parityMode: "content-adapted",
    reactPath: "/admin/templates",
    legacy: { role: "admin", view: "template-preview", params: { id: "TPL-CABIN-2026" } },
    stableSelector: "main.content",
    expectedHeading: "Template Preview",
    expectedRoleText: "Administration",
    expectedOwnerText: "Cabin Safety",
    expectedNextActionText: "Expected evidence",
    expectedStatusText: "Published",
    expectedDueDateText: null,
    expectedPrimaryActionText: "Back to templates",
    expectedPrivacyAbsence: ["Inspector workload", "enforcement deliberation"],
    contentAdaptationReason: "Admin home renders the approved published-template preview slice.",
    masks: [],
  },
  {
    id: "audit-detail",
    auditId: "ui-audit-007",
    parityMode: "content-adapted",
    reactPath: "/inspector/audits/AUD-2026-001",
    legacy: { role: "inspector", view: "audit-detail", params: { auditId: "AUD-2026-001" } },
    stableSelector: "main.content",
    expectedHeading: "2026 Cabin Inspection",
    expectedRoleText: "Inspector",
    expectedOwnerText: "Aylin Sezer",
    expectedNextActionText: "Run",
    expectedStatusText: "In Progress",
    expectedDueDateText: "15 Jun 2026",
    expectedPrimaryActionText: "Run",
    expectedPrivacyAbsence: ["Internal CAA Note", "enforcement deliberation"],
    contentAdaptationReason: "Audit detail keeps the same inspection context and action path.",
    masks: [],
  },
  {
    id: "checklist-runner",
    auditId: "ui-audit-008",
    parityMode: "content-adapted",
    reactPath: "/inspector/audits/AUD-2026-001/checklist",
    legacy: {
      role: "inspector",
      view: "checklist",
      params: { auditId: "AUD-2026-001", questionId: "cab-em-eq-pbe" },
    },
    stableSelector: "main.content",
    expectedHeading: "Cabin Inspection",
    expectedRoleText: "Inspector",
    expectedOwnerText: "Aylin Sezer",
    expectedNextActionText: "Submit to Lead Inspector",
    expectedStatusText: "In Progress",
    expectedDueDateText: "15 Jun 2026",
    expectedPrimaryActionText: "Submit",
    expectedPrivacyAbsence: ["Internal CAA Note", "enforcement deliberation"],
    contentAdaptationReason: "Checklist runner uses candidate field state while retaining row/action composition.",
    masks: [],
  },
  {
    id: "organization-registry",
    auditId: "ui-audit-041",
    parityMode: "content-adapted",
    reactPath: "/department-manager/organizations",
    legacy: { role: "manager", view: "organizations", params: {} },
    stableSelector: "main.content",
    expectedHeading: "Organizations",
    expectedRoleText: "Department Manager",
    expectedOwnerText: "Fly Namibia",
    expectedNextActionText: "Open",
    expectedStatusText: "Findings",
    expectedDueDateText: null,
    expectedPrimaryActionText: "Open",
    expectedPrivacyAbsence: ["Internal CAA Note", "enforcement deliberation"],
    contentAdaptationReason: "Registry can adapt row counts while preserving organization workbench layout.",
    masks: [],
  },
  {
    id: "audit-plan",
    auditId: "ui-audit-028",
    parityMode: "content-adapted",
    reactPath: "/department-manager/audit-plan",
    legacy: { role: "manager", view: "planning", params: {} },
    stableSelector: "main.content",
    expectedHeading: "Planning",
    expectedRoleText: "Department Manager",
    expectedOwnerText: "Department Manager",
    expectedNextActionText: "Finance",
    expectedStatusText: "Planning",
    expectedDueDateText: "Target",
    expectedPrimaryActionText: "Open",
    expectedPrivacyAbsence: ["Internal CAA Note", "enforcement deliberation"],
    contentAdaptationReason: "Planning maps to the candidate read-only Audit Plan Calendar state.",
    masks: [],
  },
  {
    id: "finding-detail",
    auditId: "ui-audit-009",
    parityMode: "content-adapted",
    reactPath: "/lead-inspector/findings/FND-CAB-2026-001",
    legacy: { role: "leadInspector", view: "finding", params: { findingId: "CAB-2026-011" } },
    stableSelector: "main.content",
    expectedHeading: "Finding CAB-2026-011",
    expectedRoleText: "Lead Inspector",
    expectedOwnerText: "Fly Namibia",
    expectedNextActionText: "Review CAP",
    expectedStatusText: "CAP Submitted",
    expectedDueDateText: "19 Jun 2026",
    expectedPrimaryActionText: "Review CAP",
    expectedPrivacyAbsence: ["SkyCargo Air", "enforcement deliberation"],
    contentAdaptationReason: "A seeded legacy finding supplies the shared lifecycle dossier without live mutation.",
    masks: [],
  },
  {
    id: "cap-review",
    auditId: "ui-audit-022",
    parityMode: "content-adapted",
    reactPath: "/lead-inspector/cap-review/FND-CAB-2026-001",
    legacy: { role: "leadInspector", view: "cap-review-detail", params: { findingId: "CAB-2026-011" } },
    stableSelector: "main.content",
    expectedHeading: "CAP Review",
    expectedRoleText: "Lead Inspector",
    expectedOwnerText: "Fly Namibia",
    expectedNextActionText: "Accept",
    expectedStatusText: "CAP Submitted",
    expectedDueDateText: "19 Jun 2026",
    expectedPrimaryActionText: "Accept",
    expectedPrivacyAbsence: ["SkyCargo Air", "enforcement deliberation"],
    contentAdaptationReason: "CAP review detail uses a seeded submitted CAP while preserving immutable revision semantics.",
    masks: [],
  },
  {
    id: "evidence-review",
    auditId: "ui-audit-044",
    parityMode: "content-adapted",
    reactPath: "/lead-inspector/evidence-review/FND-CAB-2026-001",
    legacy: { role: "leadInspector", view: "findings", params: { filter: "evreview" } },
    stableSelector: "main.content",
    expectedHeading: "Findings",
    expectedRoleText: "Lead Inspector",
    expectedOwnerText: "Fly Namibia",
    expectedNextActionText: "Review evidence",
    expectedStatusText: "Evidence",
    expectedDueDateText: "Due",
    expectedPrimaryActionText: "Review",
    expectedPrivacyAbsence: ["SkyCargo Air", "enforcement deliberation"],
    contentAdaptationReason: "Evidence review maps to the accepted evidence waiting-review queue pattern.",
    masks: [],
  },
  {
    id: "report-preview",
    auditId: "ui-audit-030",
    parityMode: "content-adapted",
    reactPath: "/department-manager/reports/RPT-CAB-2026-001-V1",
    legacy: { role: "manager", view: "reports-approval", params: { reportId: "PR-2026-018" } },
    stableSelector: "main.content",
    expectedHeading: "Reports Approval",
    expectedRoleText: "Department Manager",
    expectedOwnerText: "Fly Namibia",
    expectedNextActionText: "Review",
    expectedStatusText: "Report",
    expectedDueDateText: null,
    expectedPrimaryActionText: "Preview",
    expectedPrivacyAbsence: ["SkyCargo Air", "Inspector workload"],
    contentAdaptationReason: "Report preview uses the accepted immutable report dossier composition.",
    masks: [],
  },
] as const;

export const VISUAL_SURFACE_BY_ID = new Map<ReactSurfaceId, VisualSurfaceFixture>(
  VISUAL_SURFACES.map((surface) => [surface.id, surface]),
);

export function hashBytes(bytes: Uint8Array | Buffer | string): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function solidFrame(width: number, height: number, color: readonly [number, number, number, number]): VisualFrame {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let offset = 0; offset < data.length; offset += 4) {
    data[offset] = color[0];
    data[offset + 1] = color[1];
    data[offset + 2] = color[2];
    data[offset + 3] = color[3];
  }
  return { width, height, data };
}

export function patchedFrame(
  frame: VisualFrame,
  rect: Rect,
  color: readonly [number, number, number, number],
): VisualFrame {
  const next = { ...frame, data: new Uint8ClampedArray(frame.data) };
  for (let y = rect.y; y < rect.y + rect.height; y += 1) {
    for (let x = rect.x; x < rect.x + rect.width; x += 1) {
      if (x < 0 || y < 0 || x >= frame.width || y >= frame.height) continue;
      const offset = (y * frame.width + x) * 4;
      next.data[offset] = color[0];
      next.data[offset + 1] = color[1];
      next.data[offset + 2] = color[2];
      next.data[offset + 3] = color[3];
    }
  }
  return next;
}

function rectContains(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && y >= rect.y && x < rect.x + rect.width && y < rect.y + rect.height;
}

function isMasked(masks: readonly RectMask[], x: number, y: number): boolean {
  return masks.some((mask) => mask.rects.some((rect) => rectContains(rect, x, y)));
}

export function compareVisualFrames(
  baseline: VisualFrame,
  candidate: VisualFrame,
  options: {
    region: RegionRect;
    masks: readonly RectMask[];
    maxDiffPixelRatio: number;
  },
): VisualComparisonResult {
  if (baseline.width !== candidate.width || baseline.height !== candidate.height) {
    throw new Error("Visual frames must have identical dimensions.");
  }
  validateMaskContract(options.masks, baseline);
  let diffPixels = 0;
  let comparedPixels = 0;
  const xEnd = Math.min(options.region.x + options.region.width, baseline.width);
  const yEnd = Math.min(options.region.y + options.region.height, baseline.height);
  for (let y = Math.max(0, options.region.y); y < yEnd; y += 1) {
    for (let x = Math.max(0, options.region.x); x < xEnd; x += 1) {
      if (isMasked(options.masks, x, y)) continue;
      comparedPixels += 1;
      const offset = (y * baseline.width + x) * 4;
      if (
        baseline.data[offset] !== candidate.data[offset] ||
        baseline.data[offset + 1] !== candidate.data[offset + 1] ||
        baseline.data[offset + 2] !== candidate.data[offset + 2] ||
        baseline.data[offset + 3] !== candidate.data[offset + 3]
      ) {
        diffPixels += 1;
      }
    }
  }
  const diffPixelRatio = comparedPixels ? diffPixels / comparedPixels : 0;
  return {
    passed: diffPixelRatio <= options.maxDiffPixelRatio,
    diffPixels,
    comparedPixels,
    diffPixelRatio,
  };
}

function rejectBroadSelector(selector: string): void {
  const normalized = selector.trim().toLowerCase();
  const broadSelectors = new Set([
    "*",
    "html",
    "body",
    "#root",
    "#app-root",
    ".shell",
    ".sidebar",
    ".topbar",
    ".main",
    ".content",
    ".workspace-shell",
    ".workspace-sidebar",
    ".workspace-content",
    ".work-content",
  ]);
  if (broadSelectors.has(normalized)) {
    throw new Error(`Broad mask selector rejected: ${selector}`);
  }
  if (/(^|[\s>+~])(?:html|body|#root|#app-root|\.shell|\.sidebar|\.topbar|\.workspace-shell|\.workspace-sidebar|\.workspace-content|\.work-content)(?:$|[\s>+~.#:\[])/.test(normalized)) {
    throw new Error(`Broad ancestor mask selector rejected: ${selector}`);
  }
}

export function validateMaskContract(masks: readonly RectMask[], viewport: Size): void {
  const covered = new Uint8Array(viewport.width * viewport.height);
  for (const mask of masks) {
    rejectBroadSelector(mask.selector);
    if (!mask.rationale || mask.rationale.trim().length < 12) {
      throw new Error(`Mask ${mask.selector} must include a written rationale.`);
    }
    if (!Number.isInteger(mask.expectedCount) || mask.expectedCount < 1) {
      throw new Error(`Mask ${mask.selector} must name an exact positive expected count.`);
    }
    if (!mask.rects.length) {
      throw new Error(`Mask ${mask.selector} did not resolve to any rectangles.`);
    }
    for (const rect of mask.rects) {
      if (rect.width <= 0 || rect.height <= 0) {
        throw new Error(`Mask ${mask.selector} resolved to an empty rectangle.`);
      }
      const xStart = Math.max(0, Math.floor(rect.x));
      const yStart = Math.max(0, Math.floor(rect.y));
      const xEnd = Math.min(viewport.width, Math.ceil(rect.x + rect.width));
      const yEnd = Math.min(viewport.height, Math.ceil(rect.y + rect.height));
      for (let y = yStart; y < yEnd; y += 1) {
        for (let x = xStart; x < xEnd; x += 1) {
          covered[y * viewport.width + x] = 1;
        }
      }
    }
  }
  const coveredPixels = covered.reduce((total, value) => total + value, 0);
  const ratio = coveredPixels / (viewport.width * viewport.height);
  if (ratio > 0.05) {
    throw new Error(`Mask coverage ${ratio.toFixed(4)} exceeds the 5% viewport limit.`);
  }
}

export function validateGeometrySnapshot(
  baseline: Record<string, Rect>,
  candidate: Record<string, Rect>,
  tolerancePx = 2,
): void {
  for (const key of ["shell", "sidebar", "topbar", "content"] as const) {
    if (!baseline[key] || !candidate[key]) {
      throw new Error(`${key} geometry is missing from the snapshot.`);
    }
    for (const field of ["x", "y", "width", "height"] as const) {
      const delta = Math.abs(baseline[key][field] - candidate[key][field]);
      if (delta > tolerancePx) {
        throw new Error(`${key} geometry ${field} shifted by ${delta}px.`);
      }
    }
  }
}

export function assertViewportScreenshotContract(input: {
  fullPage: boolean;
  viewport: Size;
  imageSize: Size;
}): void {
  if (input.fullPage) {
    throw new Error("Comparator screenshots must use fullPage:false.");
  }
  if (input.viewport.width !== input.imageSize.width || input.viewport.height !== input.imageSize.height) {
    throw new Error(
      `Comparator screenshot size ${input.imageSize.width}x${input.imageSize.height} does not match viewport ${input.viewport.width}x${input.viewport.height}.`,
    );
  }
}

export function assertBaselineUpdateMode(input: {
  command: string;
  env: Pick<NodeJS.ProcessEnv, "AVIA_UPDATE_LEGACY_BASELINES">;
}): void {
  const wantsUpdate = input.env.AVIA_UPDATE_LEGACY_BASELINES === "1";
  if (wantsUpdate && input.command !== "visual:baseline:update") {
    throw new Error("Only visual:baseline:update may rewrite visual baselines.");
  }
  if (input.command === "visual:baseline:update" && !wantsUpdate) {
    throw new Error("visual:baseline:update requires AVIA_UPDATE_LEGACY_BASELINES=1.");
  }
}

export function resolveFocusedSurfaces(value = process.env.AVIA_VISUAL_SURFACES): VisualSurfaceFixture[] {
  if (value === undefined) return [...VISUAL_SURFACES];
  if (value.trim() === "") throw new Error("AVIA_VISUAL_SURFACES cannot be empty.");
  const seen = new Set<string>();
  return value.split(",").map((raw) => {
    const id = raw.trim();
    if (!id) throw new Error("AVIA_VISUAL_SURFACES contains an empty surface id.");
    if (seen.has(id)) throw new Error(`Duplicate visual surface filter: ${id}`);
    seen.add(id);
    const surface = VISUAL_SURFACE_BY_ID.get(id as ReactSurfaceId);
    if (!surface) throw new Error(`Unknown visual surface filter: ${id}`);
    return surface;
  });
}

export function resolveVisualRegions(
  value = process.env.AVIA_VISUAL_REGIONS,
  options: { allowShellOnly?: boolean } = {},
): VisualRegionFilter[] {
  if (value === undefined) return ["all"];
  if (value.trim() === "") throw new Error("AVIA_VISUAL_REGIONS cannot be empty.");
  if (value === "shell") {
    if (!options.allowShellOnly) {
      throw new Error("AVIA_VISUAL_REGIONS=shell is reserved for Task 6 shell checkpoint.");
    }
    return ["shell"];
  }
  throw new Error(`Unsupported AVIA_VISUAL_REGIONS value: ${value}`);
}

function safeBaselinePath(baselineDir: string, relativeFile: string): string {
  if (relativeFile.startsWith("/") || relativeFile.includes("..") || relativeFile.split(/[\\/]/).some((part) => part === "")) {
    throw new Error(`Unsafe baseline path: ${relativeFile}`);
  }
  const absolute = resolve(baselineDir, relativeFile);
  const rel = relative(resolve(baselineDir), absolute);
  if (rel.startsWith("..") || rel === "" || rel.split(sep)[0] === "..") {
    throw new Error(`Baseline path escapes root: ${relativeFile}`);
  }
  return absolute;
}

function listPngFiles(dir: string, base = dir): string[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir).sort();
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = resolve(dir, entry);
    const rel = relative(base, absolute).split(sep).join("/");
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      files.push(...listPngFiles(absolute, base));
    } else if (entry.endsWith(".png")) {
      files.push(rel);
    }
  }
  return files;
}

function compareRecord(label: string, actual: Record<string, string>, expected: Record<string, string>): void {
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  if (actualKeys.join("\n") !== expectedKeys.join("\n")) {
    throw new Error(`${label} metadata keys mismatch.`);
  }
  for (const key of expectedKeys) {
    if (actual[key] !== expected[key]) {
      throw new Error(`${label} metadata mismatch for ${key}.`);
    }
  }
}

export function validateBaselineManifest(manifest: BaselineManifest, options: ValidateBaselineManifestOptions): void {
  if (manifest.schemaVersion !== 1) throw new Error("Unsupported baseline manifest schema.");
  if (manifest.baselineVersion !== VISUAL_BASELINE_VERSION) {
    throw new Error(`Unexpected baseline version: ${manifest.baselineVersion}`);
  }
  if (!Array.isArray(manifest.items) || !manifest.items.length) {
    throw new Error("Baseline manifest has no items.");
  }
  const surfaceIds = new Set(manifest.items.map((item) => item.surfaceId));
  const viewportIds = new Set(manifest.items.map((item) => item.viewport));
  if (manifest.surfaceCount !== surfaceIds.size) {
    throw new Error("Baseline manifest surface count is stale.");
  }
  if (manifest.viewportCount !== viewportIds.size) {
    throw new Error("Baseline manifest viewport count is stale.");
  }

  if (options.expectedSource) {
    compareRecord("source", manifest.source.files, options.expectedSource.files);
    if (manifest.source.auditDocument.path !== options.expectedSource.auditDocument.path) {
      throw new Error("source metadata mismatch for audit document path.");
    }
    if (manifest.source.auditDocument.sha256 !== options.expectedSource.auditDocument.sha256) {
      throw new Error("source metadata mismatch for audit document hash.");
    }
    if (manifest.source.packageLockSha256 !== options.expectedSource.packageLockSha256) {
      throw new Error("package-lock metadata mismatch.");
    }
  }
  if (options.expectedEnvironment) {
    for (const key of Object.keys(options.expectedEnvironment) as Array<keyof BaselineManifestEnvironment>) {
      if (manifest.environment[key] !== options.expectedEnvironment[key]) {
        throw new Error(`${key} metadata mismatch.`);
      }
    }
  }

  const seenKeys = new Set<string>();
  const seenFiles = new Set<string>();
  for (const item of manifest.items) {
    const key = `${item.surfaceId}/${item.viewport}`;
    if (seenKeys.has(key)) throw new Error(`Duplicate baseline item: ${key}`);
    seenKeys.add(key);
    if (seenFiles.has(item.file)) throw new Error(`Duplicate baseline file: ${item.file}`);
    seenFiles.add(item.file);

    const surface = options.expectedSurfaces?.get(item.surfaceId);
    if (surface) {
      if (item.auditId !== surface.auditId) throw new Error(`Route mismatch for ${item.surfaceId}: audit id.`);
      if (item.parityMode !== surface.parityMode) throw new Error(`Route mismatch for ${item.surfaceId}: parity mode.`);
      if (item.sourceRoute.reactPath !== surface.reactPath) throw new Error(`Route mismatch for ${item.surfaceId}: React path.`);
      if (item.sourceRoute.legacyView !== surface.legacy.view) throw new Error(`Route mismatch for ${item.surfaceId}: legacy view.`);
      if (JSON.stringify(item.sourceRoute.legacyParams) !== JSON.stringify(surface.legacy.params)) {
        throw new Error(`Route mismatch for ${item.surfaceId}: legacy params.`);
      }
    }

    const viewport = options.expectedViewports?.get(item.viewport);
    if (viewport && (item.viewportSize.width !== viewport.width || item.viewportSize.height !== viewport.height)) {
      throw new Error(`Viewport metadata mismatch for ${item.surfaceId}/${item.viewport}.`);
    }

    const absolute = safeBaselinePath(options.baselineDir, item.file);
    if (!existsSync(absolute)) throw new Error(`Missing baseline PNG: ${item.file}`);
    const realHash = hashBytes(readFileSync(absolute));
    if (realHash !== item.sha256) {
      throw new Error(`Baseline hash drift for ${item.file}.`);
    }
  }

  const extraFiles = listPngFiles(options.baselineDir).filter((file) => !seenFiles.has(file));
  if (extraFiles.length) {
    throw new Error(`Unexpected extra baseline PNG file(s): ${extraFiles.join(", ")}`);
  }
}

export function byteDiffRatio(baseline: Uint8Array, candidate: Uint8Array): number {
  const max = Math.max(baseline.length, candidate.length);
  if (!max) return 0;
  let diff = Math.abs(baseline.length - candidate.length);
  const shared = Math.min(baseline.length, candidate.length);
  for (let index = 0; index < shared; index += 1) {
    if (baseline[index] !== candidate[index]) diff += 1;
  }
  return diff / max;
}

export function maxDiffForSurface(surface: VisualSurfaceFixture): number {
  return surface.parityMode === "strict-shell" ? 0.03 : 0.08;
}

export async function installDeterministicPageState(page: Page): Promise<void> {
  await page.clock.install({ time: new Date(VISUAL_FIXED_TIME_ISO) });
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

export async function clearOriginStorage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    if ("caches" in window) {
      for (const key of await window.caches.keys()) await window.caches.delete(key);
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  });
}

export async function disableVisualNoise(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        animation-iteration-count: 1 !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
      *::selection { background: transparent !important; color: inherit !important; }
    `,
  });
}

export async function waitForStableVisualState(page: Page, stableSelector: string): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => undefined);
  await page.waitForFunction(() => document.fonts.ready.then(() => true));
  await page.evaluate(async () => {
    const images = [...document.images];
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
  });
  await expect(page.locator(stableSelector).first()).toBeVisible();
}

export async function driveLegacySurface(page: Page, surface: VisualSurfaceFixture): Promise<void> {
  await page.goto(VISUAL_LEGACY_BASE_URL);
  await clearOriginStorage(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.evaluate((fixture) => {
    const win = window as typeof window & {
      clearDemoState?: () => void;
      initializeState?: () => void;
      normalizeViewForRole?: () => void;
      render?: () => void;
      state?: {
        role: string | null;
        view: string;
        params: Record<string, string>;
        selectedFilters?: Record<string, string>;
        managerReportsUi?: { selectedReportId?: string; tab?: string };
        serviceProviderUi?: { cap?: { selectedFindingId?: string } };
        ui?: { notifOpen?: boolean; menuOpen?: boolean };
      };
    };
    win.clearDemoState?.();
    win.initializeState?.();
    if (!win.state) throw new Error("Legacy state was not initialized.");
    win.state.role = fixture.role;
    win.state.view = fixture.view;
    win.state.params = { ...fixture.params };
    if (fixture.params.filter) {
      win.state.selectedFilters = { ...(win.state.selectedFilters ?? {}), [fixture.view]: fixture.params.filter };
      if (fixture.view === "findings") win.state.selectedFilters.findings = fixture.params.filter;
    }
    if (fixture.params.reportId && win.state.managerReportsUi) {
      win.state.managerReportsUi.selectedReportId = fixture.params.reportId;
      win.state.managerReportsUi.tab = "summary";
    }
    if (fixture.params.findingId && win.state.serviceProviderUi?.cap) {
      win.state.serviceProviderUi.cap.selectedFindingId = fixture.params.findingId;
    }
    if (win.state.ui) {
      win.state.ui.notifOpen = false;
      win.state.ui.menuOpen = false;
    }
    win.normalizeViewForRole?.();
    win.render?.();
  }, surface.legacy);
  await disableVisualNoise(page);
  await waitForStableVisualState(page, surface.stableSelector);
}

export async function driveReactSurface(page: Page, surface: VisualSurfaceFixture): Promise<void> {
  await page.goto(`${VISUAL_REACT_BASE_URL}${surface.reactPath}`);
  await clearOriginStorage(page).catch(() => undefined);
  await disableVisualNoise(page);
  await waitForStableVisualState(page, "#root");
}

export async function assertSurfaceSemantics(page: Page, surface: VisualSurfaceFixture): Promise<void> {
  const body = page.locator("body");
  await expect(body).toContainText(surface.expectedHeading);
  if (surface.expectedRoleText) await expect(body).toContainText(surface.expectedRoleText);
  if (surface.expectedOwnerText) await expect(body).toContainText(surface.expectedOwnerText);
  if (surface.expectedNextActionText) await expect(body).toContainText(surface.expectedNextActionText);
  if (surface.expectedStatusText) await expect(body).toContainText(surface.expectedStatusText);
  if (surface.expectedDueDateText) await expect(body).toContainText(surface.expectedDueDateText);
  if (surface.expectedPrimaryActionText) await expect(body).toContainText(surface.expectedPrimaryActionText);
  for (const forbidden of surface.expectedPrivacyAbsence) {
    await expect(body).not.toContainText(forbidden);
  }
}
