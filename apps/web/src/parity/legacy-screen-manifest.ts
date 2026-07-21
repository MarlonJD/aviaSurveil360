import type { Role } from "../backend/backend";
import {
  REACT_ROUTE_CONTRACT_BY_ID,
  type DataBoundary,
  type ReactSurfaceId,
} from "../app/route-contracts";
import legacyScreenSourceJson from "./legacy-screen-source.json";

export type LegacyDisposition =
  | "react-parity"
  | "later-legacy-only"
  | "demo-only-legacy";

export type VisualParityMode = "strict-shell" | "content-adapted";

export type { DataBoundary, ReactSurfaceId };

export interface LegacyScreenSourceTuple {
  auditId: string;
  role: string;
  screenName: string;
}

export interface LegacyScreenContract extends LegacyScreenSourceTuple {
  legacyView: string;
  legacyParams: Readonly<Record<string, string>>;
  reactSurfaceId: ReactSurfaceId | null;
  reactPath: string | null;
  disposition: LegacyDisposition;
  dataBoundary: DataBoundary | null;
  parityMode: VisualParityMode | null;
  productAuthority: readonly string[];
  sourceEvidence: readonly string[];
  referenceScreenshotIds: readonly string[];
  reason: string;
}

export interface ProductScreenCrosswalk {
  outcome: string;
  delivery: "react-parity" | "legacy-only";
  reactSurfaceIds: readonly ReactSurfaceId[];
  sourceAuditIds: readonly string[];
  disposition: string;
}

interface ReactMapping {
  reactSurfaceId: ReactSurfaceId;
  parityMode: VisualParityMode;
  authority?: readonly string[];
  evidence?: readonly string[];
  reason: string;
}

const sourceRows = legacyScreenSourceJson as readonly LegacyScreenSourceTuple[];

const defaultProductAuthority = [
  "AGENTS.md",
  "docs/product-specs/screen-specs/SCREEN_INVENTORY_AND_FORMS.md",
  "docs/product-specs/index.md",
] as const;

const defaultSourceEvidence = [
  "docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md",
  "index.html",
  "css/styles.css",
  "js/app.js",
  "js/views.js",
] as const;

const reactMappings: Readonly<Record<string, ReactMapping>> = {
  "ui-audit-001": {
    reactSurfaceId: "role-select",
    parityMode: "strict-shell",
    reason: "Accepted role-selection composition is the login/session entry for the React candidate.",
  },
  "ui-audit-002": {
    reactSurfaceId: "inspector-home",
    parityMode: "content-adapted",
    reason: "Inspector home covers the repo-required Inspector Dashboard and assignment queue.",
  },
  "ui-audit-007": {
    reactSurfaceId: "audit-detail",
    parityMode: "content-adapted",
    reason: "Audit Detail is already routed and remains a direct contextual Inspector surface.",
  },
  "ui-audit-008": {
    reactSurfaceId: "checklist-runner",
    parityMode: "content-adapted",
    reason: "Checklist Runner is already routed and owns the backend plus field local boundary.",
  },
  "ui-audit-009": {
    reactSurfaceId: "finding-detail",
    parityMode: "content-adapted",
    reason: "Finding Detail supplies the lifecycle dossier used by CAA review surfaces.",
  },
  "ui-audit-013": {
    reactSurfaceId: "lead-home",
    parityMode: "content-adapted",
    reason: "Lead Assigned Audits provides the accepted queue pattern for Potential Finding review.",
  },
  "ui-audit-022": {
    reactSurfaceId: "cap-review",
    parityMode: "content-adapted",
    reason: "Lead CAP Review Detail maps to the direct CAP review route after Task 2 reads exist.",
  },
  "ui-audit-027": {
    reactSurfaceId: "manager-home",
    parityMode: "content-adapted",
    reason: "Manager Dashboard answers the core exposure, delay, and workload questions.",
  },
  "ui-audit-028": {
    reactSurfaceId: "audit-plan",
    parityMode: "content-adapted",
    reason: "Department Manager Planning maps to the read-only Audit Plan Calendar in this candidate.",
  },
  "ui-audit-030": {
    reactSurfaceId: "report-preview",
    parityMode: "content-adapted",
    reason: "Reports Approval supplies the immutable report dossier and manager decision composition.",
  },
  "ui-audit-041": {
    reactSurfaceId: "organization-registry",
    parityMode: "content-adapted",
    reason: "Organizations is an approved first-production route family already routed in React.",
  },
  "ui-audit-044": {
    reactSurfaceId: "evidence-review",
    parityMode: "content-adapted",
    reason: "Inspection Evidence supplies the accepted Evidence dossier pattern for CAA review.",
  },
  "ui-audit-052": {
    reactSurfaceId: "gm-home",
    parityMode: "content-adapted",
    reason: "General Manager Dashboard is one of the already-routed authority review homes.",
  },
  "ui-audit-058": {
    reactSurfaceId: "finance-home",
    parityMode: "content-adapted",
    reason: "Finance Review is the already-routed budget decision workspace.",
  },
  "ui-audit-059": {
    reactSurfaceId: "executive-home",
    parityMode: "content-adapted",
    reason: "Executive Dashboard is the accepted final decision home for this candidate route.",
  },
  "ui-audit-066": {
    reactSurfaceId: "auditee-home",
    parityMode: "content-adapted",
    reason: "Auditee Corrective Actions covers My Findings, CAP, and Evidence request states.",
  },
  "ui-audit-076": {
    reactSurfaceId: "admin-home",
    parityMode: "content-adapted",
    reason: "Template Preview maps to the Admin checklist-template preview route after Task 3 reads exist.",
  },
};

const demoOnlyAuditIds = new Set([
  "ui-audit-011",
  "ui-audit-025",
  "ui-audit-036",
  "ui-audit-037",
  "ui-audit-038",
  "ui-audit-039",
  "ui-audit-040",
  "ui-audit-043",
  "ui-audit-074",
  "ui-audit-077",
  "ui-audit-078",
  "ui-audit-080",
  "ui-audit-082",
  "ui-audit-083",
]);

function legacyReason(row: LegacyScreenSourceTuple): string {
  if (row.auditId >= "ui-audit-047" && row.auditId <= "ui-audit-051") {
    return "New Inspection Planning Intake remains legacy-only because no accepted React create vertical exists in this plan.";
  }
  if (demoOnlyAuditIds.has(row.auditId)) {
    return "This accepted legacy state is demo-only or advanced scope and is not promoted in the current 17-route candidate.";
  }
  return "This accepted legacy state remains reachable only in the root demo until Product approves a complete route-family slice.";
}

export const LEGACY_SCREEN_SOURCE: readonly LegacyScreenSourceTuple[] = sourceRows;

export const LEGACY_SCREEN_MANIFEST: readonly LegacyScreenContract[] = sourceRows.map((row) => {
  const mapping = reactMappings[row.auditId];
  if (!mapping) {
    return {
      ...row,
      legacyView: row.screenName,
      legacyParams: { auditId: row.auditId },
      reactSurfaceId: null,
      reactPath: null,
      disposition: demoOnlyAuditIds.has(row.auditId) ? "demo-only-legacy" : "later-legacy-only",
      dataBoundary: null,
      parityMode: null,
      productAuthority: defaultProductAuthority,
      sourceEvidence: defaultSourceEvidence,
      referenceScreenshotIds: [],
      reason: legacyReason(row),
    };
  }

  const route = REACT_ROUTE_CONTRACT_BY_ID.get(mapping.reactSurfaceId);
  if (!route) {
    throw new Error(`Missing route contract for ${mapping.reactSurfaceId}.`);
  }

  return {
    ...row,
    legacyView: row.screenName,
    legacyParams: { auditId: row.auditId },
    reactSurfaceId: mapping.reactSurfaceId,
    reactPath: route.path,
    disposition: "react-parity",
    dataBoundary: route.dataBoundary,
    parityMode: mapping.parityMode,
    productAuthority: mapping.authority ?? defaultProductAuthority,
    sourceEvidence: mapping.evidence ?? defaultSourceEvidence,
    referenceScreenshotIds: [row.auditId],
    reason: mapping.reason,
  };
});

export const PRODUCT_SCREEN_CROSSWALK: readonly ProductScreenCrosswalk[] = [
  {
    outcome: "Role switch / login",
    delivery: "react-parity",
    reactSurfaceIds: ["role-select"],
    sourceAuditIds: ["ui-audit-001"],
    disposition: "Delivered as the candidate session/role entry.",
  },
  {
    outcome: "Manager Dashboard",
    delivery: "react-parity",
    reactSurfaceIds: ["manager-home"],
    sourceAuditIds: ["ui-audit-027"],
    disposition: "Delivered as Department Manager Dashboard.",
  },
  {
    outcome: "Inspector Dashboard",
    delivery: "react-parity",
    reactSurfaceIds: ["inspector-home"],
    sourceAuditIds: ["ui-audit-002"],
    disposition: "Delivered as Inspector My Assignments.",
  },
  {
    outcome: "Audit Plan Calendar",
    delivery: "react-parity",
    reactSurfaceIds: ["audit-plan"],
    sourceAuditIds: ["ui-audit-028"],
    disposition: "Delivered as read-only Department Manager Planning calendar/list state.",
  },
  {
    outcome: "Audit Detail",
    delivery: "react-parity",
    reactSurfaceIds: ["audit-detail"],
    sourceAuditIds: ["ui-audit-007"],
    disposition: "Delivered as contextual Inspector Audit Detail.",
  },
  {
    outcome: "Checklist Runner",
    delivery: "react-parity",
    reactSurfaceIds: ["checklist-runner"],
    sourceAuditIds: ["ui-audit-008"],
    disposition: "Delivered with backend plus field local boundary.",
  },
  {
    outcome: "Finding Detail with lifecycle stepper",
    delivery: "react-parity",
    reactSurfaceIds: ["finding-detail"],
    sourceAuditIds: ["ui-audit-009"],
    disposition: "Delivered as a shared lifecycle dossier for the canonical Finding.",
  },
  {
    outcome: "Auditee My Findings",
    delivery: "react-parity",
    reactSurfaceIds: ["auditee-home"],
    sourceAuditIds: ["ui-audit-066"],
    disposition: "Delivered inside the Auditee Corrective Actions workspace.",
  },
  {
    outcome: "CAP Submission Form",
    delivery: "react-parity",
    reactSurfaceIds: ["auditee-home"],
    sourceAuditIds: ["ui-audit-066"],
    disposition: "Delivered as a versioned CAP submission state inside Auditee Corrective Actions.",
  },
  {
    outcome: "Evidence Upload / Review",
    delivery: "react-parity",
    reactSurfaceIds: ["auditee-home", "evidence-review"],
    sourceAuditIds: ["ui-audit-066", "ui-audit-044"],
    disposition: "Delivered through Auditee online Evidence submission/history and CAA Evidence review.",
  },
  {
    outcome: "Closed Finding / Report Preview",
    delivery: "react-parity",
    reactSurfaceIds: ["finding-detail", "report-preview"],
    sourceAuditIds: ["ui-audit-009", "ui-audit-030"],
    disposition: "Delivered through closed Finding lifecycle state and immutable report dossier.",
  },
  {
    outcome: "Admin Checklist Template Preview",
    delivery: "react-parity",
    reactSurfaceIds: ["admin-home"],
    sourceAuditIds: ["ui-audit-076"],
    disposition: "Delivered after Task 3 adds the detail read contract.",
  },
  {
    outcome: "New Inspection Planning Intake",
    delivery: "legacy-only",
    reactSurfaceIds: [],
    sourceAuditIds: [
      "ui-audit-028",
      "ui-audit-047",
      "ui-audit-048",
      "ui-audit-049",
      "ui-audit-050",
      "ui-audit-051",
    ],
    disposition: "Legacy-only in this plan; no React create/intake route or control may appear.",
  },
];

export function routeRoleForSurface(surfaceId: ReactSurfaceId): Role | null {
  return REACT_ROUTE_CONTRACT_BY_ID.get(surfaceId)?.requiredRole ?? null;
}
