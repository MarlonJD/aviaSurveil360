// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { FindingView } from "../../backend/backend";
import {
  AuditeeFindingSummary,
  createAuditeeFindingProjection,
} from "./auditee-projection";

const findingWithForbiddenRuntimeFields = {
  id: "FND-CAB-2026-001",
  findingNumber: "CAB-2026-001",
  auditId: "AUD-2026-001",
  organizationId: "ORG-FLY-NAMIBIA",
  organizationName: "Fly Namibia",
  title: "PBE serviceability and accessibility not confirmed",
  description: "Configured cabin check result.",
  regulatoryReference: "Configured Cabin Inspection reference",
  findingBasis: "Non-Compliant response and required Inspector comment",
  severity: "LEVEL_1_CRITICAL",
  status: "EVIDENCE_REQUIRED",
  dueDate: "2026-07-15",
  dueState: "NOT_DUE",
  currentOwnerType: "AUDITEE",
  currentOwnerId: "ORG-FLY-NAMIBIA",
  currentOwnerRole: "auditee",
  nextAction: "Auditee to submit required Evidence",
  capRequired: true,
  evidenceRequired: true,
  repeatFinding: false,
  createdAt: "2026-06-15T09:00:00.000Z",
  issuedAt: "2026-06-15T09:00:00.000Z",
  closedAt: null,
  closureBasis: null,
  revision: 4,
  internalCaaNote: "Must not cross the projection boundary",
  inspectorWorkload: 91,
  internalRisk: "HIGH",
  enforcementDeliberation: "Private",
  otherOrganization: "SkyCargo Air",
  unreleasedReport: { status: "DRAFT" },
} as FindingView & Record<string, unknown>;

describe("Auditee projection boundary", () => {
  it("whitelists organization-safe fields before render", () => {
    const projection = createAuditeeFindingProjection(findingWithForbiddenRuntimeFields);
    const serialized = JSON.stringify(projection);

    expect(serialized).not.toMatch(
      /internalCaaNote|inspectorWorkload|internalRisk|enforcementDeliberation|SkyCargo|unreleasedReport/,
    );
    for (const forbidden of [
      "internalCaaNote",
      "inspectorWorkload",
      "internalRisk",
      "enforcementDeliberation",
      "otherOrganization",
      "unreleasedReport",
    ]) {
      expect(Object.hasOwn(projection, forbidden)).toBe(false);
    }
    expect(projection.organizationName).toBe("Fly Namibia");
    expect(projection.status).toBe("EVIDENCE_REQUIRED");
  });

  it("renders only the public Finding dossier", () => {
    render(
      <AuditeeFindingSummary
        finding={createAuditeeFindingProjection(findingWithForbiddenRuntimeFields)}
      />,
    );

    expect(screen.getByText("CAB-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Auditee to submit required Evidence")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/Internal CAA Note|SkyCargo Air|Private|HIGH/);
  });
});
