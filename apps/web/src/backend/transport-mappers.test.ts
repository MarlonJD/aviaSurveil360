import { describe, expect, it } from "vitest";

import {
  mapCapRevision,
  mapCapRevisions,
  mapFinding,
  mapInspectionPackage,
  mapManagerDashboard,
} from "./transport-mappers";

describe("transport mappers", () => {
  it("maps generated transport Finding values into independent domain values", () => {
    const transport = {
      id: "FND-CAB-2026-001",
      findingNumber: "CAB-2026-001",
      auditId: "AUD-2026-001",
      organizationId: "ORG-FLY-NAMIBIA",
      organizationName: "Fly Namibia",
      title: "PBE serviceability and accessibility not confirmed",
      description: "Configured check exception.",
      regulatoryReference: "Configured Cabin Inspection reference — EM EQ / PBE",
      findingBasis: "Exact response and comment",
      severity: "LEVEL_1_CRITICAL" as const,
      status: "EVIDENCE_REQUIRED" as const,
      dueDate: "2026-07-15",
      dueState: "NOT_DUE" as const,
      currentOwnerType: "AUDITEE" as const,
      currentOwnerId: "ORG-FLY-NAMIBIA",
      currentOwnerRole: "auditee" as const,
      nextAction: "Submit Evidence",
      capRequired: true,
      evidenceRequired: true,
      repeatFinding: false,
      createdAt: "2026-06-15T09:00:00.000Z",
      issuedAt: "2026-06-15T09:10:00.000Z",
      closedAt: null,
      closureBasis: null,
      revision: 3,
    };
    const domain = mapFinding(transport);
    expect(domain).toEqual(transport);
    expect(domain).not.toBe(transport);
  });

  it("deep-maps inspection questions and dashboard arrays", () => {
    const packageTransport = {
      id: "PKG-CAB-2026-001",
      auditId: "AUD-2026-001",
      organizationId: "ORG-FLY-NAMIBIA",
      organizationName: "Fly Namibia",
      title: "2026 Cabin Inspection - Fly Namibia",
      packageVersion: 1,
      schemaVersion: 1,
      protocolVersion: 1,
      templateVersionId: "CTV-CABIN-1",
      packageDigest: "sha256:test",
      expiresAt: "2026-07-15T23:59:59.000Z",
      checklistStatus: "IN_PROGRESS" as const,
      checklistRevision: 1,
      questions: [
        {
          id: "CAB-EMEQ-PBE-001",
          sectionId: "EM EQ / PBE",
          prompt: "PBE question",
          regulatoryReference: null,
          expectedEvidence: null,
          allowedAnswers: ["COMPLIANT" as const],
          commentRequiredFor: ["NON_COMPLIANT" as const],
          assignedInspectorUserIds: ["USR-INSPECTOR-AMINA"],
          currentResponse: null,
        },
      ],
    };
    const mappedPackage = mapInspectionPackage(packageTransport);
    expect(mappedPackage.questions).not.toBe(packageTransport.questions);
    expect(mappedPackage.questions[0]?.assignedInspectorUserIds).not.toBe(
      packageTransport.questions[0]?.assignedInspectorUserIds,
    );

    const transportDashboard = {
      generatedAt: "2026-06-15T09:00:00.000Z",
      openFindings: 1,
      closedFindings: 0,
      overdueFindings: 0,
      pendingCapReviews: 0,
      pendingEvidenceReviews: 0,
      recentFindingNumbers: ["CAB-2026-001"],
    };
    expect(mapManagerDashboard(transportDashboard)).toEqual(transportDashboard);
  });

  it("maps role-shaped CAP revisions without leaking Auditee internal CAA notes", () => {
    const caa = mapCapRevision({
      audience: "CAA" as const,
      id: "CAP-CAB-2026-001-R1",
      capId: "CAP-CAB-2026-001",
      findingId: "FND-CAB-2026-001",
      organizationId: "ORG-FLY-NAMIBIA",
      revision: 1,
      status: "ACCEPTED" as const,
      rootCause: "Root cause",
      correctiveAction: "Corrective action",
      preventiveAction: "Preventive action",
      responsiblePerson: "Fly Namibia Cabin Safety Manager",
      targetCompletionDate: "2026-07-15",
      commentToCaa: "CAP submitted for CAA review.",
      submittedAt: "2026-06-15T09:00:00.000Z",
      latestReview: {
        decision: "ACCEPT" as const,
        commentToAuditee: "CAP accepted.",
        internalCaaNote: "Internal note.",
        decidedAt: "2026-06-15T09:00:00.000Z",
      },
    });
    expect(caa.audience).toBe("CAA");
    if (caa.audience !== "CAA") throw new Error("Expected CAA CAP revision view.");
    expect(caa.latestReview?.internalCaaNote).toBe("Internal note.");

    const auditee = mapCapRevision({
      ...caa,
      audience: "AUDITEE" as const,
      latestReview: {
        decision: "ACCEPT" as const,
        commentToAuditee: "CAP accepted.",
        decidedAt: "2026-06-15T09:00:00.000Z",
      },
    });
    expect(JSON.stringify(auditee)).not.toMatch(/internalCaaNote/i);
    expect(mapCapRevisions({ items: [caa, auditee], nextCursor: null }).items).toHaveLength(2);
  });
});
