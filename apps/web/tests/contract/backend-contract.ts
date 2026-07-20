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
  const upload = await auditee.evidence.beginUpload({
    operationId: `OP-EVIDENCE-BEGIN-${operationSuffix}`,
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    fileName,
    declaredMediaType: "application/pdf",
    byteSize: 4096,
    sha256: `sha256-${operationSuffix}`,
  });
  const completed = await auditee.evidence.completeUpload({
    operationId: `OP-EVIDENCE-COMPLETE-${operationSuffix}`,
    uploadId: upload.uploadId,
    sha256: `sha256-${operationSuffix}`,
    byteSize: 4096,
  });
  const versions = await auditee.evidence.listVersions({ findingId: finding.id });
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
      ).rejects.toThrow(/assigned Inspector/i);
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
  });
}
