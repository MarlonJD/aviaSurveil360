import type {
  AssignmentSummary,
  AuditEventView,
  CapStatus,
  ChecklistTemplateVersionView,
  EvidenceReviewState,
  EvidenceScanState,
  EvidenceUploadState,
  EvidenceVersionView,
  FindingView,
  InspectionQuestion,
  InspectionPackage,
  OrganizationSummary,
  PlanningItemView,
  PotentialFindingView,
  ReportVersionView,
  ReminderRuleView,
} from "../backend/backend";

export interface MockCapRevision {
  id: string;
  findingId: string;
  organizationId: string;
  version: number;
  revision: number;
  status: CapStatus;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  responsiblePerson: string;
  targetCompletionDate: string;
  commentToCaa: string;
  commentToAuditee: string;
  internalCaaNote: string;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface MockEvidenceVersion extends EvidenceVersionView {
  commentToAuditee: string;
}

export interface MockEvidenceReview {
  id: string;
  findingId: string;
  evidenceVersionId: string;
  decision: "CLOSE" | "PARTIALLY_CLOSE" | "NOT_CLOSE" | "REQUEST_MORE_INFORMATION";
  commentToAuditee: string;
  internalCaaNote: string;
  reviewedAt: string;
}

export interface MockEvidenceUpload {
  kind: "evidence";
  uploadId: string;
  findingId: string;
  organizationId: string;
  fileName: string;
  declaredMediaType: string;
  byteSize: number;
  sha256: string;
}

export interface MockInspectionAttachmentUpload {
  kind: "inspection-attachment";
  uploadId: string;
  inspectionAttachmentId: string;
  packageId: string;
  fileName: string;
  byteSize: number;
  sha256: string;
}

export type MockUpload = MockEvidenceUpload | MockInspectionAttachmentUpload;

export interface MockState {
  assignments: AssignmentSummary[];
  organizations: OrganizationSummary[];
  planningItems: Record<string, PlanningItemView>;
  checklistTemplateVersions: ChecklistTemplateVersionView[];
  reminderRules: ReminderRuleView[];
  auditEvents: AuditEventView[];
  packages: Record<string, InspectionPackage>;
  checklistResponses: Record<string, import("../backend/backend").ChecklistResponseView>;
  potentialFindings: Record<string, PotentialFindingView>;
  findings: Record<string, FindingView>;
  capRevisions: MockCapRevision[];
  evidenceVersions: MockEvidenceVersion[];
  evidenceReviews: MockEvidenceReview[];
  uploads: Record<string, MockUpload>;
  reportVersions: Record<string, ReportVersionView>;
  counters: {
    potentialFinding: number;
    finding: number;
    upload: number;
    evidenceReview: number;
    inspectionAttachment: number;
    auditEvent: number;
  };
}

const allowedAnswers = [
  "COMPLIANT",
  "NON_COMPLIANT",
  "OBSERVATION",
  "NOT_APPLICABLE",
  "NOT_CHECKED",
] as const;

function cabinQuestion(
  id: string,
  sectionId: string,
  prompt: string,
  assignedInspectorUserIds: string[],
  expectedEvidence = "Inspector observation and required exception comment",
): InspectionQuestion {
  return {
    id,
    sectionId,
    prompt,
    regulatoryReference: `Configured Cabin Inspection reference — ${sectionId}`,
    expectedEvidence,
    allowedAnswers: [...allowedAnswers],
    commentRequiredFor: ["NON_COMPLIANT", "OBSERVATION"],
    assignedInspectorUserIds,
    currentResponse: null,
  };
}

export function createCanonicalSeedState(now: string): MockState {
  const canonicalPackage: InspectionPackage = {
    id: "PKG-CAB-2026-001",
    auditId: "AUD-2026-001",
    organizationId: "ORG-FLY-NAMIBIA",
    organizationName: "Fly Namibia",
    title: "2026 Cabin Inspection - Fly Namibia",
    packageVersion: 1,
    schemaVersion: 1,
    protocolVersion: 1,
    templateVersionId: "CTV-CABIN-1",
    packageDigest: "sha256:candidate-cabin-package-v1",
    expiresAt: "2026-07-15T23:59:59.000Z",
    checklistStatus: "IN_PROGRESS",
    checklistRevision: 1,
    questions: [
      cabinQuestion(
        "CAB-GALLEY-001",
        "GALLEY",
        "Are galley restraints and stowage areas serviceable and secure?",
        ["USR-INSPECTOR-DAVID"],
      ),
      cabinQuestion(
        "CAB-LAV-001",
        "LAV",
        "Are lavatory safety equipment and placards present and serviceable?",
        ["USR-INSPECTOR-AMINA"],
      ),
      cabinQuestion(
        "CAB-PAX-SEAT-001",
        "PAX SEAT",
        "Are passenger seats, belts, and adjacent fittings serviceable?",
        ["USR-INSPECTOR-AMINA"],
      ),
      cabinQuestion(
        "CAB-EMEQ-PBE-001",
        "EM EQ / PBE",
        "Is the PBE installed, serviceable, accessible, and in compliance with configured cabin emergency equipment requirements?",
        ["USR-INSPECTOR-AMINA"],
        "PBE serviceability record and cabin position confirmation",
      ),
      cabinQuestion(
        "CAB-VID-CREW-SEAT-001",
        "VID+CREW SEAT",
        "Are cabin information displays and crew seats serviceable?",
        ["USR-INSPECTOR-AMINA"],
      ),
      cabinQuestion(
        "CAB-COCKPIT-GEN-001",
        "COCKPIT+CAB GEN COND+EXITS",
        "Are cabin general condition and emergency exits satisfactory?",
        ["USR-INSPECTOR-AMINA"],
      ),
    ],
  };

  const otherOrganizationFinding: FindingView = {
    id: "FND-SKYCARGO-2026-099",
    findingNumber: "CAR-2026-099",
    auditId: "AUD-2026-099",
    organizationId: "ORG-SKYCARGO",
    organizationName: "SkyCargo Air",
    title: "Cargo restraint record needs follow-up",
    description: "A configured cargo oversight check remains open.",
    regulatoryReference: "Configured cargo reference",
    findingBasis: "Configured check result",
    severity: "LEVEL_2_MAJOR",
    status: "OPEN",
    dueDate: "2026-07-30",
    dueState: "NOT_DUE",
    currentOwnerType: "AUDITEE",
    currentOwnerId: "ORG-SKYCARGO",
    currentOwnerRole: "auditee",
    nextAction: "SkyCargo Air to submit CAP",
    capRequired: true,
    evidenceRequired: true,
    repeatFinding: false,
    createdAt: now,
    issuedAt: now,
    closedAt: null,
    closureBasis: null,
    revision: 1,
  };

  return {
    assignments: [
      {
        auditId: canonicalPackage.auditId,
        organizationId: canonicalPackage.organizationId,
        organizationName: canonicalPackage.organizationName,
        title: canonicalPackage.title,
        status: "IN_PROGRESS",
        dueDate: "2026-06-18",
        dueState: "DUE_SOON",
        nextAction: "Continue Cabin Inspection checklist",
      },
    ],
    organizations: [
      {
        id: "ORG-FLY-NAMIBIA",
        legalName: "Fly Namibia",
        organizationType: "OPERATOR",
        status: "ACTIVE",
        openFindingCount: 0,
        lastAuditDate: null,
        nextAuditDate: "2026-07-15",
        revision: 1,
      },
      {
        id: "ORG-SKYCARGO",
        legalName: "SkyCargo Air",
        organizationType: "OPERATOR",
        status: "ACTIVE",
        openFindingCount: 1,
        lastAuditDate: null,
        nextAuditDate: "2026-07-30",
        revision: 1,
      },
    ],
    planningItems: {
      "PLAN-2026-CAB-001": {
        id: "PLAN-2026-CAB-001",
        title: "2026 Cabin Surveillance — Fly Namibia",
        planYear: 2026,
        organizationId: "ORG-FLY-NAMIBIA",
        organizationName: "Fly Namibia",
        inspectionType: "CABIN",
        scheduledDate: "2026-07-15",
        estimatedBudget: 48000,
        status: "FINANCE_REVIEW",
        currentOwnerRole: "finance",
        nextAction: "Finance to review budget",
        revision: 1,
      },
    },
    checklistTemplateVersions: [
      {
        id: "CTV-CABIN-1",
        templateId: "CABIN",
        title: "Cabin Inspection checklist",
        version: 1,
        status: "PUBLISHED",
        publishedAt: now,
        questionCount: 6,
      },
    ],
    reminderRules: [
      { id: "REM-30", label: "30 days before Due Date", offsetDays: 30, channel: "IN_APP", status: "ACTIVE", revision: 1 },
      { id: "REM-15", label: "15 days before Due Date", offsetDays: 15, channel: "IN_APP", status: "ACTIVE", revision: 1 },
      { id: "REM-7", label: "7 days before Due Date", offsetDays: 7, channel: "IN_APP", status: "ACTIVE", revision: 1 },
      { id: "REM-DUE", label: "On the Due Date", offsetDays: 0, channel: "IN_APP", status: "ACTIVE", revision: 1 },
      { id: "REM-OVERDUE", label: "After the Due Date", offsetDays: -1, channel: "IN_APP", status: "ACTIVE", revision: 1 },
    ],
    auditEvents: [],
    packages: { [canonicalPackage.id]: canonicalPackage },
    checklistResponses: {},
    potentialFindings: {},
    findings: { [otherOrganizationFinding.id]: otherOrganizationFinding },
    capRevisions: [],
    evidenceVersions: [],
    evidenceReviews: [],
    uploads: {},
    reportVersions: {
      "RPT-CAB-2026-001-V1": {
        reportVersionId: "RPT-CAB-2026-001-V1",
        reportId: "RPT-CAB-2026-001",
        organizationId: "ORG-FLY-NAMIBIA",
        auditId: "AUD-2026-001",
        findingIds: ["FND-CAB-2026-001"],
        contentHash: "sha256:candidate-report-v1",
        version: 1,
        status: "EXECUTIVE_DIRECTOR_REVIEW",
        revision: 1,
        issuedAt: null,
      },
    },
    counters: {
      potentialFinding: 1,
      finding: 1,
      upload: 1,
      evidenceReview: 1,
      inspectionAttachment: 1,
      auditEvent: 1,
    },
  };
}

export function publicEvidenceVersion(version: MockEvidenceVersion): EvidenceVersionView {
  const {
    id,
    findingId,
    organizationId,
    version: versionNumber,
    fileName,
    submittedAt,
    uploadState,
    scanState,
    reviewState,
    revision,
  } = version;
  return {
    id,
    findingId,
    organizationId,
    version: versionNumber,
    fileName,
    submittedAt,
    uploadState: uploadState as EvidenceUploadState,
    scanState: scanState as EvidenceScanState,
    reviewState: reviewState as EvidenceReviewState,
    revision,
  };
}
