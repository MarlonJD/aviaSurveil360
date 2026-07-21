import { describe, expect, it } from "vitest";

import type {
  Backend,
  BackendPrincipal,
  EvidenceVersionView,
  FindingView,
} from "../../src/backend/backend";

export const FIXED_NOW = "2026-06-15T09:00:00.000Z";

export interface BackendContractHarness {
  backendFor(principal: BackendPrincipal): Backend;
}

export type BackendContractHarnessFactory = () => Promise<BackendContractHarness>;

export const PRINCIPALS = {
  inspector: {
    subjectId: "USR-INSPECTOR-AMINA",
    role: "inspector",
    organizationId: null,
  },
  otherInspector: {
    subjectId: "USR-INSPECTOR-DAVID",
    role: "inspector",
    organizationId: null,
  },
  leadInspector: {
    subjectId: "USR-LEAD-CANER",
    role: "leadInspector",
    organizationId: null,
  },
  manager: {
    subjectId: "USR-MANAGER-NORA",
    role: "manager",
    organizationId: null,
  },
  finance: {
    subjectId: "USR-FINANCE-LINA",
    role: "finance",
    organizationId: null,
  },
  gm: {
    subjectId: "USR-GM-OMAR",
    role: "gm",
    organizationId: null,
  },
  executiveDirector: {
    subjectId: "USR-ED-ZARA",
    role: "executiveDirector",
    organizationId: null,
  },
  auditee: {
    subjectId: "USR-AUDITEE-FLY",
    role: "auditee",
    organizationId: "ORG-FLY-NAMIBIA",
  },
  admin: {
    subjectId: "USR-ADMIN-ADA",
    role: "admin",
    organizationId: null,
  },
} as const satisfies Record<string, BackendPrincipal>;

export async function createCanonicalFinding(
  harness: BackendContractHarness,
): Promise<FindingView> {
  const inspector = harness.backendFor(PRINCIPALS.inspector);
  const response = await inspector.inspections.upsertChecklistResponse({
    operationId: "OP-RESPONSE-CANONICAL",
    responseId: "RESP-CAB-EMEQ-PBE-001",
    auditId: "AUD-2026-001",
    questionId: "CAB-EMEQ-PBE-001",
    expectedResponseRevision: null,
    answer: "NON_COMPLIANT",
    comment: "PBE serviceability and accessibility could not be confirmed for this Audit.",
  });
  const potential = await inspector.potentialFindings.create({
    operationId: "OP-PF-CANONICAL",
    auditId: "AUD-2026-001",
    questionId: "CAB-EMEQ-PBE-001",
    checklistResponseId: response.id,
    expectedChecklistResponseRevision: response.revision,
    title: "PBE serviceability and accessibility not confirmed",
    description: "The configured cabin check could not confirm that the PBE was serviceable and accessible.",
    requiredComment: response.comment,
    inspectionAttachmentIds: [],
  });

  const lead = harness.backendFor(PRINCIPALS.leadInspector);
  const converted = await lead.potentialFindings.decide({
    operationId: "OP-PF-CONVERT-CANONICAL",
    potentialFindingId: potential.id,
    expectedPotentialFindingRevision: potential.revision,
    decision: "CONVERT",
    severity: "LEVEL_1_CRITICAL",
    capRequired: true,
    evidenceRequired: true,
    dueDate: "2026-07-15",
  });
  expect(converted.finding).not.toBeNull();
  return converted.finding!;
}

async function submitAndAcceptCanonicalCap(
  harness: BackendContractHarness,
  finding: FindingView,
) {
  const auditee = harness.backendFor(PRINCIPALS.auditee);
  const submitted = await auditee.caps.submit({
    operationId: "OP-CAP-SUBMIT-CANONICAL",
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    rootCause:
      "Pre-flight cabin equipment serviceability checks did not reconcile the PBE position with the deferred defect list.",
    correctiveAction:
      "Replace or service the affected PBE, update the cabin defect record, and confirm serviceability before release.",
    preventiveAction:
      "Add a supervisor review of emergency equipment checks and monthly sampling of PBE serviceability records.",
    responsiblePerson: "Fly Namibia Cabin Safety Manager",
    targetCompletionDate: "2026-07-15",
    commentToCaa: "CAP submitted for CAA review.",
  });

  const lead = harness.backendFor(PRINCIPALS.leadInspector);
  const accepted = await lead.caps.review({
    operationId: "OP-CAP-ACCEPT-CANONICAL",
    capRevisionId: submitted.capRevisionId,
    expectedCapRevision: submitted.capRevision,
    findingId: finding.id,
    expectedFindingRevision: submitted.findingRevision,
    decision: "ACCEPT",
    commentToAuditee: "CAP accepted. Submit the required PBE serviceability record.",
    internalCaaNote: "CAP actions are credible; Evidence verification remains required.",
  });
  return { submitted, accepted };
}

async function submitEvidence(
  harness: BackendContractHarness,
  operationSuffix: string,
  fileName: string,
): Promise<EvidenceVersionView> {
  const auditee = harness.backendFor(PRINCIPALS.auditee);
  const finding = await auditee.findings.get({ findingId: "FND-CAB-2026-001" });
  const body = new TextEncoder().encode(
    `%PDF-1.7\n1 0 obj\n<</Type/Catalog/Label(${operationSuffix})>>\nendobj\n%%EOF\n`,
  );
  const digest = await crypto.subtle.digest("SHA-256", body);
  const sha256 = `sha256:${Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")}`;
  const upload = await auditee.evidence.beginUpload({
    operationId: `OP-EVIDENCE-BEGIN-${operationSuffix}`,
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    fileName,
    declaredMediaType: "application/pdf",
    byteSize: body.byteLength,
    sha256,
  });
  if (auditee.mode === "http") {
    const response = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: upload.requiredHeaders,
      body,
    });
    expect(response.ok).toBe(true);
  }
  const completed = await auditee.evidence.completeUpload({
    operationId: `OP-EVIDENCE-COMPLETE-${operationSuffix}`,
    uploadId: upload.uploadId,
    sha256,
    byteSize: body.byteLength,
  });
  let versions: EvidenceVersionView[] = [];
  for (let attempt = 0; attempt < 100; attempt += 1) {
    versions = await auditee.evidence.listVersions({ findingId: finding.id });
    if (auditee.mode === "mock" || versions.find(({ id }) => id === completed.evidenceVersionId)?.scanState === "CLEAN") {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const version = versions.find((candidate) => candidate.id === completed.evidenceVersionId);
  expect(version).toBeDefined();
  return version!;
}

export function backendContract(createHarness: BackendContractHarnessFactory): void {
  describe("shared Backend contract", () => {
    it("uses stable exact Audit/question scope and keeps another Inspector's question read-only", async () => {
      const harness = await createHarness();
      const inspector = harness.backendFor(PRINCIPALS.inspector);
      const packageView = await inspector.inspections.getPackage({
        packageId: "PKG-CAB-2026-001",
      });
      expect(packageView.auditId).toBe("AUD-2026-001");
      expect(packageView.questions.map((question) => question.id)).toContain("CAB-EMEQ-PBE-001");
      expect(
        packageView.questions.find((question) => question.id === "CAB-GALLEY-001")
          ?.assignedInspectorUserIds,
      ).toEqual(["USR-INSPECTOR-DAVID"]);

      await expect(
        inspector.inspections.upsertChecklistResponse({
          operationId: "OP-OTHER-INSPECTOR-QUESTION",
          responseId: "RESP-CAB-GALLEY-001",
          auditId: "AUD-2026-001",
          questionId: "CAB-GALLEY-001",
          expectedResponseRevision: null,
          answer: "COMPLIANT",
          comment: "",
        }),
      ).rejects.toThrow(/(?:assigned Inspector|Inspector.*assigned)/i);
    });

    it("requires a separate Lead conversion before a canonical Finding exists", async () => {
      const harness = await createHarness();
      const inspector = harness.backendFor(PRINCIPALS.inspector);
      const response = await inspector.inspections.upsertChecklistResponse({
        operationId: "OP-RESPONSE-PF-ONLY",
        responseId: "RESP-CAB-EMEQ-PBE-001",
        auditId: "AUD-2026-001",
        questionId: "CAB-EMEQ-PBE-001",
        expectedResponseRevision: null,
        answer: "NON_COMPLIANT",
        comment: "Required exact-Audit comment.",
      });
      const potential = await inspector.potentialFindings.create({
        operationId: "OP-PF-ONLY",
        auditId: "AUD-2026-001",
        questionId: "CAB-EMEQ-PBE-001",
        checklistResponseId: response.id,
        expectedChecklistResponseRevision: response.revision,
        title: "PBE serviceability and accessibility not confirmed",
        description: "Configured check exception.",
        requiredComment: response.comment,
        inspectionAttachmentIds: [],
      });
      expect(potential).toMatchObject({
        id: "PF-2026-001",
        status: "PENDING_LEAD_REVIEW",
        convertedFindingId: null,
      });
      const beforeConversion = await harness
        .backendFor(PRINCIPALS.leadInspector)
        .findings.list({});
      expect(beforeConversion.items.some((finding) => finding.findingNumber === "CAB-2026-001")).toBe(
        false,
      );
    });

    it("separates Auditee CAP submission from CAA acceptance and keeps the Finding open", async () => {
      const harness = await createHarness();
      const finding = await createCanonicalFinding(harness);
      const { submitted, accepted } = await submitAndAcceptCanonicalCap(harness, finding);
      expect(submitted.capStatus).toBe("SUBMITTED");
      expect(submitted.findingStatus).toBe("CAP_SUBMITTED");
      expect(accepted.capStatus).toBe("ACCEPTED");
      expect(accepted.findingStatus).toBe("EVIDENCE_REQUIRED");
      expect(accepted.findingStatus).not.toBe("CLOSED");
    });

    it("preserves immutable Evidence versions and closes only the exact latest accepted version", async () => {
      const harness = await createHarness();
      const finding = await createCanonicalFinding(harness);
      await submitAndAcceptCanonicalCap(harness, finding);
      const versionOne = await submitEvidence(
        harness,
        "V1",
        "Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf",
      );
      const lead = harness.backendFor(PRINCIPALS.leadInspector);
      let current = await lead.findings.get({ findingId: finding.id });
      expect(current.status).toBe("PENDING_CAA_REVIEW");
      const partial = await lead.evidence.review({
        operationId: "OP-EVIDENCE-PARTIAL-V1",
        evidenceVersionId: versionOne.id,
        expectedEvidenceVersionRevision: versionOne.revision,
        findingId: finding.id,
        expectedFindingRevision: current.revision,
        decision: "PARTIALLY_CLOSE",
        commentToAuditee: "The serviceability record is accepted; provide the cabin position confirmation.",
        internalCaaNote: "Version 1 covers serviceability but not accessibility.",
      });
      expect(partial.findingStatus).toBe("EVIDENCE_MORE_INFORMATION_REQUESTED");

      const versionTwo = await submitEvidence(
        harness,
        "V2",
        "Fly_Namibia_PBE_Position_Confirmation_CAB-2026-001.pdf",
      );
      const versionsBeforeClosure = await lead.evidence.listVersions({ findingId: finding.id });
      expect(versionsBeforeClosure.map(({ id, version }) => [id, version])).toEqual([
        [versionOne.id, 1],
        [versionTwo.id, 2],
      ]);

      current = await lead.findings.get({ findingId: finding.id });
      const closed = await lead.evidence.review({
        operationId: "OP-EVIDENCE-CLOSE-V2",
        evidenceVersionId: versionTwo.id,
        expectedEvidenceVersionRevision: versionTwo.revision,
        findingId: finding.id,
        expectedFindingRevision: current.revision,
        decision: "CLOSE",
        commentToAuditee: "Evidence accepted and verified.",
        internalCaaNote: "Version 2 completes serviceability and accessibility verification.",
      });
      expect(closed.findingStatus).toBe("CLOSED");
      const closedFinding = await lead.findings.get({ findingId: finding.id });
      expect(closedFinding.closureBasis).toBe("EVIDENCE_VERIFIED");
      expect((await lead.evidence.listVersions({ findingId: finding.id }))).toHaveLength(2);
    });

    it("scopes Auditee projections to its organization and omits internal CAA data", async () => {
      const harness = await createHarness();
      const finding = await createCanonicalFinding(harness);
      await submitAndAcceptCanonicalCap(harness, finding);
      const auditee = harness.backendFor(PRINCIPALS.auditee);
      const projection = await auditee.findings.list({});
      expect(projection.items.length).toBeGreaterThan(0);
      expect(projection.items.every((finding) => finding.organizationId === "ORG-FLY-NAMIBIA")).toBe(
        true,
      );
      const raw = JSON.stringify(projection);
      expect(raw).not.toMatch(
        /Internal CAA Note|internalCaaNote|SkyCargo|internalRisk|inspectorWorkload|enforcementDeliberation/i,
      );
      await expect(
        auditee.reports.getVersion({ reportVersionId: "RPT-CAB-2026-001-V1" }),
      ).rejects.toThrow(/unavailable to this Auditee/i);
    });

    it("keeps authorized closure reason-required and separate from Evidence verification", async () => {
      const harness = await createHarness();
      const finding = await createCanonicalFinding(harness);
      await expect(
        harness.backendFor(PRINCIPALS.inspector).findings.authorizedClose({
          operationId: "OP-AUTH-CLOSE-WRONG-ROLE",
          findingId: finding.id,
          expectedFindingRevision: finding.revision,
          reason: "Inspector may not use the authorized path.",
        }),
      ).rejects.toThrow(/Department Manager/i);

      const manager = harness.backendFor(PRINCIPALS.manager);
      await expect(
        manager.findings.authorizedClose({
          operationId: "OP-AUTH-CLOSE-NO-REASON",
          findingId: finding.id,
          expectedFindingRevision: finding.revision,
          reason: "",
        }),
      ).rejects.toThrow(/reason/i);
      const closed = await manager.findings.authorizedClose({
        operationId: "OP-AUTH-CLOSE-VALID",
        findingId: finding.id,
        expectedFindingRevision: finding.revision,
        reason: "Authorized mock closure path exercised separately for contract verification.",
      });
      expect(closed).toMatchObject({ status: "CLOSED", closureBasis: "AUTHORIZED" });
    });

    it("binds report decisions to versions and never closes an open Finding", async () => {
      const harness = await createHarness();
      const finding = await createCanonicalFinding(harness);
      const executive = harness.backendFor(PRINCIPALS.executiveDirector);
      const before = await executive.reports.getVersion({ reportVersionId: "RPT-CAB-2026-001-V1" });
      const issued = await executive.reports.decide({
        operationId: "OP-REPORT-ISSUE",
        reportVersionId: before.reportVersionId,
        expectedReportVersionRevision: before.revision,
        decision: "ISSUE_AND_LOCK",
        reason: "Issue the exact candidate report version.",
      });
      expect(issued.status).toBe("LOCKED");
      expect((await executive.findings.get({ findingId: finding.id })).status).not.toBe("CLOSED");
    });

    it("replays the same direct command and rejects operation ID payload drift", async () => {
      const harness = await createHarness();
      const inspector = harness.backendFor(PRINCIPALS.inspector);
      const input = {
        operationId: "OP-IDEMPOTENT-RESPONSE",
        responseId: "RESP-CAB-EMEQ-PBE-001",
        auditId: "AUD-2026-001",
        questionId: "CAB-EMEQ-PBE-001",
        expectedResponseRevision: null,
        answer: "NON_COMPLIANT" as const,
        comment: "Deterministic idempotent response.",
      };
      const first = await inspector.inspections.upsertChecklistResponse(input);
      const replay = await inspector.inspections.upsertChecklistResponse(input);
      expect(replay).toEqual(first);
      await expect(
        inspector.inspections.upsertChecklistResponse({ ...input, comment: "Changed payload" }),
      ).rejects.toThrow(/operation ID/i);
    });

    it("returns a deterministic sync acknowledgement and exact replay", async () => {
      const harness = await createHarness();
      const inspector = harness.backendFor(PRINCIPALS.inspector);
      const request = {
        operation: {
          operationId: "OP-SYNC-CONTRACT",
          protocolVersion: 1,
          offlineGrantId: "GRANT-CANDIDATE-001",
          packageId: "PKG-CAB-2026-001",
          packageVersion: 1,
          entityId: "RESP-CAB-EMEQ-PBE-001",
          commandType: "UPSERT_CHECKLIST_RESPONSE" as const,
          baseRevision: null,
          deviceInstanceId: "DEVICE-CANDIDATE-001",
          clientOccurredAt: FIXED_NOW,
          payload: {
            auditId: "AUD-2026-001",
            questionId: "CAB-EMEQ-PBE-001",
            answer: "NON_COMPLIANT" as const,
            comment: "Sync envelope contract only.",
          },
        },
      };
      const first = await inspector.sync.pushOperation(request);
      const replay = await inspector.sync.pushOperation(request);
      expect(first).toMatchObject({
        operationId: "OP-SYNC-CONTRACT",
        status: "accepted",
        authoritativeEntityId: "RESP-CAB-EMEQ-PBE-001",
      });
      expect(replay).toEqual(first);
    });

    it("keeps Organization Registry projections role- and organization-scoped", async () => {
      const harness = await createHarness();
      const internal = await harness.backendFor(PRINCIPALS.manager).organizations.list({});
      expect(internal.items.map(({ id }) => id)).toEqual([
        "ORG-FLY-NAMIBIA",
        "ORG-SKYCARGO",
      ]);
      expect(internal.items[0]).toMatchObject({
        legalName: "Fly Namibia",
        openFindingCount: 0,
        nextAuditDate: "2026-07-15",
      });

      const auditee = await harness.backendFor(PRINCIPALS.auditee).organizations.list({});
      expect(auditee.items).toHaveLength(1);
      expect(auditee.items[0]?.id).toBe("ORG-FLY-NAMIBIA");
      expect(JSON.stringify(auditee)).not.toMatch(
        /SkyCargo|internalRisk|inspectorWorkload|Internal CAA Note/i,
      );
    });

    it("advances the exact surveillance plan through Finance, GM, Executive Director, and GM release", async () => {
      const harness = await createHarness();
      const finance = harness.backendFor(PRINCIPALS.finance);
      const initial = (await finance.planning.list({})).items[0]!;
      expect(initial).toMatchObject({
        id: "PLAN-2026-CAB-001",
        status: "FINANCE_REVIEW",
        currentOwnerRole: "finance",
        revision: 1,
      });
      await expect(
        harness.backendFor(PRINCIPALS.manager).planning.decide({
          operationId: "OP-PLAN-WRONG-AUTHORITY",
          planningItemId: initial.id,
          expectedPlanningRevision: initial.revision,
          decision: "APPROVE_BUDGET",
          reason: "Manager cannot approve the budget gate.",
        }),
      ).rejects.toThrow(/Finance/i);

      const budgetApproved = await finance.planning.decide({
        operationId: "OP-PLAN-FINANCE-APPROVE",
        planningItemId: initial.id,
        expectedPlanningRevision: initial.revision,
        decision: "APPROVE_BUDGET",
        reason: "Budget envelope confirmed for the configured inspection.",
      });
      expect(budgetApproved).toMatchObject({
        status: "GM_REVIEW",
        currentOwnerRole: "gm",
        revision: 2,
      });

      const gm = harness.backendFor(PRINCIPALS.gm);
      const forwarded = await gm.planning.decide({
        operationId: "OP-PLAN-GM-FORWARD",
        planningItemId: initial.id,
        expectedPlanningRevision: budgetApproved.revision,
        decision: "FORWARD_FOR_FINAL_APPROVAL",
        reason: "Operational scope is ready for final approval.",
      });
      expect(forwarded).toMatchObject({
        status: "EXECUTIVE_DIRECTOR_REVIEW",
        currentOwnerRole: "executiveDirector",
        revision: 3,
      });

      const executive = harness.backendFor(PRINCIPALS.executiveDirector);
      const approved = await executive.planning.decide({
        operationId: "OP-PLAN-EXECUTIVE-APPROVE",
        planningItemId: initial.id,
        expectedPlanningRevision: forwarded.revision,
        decision: "APPROVE_PLAN",
        reason: "The annual surveillance item is approved for release.",
      });
      expect(approved).toMatchObject({
        status: "GM_RELEASE",
        currentOwnerRole: "gm",
        revision: 4,
      });

      const released = await gm.planning.decide({
        operationId: "OP-PLAN-GM-RELEASE",
        planningItemId: initial.id,
        expectedPlanningRevision: approved.revision,
        decision: "RELEASE_PLAN",
        reason: "Release the approved item to department preparation.",
      });
      expect(released).toMatchObject({
        status: "RELEASED",
        currentOwnerRole: "manager",
        revision: 5,
      });
      await expect(
        finance.planning.decide({
          operationId: "OP-PLAN-STALE",
          planningItemId: initial.id,
          expectedPlanningRevision: 1,
          decision: "APPROVE_BUDGET",
          reason: "Stale replay must fail.",
        }),
      ).rejects.toThrow(/revision/i);

      const admin = harness.backendFor(PRINCIPALS.admin);
      const [templates, reminders, auditEvents] = await Promise.all([
        admin.configuration.listChecklistTemplateVersions({}),
        admin.configuration.listReminderRules({}),
        admin.auditTrail.list({ entityType: "SURVEILLANCE_PLAN", entityId: initial.id }),
      ]);
      expect(templates.items[0]).toMatchObject({
        id: "CTV-CABIN-1",
        templateId: "CABIN",
        version: 1,
        status: "PUBLISHED",
        questionCount: 6,
      });
      expect(reminders.items.map(({ offsetDays }) => offsetDays)).toEqual([30, 15, 7, 0, -1]);
      expect(auditEvents.items.map(({ action }) => action)).toEqual([
        "PLANNING_BUDGET_APPROVED",
        "PLANNING_FORWARDED_FOR_FINAL_APPROVAL",
        "PLANNING_APPROVED",
        "PLANNING_RELEASED",
      ]);
      expect(JSON.stringify(auditEvents)).not.toMatch(/internalCaaNote/i);
    });
  });
}
