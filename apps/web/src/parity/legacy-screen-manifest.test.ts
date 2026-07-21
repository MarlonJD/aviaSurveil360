import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { REACT_ROUTE_CONTRACT_BY_ID } from "../app/route-contracts";
import {
  LEGACY_SCREEN_MANIFEST,
  LEGACY_SCREEN_SOURCE,
  PRODUCT_SCREEN_CROSSWALK,
  routeRoleForSurface,
} from "./legacy-screen-manifest";

interface AuditTuple {
  auditId: string;
  role: string;
  screenName: string;
}

const repoRoot = resolve(import.meta.dirname, "../../../..");
const auditMarkdown = readFileSync(
  resolve(repoRoot, "docs/demo-evidence/UI_SCREEN_AUDIT_2026-07-19.md"),
  "utf8",
);

function normalizeCell(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractAuditRows(): AuditTuple[] {
  const start = auditMarkdown.indexOf("## Preserved pre-remediation screen findings");
  const end = auditMarkdown.indexOf("## Prioritized issue list");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return auditMarkdown
    .slice(start, end)
    .split(/\r?\n/)
    .flatMap((line): AuditTuple[] => {
      if (!line.startsWith("|")) return [];
      const cells = line
        .split("|")
        .slice(1, -1)
        .map(normalizeCell);
      if (cells.length !== 6 || !/^\d+$/.test(cells[0])) return [];
      return [
        {
          auditId: `ui-audit-${cells[0].padStart(3, "0")}`,
          role: cells[1],
          screenName: cells[2],
        },
      ];
    });
}

describe("legacy screen manifest", () => {
  it("matches the exact ordered 86 rows from the protected audit document", () => {
    const expected = extractAuditRows();
    expect(expected).toHaveLength(86);
    expect(LEGACY_SCREEN_SOURCE).toEqual(expected);
    expect(LEGACY_SCREEN_MANIFEST.map(({ auditId, role, screenName }) => ({
      auditId,
      role,
      screenName,
    }))).toEqual(expected);
    expect(LEGACY_SCREEN_MANIFEST.map(({ auditId }) => auditId)).toEqual(
      Array.from({ length: 86 }, (_, index) => `ui-audit-${String(index + 1).padStart(3, "0")}`),
    );
  });

  it("freezes the exact 17 React-parity audit rows and 69 legacy-only rows", () => {
    const reactRows = LEGACY_SCREEN_MANIFEST.filter(
      ({ disposition }) => disposition === "react-parity",
    );
    const legacyRows = LEGACY_SCREEN_MANIFEST.filter(
      ({ disposition }) => disposition !== "react-parity",
    );

    expect(reactRows.map(({ auditId, reactSurfaceId }) => `${auditId}:${reactSurfaceId}`)).toEqual([
      "ui-audit-001:role-select",
      "ui-audit-002:inspector-home",
      "ui-audit-007:audit-detail",
      "ui-audit-008:checklist-runner",
      "ui-audit-009:finding-detail",
      "ui-audit-013:lead-home",
      "ui-audit-022:cap-review",
      "ui-audit-027:manager-home",
      "ui-audit-028:audit-plan",
      "ui-audit-030:report-preview",
      "ui-audit-041:organization-registry",
      "ui-audit-044:evidence-review",
      "ui-audit-052:gm-home",
      "ui-audit-058:finance-home",
      "ui-audit-059:executive-home",
      "ui-audit-066:auditee-home",
      "ui-audit-076:admin-home",
    ]);
    expect(reactRows).toHaveLength(17);
    expect(legacyRows).toHaveLength(69);
    expect(legacyRows.every(({ reactPath, reactSurfaceId, dataBoundary, referenceScreenshotIds }) =>
      reactPath === null &&
      reactSurfaceId === null &&
      dataBoundary === null &&
      referenceScreenshotIds.length === 0,
    )).toBe(true);
  });

  it("keeps every React row aligned with the typed route registry", () => {
    for (const row of LEGACY_SCREEN_MANIFEST) {
      expect(row.productAuthority.length).toBeGreaterThan(0);
      expect(row.sourceEvidence.length).toBeGreaterThan(0);
      expect(row.reason.trim()).not.toBe("");
      if (row.disposition !== "react-parity") continue;

      expect(row.reactSurfaceId).not.toBeNull();
      const route = REACT_ROUTE_CONTRACT_BY_ID.get(row.reactSurfaceId!);
      expect(route).toBeDefined();
      expect(row.reactPath).toBe(route?.path);
      expect(row.dataBoundary).toBe(route?.dataBoundary);
      expect(routeRoleForSurface(row.reactSurfaceId!)).toBe(route?.requiredRole);
      expect(row.referenceScreenshotIds).toEqual([row.auditId]);
    }
  });

  it("maps every repo-required screen outcome and keeps planning intake legacy-only", () => {
    expect(PRODUCT_SCREEN_CROSSWALK.map(({ outcome }) => outcome)).toEqual([
      "Role switch / login",
      "Manager Dashboard",
      "Inspector Dashboard",
      "Audit Plan Calendar",
      "Audit Detail",
      "Checklist Runner",
      "Finding Detail with lifecycle stepper",
      "Auditee My Findings",
      "CAP Submission Form",
      "Evidence Upload / Review",
      "Closed Finding / Report Preview",
      "Admin Checklist Template Preview",
      "New Inspection Planning Intake",
    ]);

    const intake = PRODUCT_SCREEN_CROSSWALK.find(
      ({ outcome }) => outcome === "New Inspection Planning Intake",
    );
    expect(intake).toEqual({
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
    });

    const wizardRows = LEGACY_SCREEN_MANIFEST.filter(
      ({ auditId }) => auditId >= "ui-audit-047" && auditId <= "ui-audit-051",
    );
    expect(wizardRows).toHaveLength(5);
    expect(wizardRows.every(({ disposition, reactPath }) =>
      disposition === "later-legacy-only" && reactPath === null,
    )).toBe(true);
  });
});
