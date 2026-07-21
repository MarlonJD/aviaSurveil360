import type { components } from "../generated/transport/api-types";
import type {
  AssignmentSummary,
  AuditEventView,
  CapRevisionView,
  ChecklistTemplateQuestionView,
  ChecklistTemplateVersionDetailView,
  ChecklistTemplateVersionView,
  ChecklistResponseView,
  CheckoutInspectionPackageOutput,
  CompleteEvidenceUploadOutput,
  CompleteInspectionAttachmentUploadOutput,
  EvidenceVersionView,
  FindingView,
  InspectionPackage,
  ListOrganizationsOutput,
  ListPlanningItemsOutput,
  ListAssignmentsOutput,
  ListCapRevisionsOutput,
  ListFindingsOutput,
  ListPotentialFindingsOutput,
  ManagerDashboardProjection,
  OrganizationSummary,
  PageOutput,
  PlanningItemView,
  PotentialFindingDecisionOutput,
  PotentialFindingView,
  PushFieldOperationResult,
  ReportVersionView,
  ReminderRuleView,
  Role,
  ReviewCapOutput,
  ReviewEvidenceOutput,
  SubmitCapOutput,
  SubmitChecklistOutput,
  SyncPullResponse,
} from "./backend";

type Schemas = components["schemas"];

export function mapAssignment(value: Schemas["AssignmentSummary"]): AssignmentSummary {
  return {
    auditId: value.auditId,
    organizationId: value.organizationId,
    organizationName: value.organizationName,
    title: value.title,
    status: value.status,
    dueDate: value.dueDate,
    dueState: value.dueState,
    nextAction: value.nextAction,
  };
}

export function mapAssignments(value: Schemas["ListAssignmentsOutput"]): ListAssignmentsOutput {
  return { items: value.items.map(mapAssignment), nextCursor: value.nextCursor };
}

export function mapChecklistResponse(
  value: Schemas["ChecklistResponseView"],
): ChecklistResponseView {
  return {
    id: value.id,
    questionId: value.questionId,
    answer: value.answer,
    comment: value.comment,
    revision: value.revision,
    updatedAt: value.updatedAt,
  };
}

export function mapInspectionPackage(value: Schemas["InspectionPackage"]): InspectionPackage {
  return {
    id: value.id,
    auditId: value.auditId,
    organizationId: value.organizationId,
    organizationName: value.organizationName,
    title: value.title,
    packageVersion: value.packageVersion,
    schemaVersion: value.schemaVersion,
    protocolVersion: value.protocolVersion,
    templateVersionId: value.templateVersionId,
    packageDigest: value.packageDigest,
    expiresAt: value.expiresAt,
    checklistStatus: value.checklistStatus,
    checklistRevision: value.checklistRevision,
    questions: value.questions.map((question) => ({
      id: question.id,
      sectionId: question.sectionId,
      prompt: question.prompt,
      regulatoryReference: question.regulatoryReference,
      expectedEvidence: question.expectedEvidence,
      allowedAnswers: [...question.allowedAnswers],
      commentRequiredFor: [...question.commentRequiredFor],
      assignedInspectorUserIds: [...question.assignedInspectorUserIds],
      currentResponse: question.currentResponse
        ? mapChecklistResponse(question.currentResponse)
        : null,
    })),
  };
}

export function mapCheckout(
  value: Schemas["CheckoutInspectionPackageOutput"],
): CheckoutInspectionPackageOutput {
  return {
    inspectionPackage: mapInspectionPackage(value.inspectionPackage),
    offlineGrant: {
      ...value.offlineGrant,
      allowedCommandTypes: [...value.offlineGrant.allowedCommandTypes],
      assignmentScope: { questionIds: [...value.offlineGrant.assignmentScope.questionIds] },
    },
  };
}

export function mapSubmitChecklist(
  value: Schemas["SubmitChecklistOutput"],
): SubmitChecklistOutput {
  return { ...value };
}

export function mapPotentialFinding(
  value: Schemas["PotentialFindingView"],
): PotentialFindingView {
  return { ...value };
}

export function mapPotentialFindings(
  value: Schemas["ListPotentialFindingsOutput"],
): ListPotentialFindingsOutput {
  return { items: value.items.map(mapPotentialFinding), nextCursor: value.nextCursor };
}

export function mapFinding(value: Schemas["FindingView"]): FindingView {
  return {
    id: value.id,
    findingNumber: value.findingNumber,
    auditId: value.auditId,
    organizationId: value.organizationId,
    organizationName: value.organizationName,
    title: value.title,
    description: value.description,
    regulatoryReference: value.regulatoryReference,
    findingBasis: value.findingBasis,
    severity: value.severity,
    status: value.status,
    dueDate: value.dueDate,
    dueState: value.dueState,
    currentOwnerType: value.currentOwnerType,
    currentOwnerId: value.currentOwnerId,
    currentOwnerRole: value.currentOwnerRole,
    nextAction: value.nextAction,
    capRequired: value.capRequired,
    evidenceRequired: value.evidenceRequired,
    repeatFinding: value.repeatFinding,
    createdAt: value.createdAt,
    issuedAt: value.issuedAt,
    closedAt: value.closedAt,
    closureBasis: value.closureBasis,
    revision: value.revision,
  };
}

export function mapFindings(value: Schemas["ListFindingsOutput"]): ListFindingsOutput {
  return { items: value.items.map(mapFinding), nextCursor: value.nextCursor };
}

export function mapPotentialFindingDecision(
  value: Schemas["PotentialFindingDecisionOutput"],
): PotentialFindingDecisionOutput {
  return {
    potentialFinding: mapPotentialFinding(value.potentialFinding),
    finding: value.finding ? mapFinding(value.finding) : null,
  };
}

export function mapSubmitCap(value: Schemas["SubmitCapOutput"]): SubmitCapOutput {
  return { ...value };
}

export function mapReviewCap(value: Schemas["ReviewCapOutput"]): ReviewCapOutput {
  return { ...value };
}

export function mapCapRevision(value: Schemas["CapRevisionView"]): CapRevisionView {
  if (value.audience === "AUDITEE") {
    return {
      ...value,
      latestReview: value.latestReview ? { ...value.latestReview } : null,
    };
  }
  return {
    ...value,
    latestReview: value.latestReview ? { ...value.latestReview } : null,
  };
}

export function mapCapRevisions(value: Schemas["ListCapRevisionsOutput"]): ListCapRevisionsOutput {
  return { items: value.items.map(mapCapRevision), nextCursor: null };
}

export function mapCompleteInspectionAttachment(
  value: Schemas["CompleteInspectionAttachmentUploadOutput"],
): CompleteInspectionAttachmentUploadOutput {
  return { ...value };
}

export function mapCompleteEvidence(
  value: Schemas["CompleteEvidenceUploadOutput"],
): CompleteEvidenceUploadOutput {
  return { ...value };
}

export function mapEvidenceVersion(value: Schemas["EvidenceVersionView"]): EvidenceVersionView {
  return { ...value };
}

export function mapReviewEvidence(
  value: Schemas["ReviewEvidenceOutput"],
): ReviewEvidenceOutput {
  return { ...value };
}

export function mapReportVersion(value: Schemas["ReportVersionView"]): ReportVersionView {
  return { ...value, findingIds: [...value.findingIds] };
}

export function mapManagerDashboard(
  value: Schemas["ManagerDashboardProjection"],
): ManagerDashboardProjection {
  return { ...value, recentFindingNumbers: [...value.recentFindingNumbers] };
}

export function mapOrganization(value: Schemas["OrganizationSummary"]): OrganizationSummary {
  return { ...value };
}

export function mapOrganizations(
  value: Schemas["ListOrganizationsOutput"],
): ListOrganizationsOutput {
  return { items: value.items.map(mapOrganization), nextCursor: value.nextCursor };
}

export function mapPlanningItem(value: Schemas["PlanningItemView"]): PlanningItemView {
  return { ...value };
}

export function mapPlanningItems(
  value: Schemas["ListPlanningItemsOutput"],
): ListPlanningItemsOutput {
  return { items: value.items.map(mapPlanningItem), nextCursor: value.nextCursor };
}

export function mapChecklistTemplateVersions(
  value: Schemas["ListChecklistTemplateVersionsOutput"],
): PageOutput<ChecklistTemplateVersionView> {
  return { items: value.items.map((item) => ({ ...item })), nextCursor: value.nextCursor };
}

export function mapChecklistTemplateQuestion(
  value: Schemas["ChecklistTemplateQuestionView"],
): ChecklistTemplateQuestionView {
  return {
    ...value,
    allowedAnswers: [...value.allowedAnswers],
    commentRequiredFor: [...value.commentRequiredFor],
  };
}

export function mapChecklistTemplateVersionDetail(
  value: Schemas["ChecklistTemplateVersionDetailView"],
): ChecklistTemplateVersionDetailView {
  return {
    ...value,
    questions: value.questions.map(mapChecklistTemplateQuestion),
  };
}

export function mapReminderRules(
  value: Schemas["ListReminderRulesOutput"],
): PageOutput<ReminderRuleView> {
  return { items: value.items.map((item) => ({ ...item })), nextCursor: value.nextCursor };
}

export function mapAuditEvents(
  value: Schemas["ListAuditEventsOutput"],
): PageOutput<AuditEventView> {
  return {
    items: value.items.map((item) => ({
      ...item,
      actorRole: item.actorRole as Role | null,
    })),
    nextCursor: value.nextCursor,
  };
}

export function mapPushResult(
  value: Schemas["PushFieldOperationResult"],
): PushFieldOperationResult {
  return {
    ...value,
    conflict: value.conflict ? { ...value.conflict } : null,
  };
}

export function mapSyncPull(value: Schemas["SyncPullResponse"]): SyncPullResponse {
  return structuredClone(value) as unknown as SyncPullResponse;
}
