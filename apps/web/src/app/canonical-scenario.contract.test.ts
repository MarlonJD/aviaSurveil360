import { describe, expect, it } from "vitest";

import { CANONICAL_SCENARIO } from "./canonical-scenario";

describe("canonical Cabin scenario foundation contract", () => {
  it("freezes exact identities and the closure invariant before route implementation", () => {
    expect(CANONICAL_SCENARIO).toMatchObject({
      auditId: "AUD-2026-001",
      packageId: "PKG-CAB-2026-001",
      questionId: "CAB-EMEQ-PBE-001",
      potentialFindingId: "PF-2026-001",
      findingId: "FND-CAB-2026-001",
      findingNumber: "CAB-2026-001",
      finalStatus: "CLOSED",
      visibilityInvariant: "auditee-never-receives-internal-caa-note",
    });
    expect(CANONICAL_SCENARIO.lifecycle).toEqual([
      "NON_COMPLIANT",
      "PENDING_LEAD_REVIEW",
      "WAITING_FOR_CAP",
      "CAP_SUBMITTED",
      "EVIDENCE_REQUIRED",
      "EVIDENCE_SUBMITTED",
      "CLOSED",
    ]);
  });
});
