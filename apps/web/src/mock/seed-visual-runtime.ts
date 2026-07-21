import type { FindingView } from "../backend/backend";
import type { createMockBackendRuntime } from "./create-mock-backend";

type MockRuntime = ReturnType<typeof createMockBackendRuntime>;

async function seedPotentialFinding(runtime: MockRuntime) {
  const inspector = runtime.backendForRole("inspector");
  const packageView = await inspector.inspections.getPackage({ packageId: "PKG-CAB-2026-001" });
  const response = await inspector.inspections.upsertChecklistResponse({
    operationId: "OP-VISUAL-RESPONSE",
    responseId: "RESP-CAB-EMEQ-PBE-001",
    auditId: "AUD-2026-001",
    questionId: "CAB-EMEQ-PBE-001",
    expectedResponseRevision: null,
    answer: "NON_COMPLIANT",
    comment: "PBE serviceability and accessibility could not be confirmed.",
  });
  const potentialFinding = await inspector.potentialFindings.create({
    operationId: "OP-VISUAL-PF",
    auditId: "AUD-2026-001",
    questionId: "CAB-EMEQ-PBE-001",
    checklistResponseId: response.id,
    expectedChecklistResponseRevision: response.revision,
    title: "PBE serviceability and accessibility not confirmed",
    description: "The configured cabin check could not confirm PBE serviceability.",
    requiredComment: response.comment,
    inspectionAttachmentIds: [],
  });
  await inspector.inspections.submitChecklist({
    operationId: "OP-VISUAL-CHECKLIST",
    auditId: packageView.auditId,
    expectedChecklistRevision: packageView.checklistRevision,
  });
  return potentialFinding;
}

async function seedFinding(runtime: MockRuntime): Promise<FindingView> {
  const potentialFinding = await seedPotentialFinding(runtime);
  const result = await runtime.backendForRole("leadInspector").potentialFindings.decide({
    operationId: "OP-VISUAL-CONVERT",
    potentialFindingId: potentialFinding.id,
    expectedPotentialFindingRevision: potentialFinding.revision,
    decision: "CONVERT",
    severity: "LEVEL_1_CRITICAL",
    capRequired: true,
    evidenceRequired: true,
    dueDate: "2026-07-15",
  });
  if (!result.finding) throw new Error("Visual fixture did not create the canonical Finding.");
  return result.finding;
}

async function seedSubmittedCap(runtime: MockRuntime): Promise<FindingView> {
  const finding = await seedFinding(runtime);
  await runtime.backendForRole("auditee").caps.submit({
    operationId: "OP-VISUAL-CAP-FINDING-DETAIL",
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    rootCause: "The equipment register and serviceability record were maintained separately.",
    correctiveAction: "Reconcile the sampled position against the current serviceability register.",
    preventiveAction: "Add a single-register review before each cabin inspection.",
    responsiblePerson: "Fly Namibia Cabin Safety Manager",
    targetCompletionDate: "2026-07-15",
    commentToCaa: "CAP submitted for CAA review.",
  });
  return runtime.backendForRole("leadInspector").findings.get({ findingId: finding.id });
}

async function seedCapReview(runtime: MockRuntime): Promise<void> {
  const lead = runtime.backendForRole("leadInspector");
  const auditee = runtime.backendForRole("auditee");
  let finding = await seedFinding(runtime);
  const first = await auditee.caps.submit({
    operationId: "OP-VISUAL-CAP-R1",
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    rootCause: "Initial root cause retained for immutable history.",
    correctiveAction: "Initial corrective action.",
    preventiveAction: "Initial preventive action.",
    responsiblePerson: "Fly Namibia Cabin Safety Manager",
    targetCompletionDate: "2026-07-15",
    commentToCaa: "Initial CAP submitted for CAA review.",
  });
  finding = await lead.findings.get({ findingId: finding.id });
  await lead.caps.review({
    operationId: "OP-VISUAL-CAP-R1-REVIEW",
    capRevisionId: first.capRevisionId,
    expectedCapRevision: first.capRevision,
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    decision: "REQUEST_MORE_INFORMATION",
    commentToAuditee: "Clarify how PBE position records will be sampled.",
    internalCaaNote: "Internal CAA note for revision 1.",
  });
  finding = await lead.findings.get({ findingId: finding.id });
  await auditee.caps.submit({
    operationId: "OP-VISUAL-CAP-R2",
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    rootCause: "Revised root cause with record reconciliation.",
    correctiveAction: "Replace affected PBE and update the cabin defect record.",
    preventiveAction: "Add supervisor review and monthly sampling.",
    responsiblePerson: "Fly Namibia Cabin Safety Manager",
    targetCompletionDate: "2026-07-20",
    commentToCaa: "Revised CAP submitted for CAA review.",
  });
}

async function submitEvidenceVersion(
  runtime: MockRuntime,
  finding: FindingView,
  fileName: string,
): Promise<FindingView> {
  const auditee = runtime.backendForRole("auditee");
  const upload = await auditee.evidence.beginUpload({
    operationId: `OP-VISUAL-EVIDENCE-BEGIN-${fileName}`,
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    fileName,
    declaredMediaType: "application/pdf",
    byteSize: 12,
    sha256: `sha256:${fileName}`,
  });
  await auditee.evidence.completeUpload({
    operationId: `OP-VISUAL-EVIDENCE-COMPLETE-${fileName}`,
    uploadId: upload.uploadId,
    sha256: `sha256:${fileName}`,
    byteSize: 12,
  });
  return runtime.backendForRole("leadInspector").findings.get({ findingId: finding.id });
}

async function seedEvidenceReview(runtime: MockRuntime): Promise<void> {
  const lead = runtime.backendForRole("leadInspector");
  const auditee = runtime.backendForRole("auditee");
  let finding = await seedFinding(runtime);
  const cap = await auditee.caps.submit({
    operationId: "OP-VISUAL-CAP",
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    rootCause: "Root cause ready for evidence.",
    correctiveAction: "Replace affected PBE.",
    preventiveAction: "Monthly PBE sampling.",
    responsiblePerson: "Fly Namibia Cabin Safety Manager",
    targetCompletionDate: "2026-07-15",
    commentToCaa: "CAP submitted for CAA review.",
  });
  finding = await lead.findings.get({ findingId: finding.id });
  await lead.caps.review({
    operationId: "OP-VISUAL-CAP-ACCEPT",
    capRevisionId: cap.capRevisionId,
    expectedCapRevision: cap.capRevision,
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    decision: "ACCEPT",
    commentToAuditee: "CAP accepted. Submit evidence.",
    internalCaaNote: "Evidence verification remains required.",
  });
  finding = await lead.findings.get({ findingId: finding.id });
  finding = await submitEvidenceVersion(
    runtime,
    finding,
    "Fly_Namibia_PBE_Serviceability_Record_CAB-2026-001.pdf",
  );
  const firstVersion = (await lead.evidence.listVersions({ findingId: finding.id })).at(-1);
  if (!firstVersion) throw new Error("Visual fixture did not create the first Evidence version.");
  await lead.evidence.review({
    operationId: "OP-VISUAL-EVIDENCE-V1-REVIEW",
    evidenceVersionId: firstVersion.id,
    expectedEvidenceVersionRevision: firstVersion.revision,
    findingId: finding.id,
    expectedFindingRevision: finding.revision,
    decision: "PARTIALLY_CLOSE",
    commentToAuditee: "Serviceability accepted; provide cabin position confirmation.",
    internalCaaNote: "Version 1 does not verify accessibility.",
  });
  finding = await lead.findings.get({ findingId: finding.id });
  await submitEvidenceVersion(
    runtime,
    finding,
    "Fly_Namibia_PBE_Position_Confirmation_CAB-2026-001.pdf",
  );
}

export async function seedVisualRuntimeForPath(runtime: MockRuntime, pathname: string): Promise<void> {
  if (pathname === "/lead-inspector/lead-review") {
    await seedPotentialFinding(runtime);
    return;
  }
  if (pathname === "/lead-inspector/findings/FND-CAB-2026-001") {
    await seedSubmittedCap(runtime);
    return;
  }
  if (pathname === "/lead-inspector/cap-review/FND-CAB-2026-001") {
    await seedCapReview(runtime);
    return;
  }
  if (pathname === "/lead-inspector/evidence-review/FND-CAB-2026-001") {
    await seedEvidenceReview(runtime);
    return;
  }
  if (pathname === "/auditee/service-provider-cap") {
    await seedFinding(runtime);
  }
}
