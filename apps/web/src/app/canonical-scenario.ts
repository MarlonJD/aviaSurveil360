export const CANONICAL_SCENARIO = {
  auditId: "AUD-2026-001",
  packageId: "PKG-CAB-2026-001",
  questionId: "CAB-EMEQ-PBE-001",
  potentialFindingId: "PF-2026-001",
  findingId: "FND-CAB-2026-001",
  findingNumber: "CAB-2026-001",
  finalStatus: "CLOSED",
  visibilityInvariant: "auditee-never-receives-internal-caa-note",
  lifecycle: [
    "NON_COMPLIANT",
    "PENDING_LEAD_REVIEW",
    "WAITING_FOR_CAP",
    "CAP_SUBMITTED",
    "EVIDENCE_REQUIRED",
    "EVIDENCE_SUBMITTED",
    "CLOSED",
  ],
} as const;
