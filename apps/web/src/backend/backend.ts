export type BackendMode = "mock" | "http";
export type LocalDate = string;
export type Instant = string;

export type Role =
  | "inspector"
  | "leadInspector"
  | "manager"
  | "finance"
  | "gm"
  | "executiveDirector"
  | "auditee"
  | "admin";

export interface BackendPrincipal {
  subjectId: string;
  role: Role;
  organizationId: string | null;
}

export interface BackendRequestOptions {
  signal?: AbortSignal;
}

export type ChecklistAnswer =
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "OBSERVATION"
  | "NOT_APPLICABLE"
  | "NOT_CHECKED";

export type DueState = "NONE" | "NOT_DUE" | "DUE_SOON" | "DUE_TODAY" | "OVERDUE";

export type PotentialFindingStatus =
  | "PENDING_LEAD_REVIEW"
  | "RETURNED"
  | "DISMISSED"
  | "CONVERTED";

export type FindingStatus =
  | "DRAFT"
  | "OPEN"
  | "WAITING_FOR_CAP"
  | "CAP_SUBMITTED"
  | "CAP_ACCEPTED"
  | "CAP_REJECTED"
  | "CAP_MORE_INFORMATION_REQUESTED"
  | "EVIDENCE_REQUIRED"
  | "EVIDENCE_SUBMITTED"
  | "PENDING_CAA_REVIEW"
  | "EVIDENCE_MORE_INFORMATION_REQUESTED"
  | "PENDING_CLOSURE"
  | "CLOSED"
  | "ESCALATED";

export type CapStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_CAA_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "MORE_INFORMATION_REQUESTED"
  | "SUPERSEDED";

export type EvidenceUploadState = "PENDING" | "UPLOADING" | "UPLOADED" | "FAILED";
export type EvidenceScanState = "PENDING" | "CLEAN" | "QUARANTINED" | "FAILED";
export type EvidenceReviewState =
  | "NOT_READY"
  | "PENDING_CAA_REVIEW"
  | "ACCEPTED"
  | "PARTIALLY_ACCEPTED"
  | "REJECTED"
  | "MORE_INFORMATION_REQUESTED";

export type FindingSeverity =
  | "LEVEL_1_CRITICAL"
  | "LEVEL_2_MAJOR"
  | "LEVEL_3_MINOR"
  | "OBSERVATION";

export type ReportApprovalStatus =
  | "DRAFT"
  | "DEPARTMENT_REVIEW"
  | "GM_REVIEW"
  | "EXECUTIVE_DIRECTOR_REVIEW"
  | "RETURNED"
  | "ISSUED"
  | "LOCKED";

export interface CommandMeta {
  operationId: string;
}

export interface AssignmentSummary {
  auditId: string;
  organizationId: string;
  organizationName: string;
  title: string;
  status: string;
  dueDate: LocalDate | null;
  dueState: DueState;
  nextAction: string;
}

export interface ListAssignmentsInput {
  cursor?: string;
  limit?: number;
  status?: string;
}

export interface ListAssignmentsOutput {
  items: AssignmentSummary[];
  nextCursor: string | null;
}

export interface ChecklistResponseView {
  id: string;
  questionId: string;
  answer: ChecklistAnswer;
  comment: string;
  revision: number;
  updatedAt: Instant;
}

export interface InspectionQuestion {
  id: string;
  sectionId: string;
  prompt: string;
  regulatoryReference: string | null;
  expectedEvidence: string | null;
  allowedAnswers: ChecklistAnswer[];
  commentRequiredFor: ChecklistAnswer[];
  assignedInspectorUserIds: string[];
  currentResponse: ChecklistResponseView | null;
}

export interface InspectionPackage {
  id: string;
  auditId: string;
  organizationId: string;
  organizationName: string;
  title: string;
  packageVersion: number;
  schemaVersion: number;
  protocolVersion: number;
  templateVersionId: string;
  packageDigest: string;
  expiresAt: Instant;
  checklistStatus: "IN_PROGRESS" | "SUBMITTED";
  checklistRevision: number;
  questions: InspectionQuestion[];
}

export interface UpsertChecklistResponseInput extends CommandMeta {
  responseId: string;
  auditId: string;
  questionId: string;
  expectedResponseRevision: number | null;
  answer: ChecklistAnswer;
  comment: string;
}

export interface SubmitChecklistInput extends CommandMeta {
  auditId: string;
  expectedChecklistRevision: number;
}

export interface ReopenChecklistInput extends CommandMeta {
  auditId: string;
  expectedChecklistRevision: number;
  reason: string;
}

export interface SubmitChecklistOutput {
  auditId: string;
  checklistStatus: "IN_PROGRESS" | "SUBMITTED";
  checklistRevision: number;
}

export interface OfflineGrant {
  grantId: string;
  subjectId: string;
  organizationId: string;
  packageId: string;
  packageVersion: number;
  packageDigest: string;
  allowedCommandTypes: FieldCommandType[];
  assignmentScope: { questionIds: string[] };
  deviceInstanceId: string;
  issuedAt: Instant;
  expiresAt: Instant;
  protocolVersion: number;
}

export interface CheckoutInspectionPackageInput extends CommandMeta {
  packageId: string;
  expectedPackageVersion: number;
  deviceInstanceId: string;
}

export interface CheckoutInspectionPackageOutput {
  inspectionPackage: InspectionPackage;
  offlineGrant: OfflineGrant;
}

export interface CreatePotentialFindingInput extends CommandMeta {
  auditId: string;
  questionId: string;
  checklistResponseId: string;
  expectedChecklistResponseRevision: number;
  title: string;
  description: string;
  requiredComment: string;
  inspectionAttachmentIds: string[];
}

export interface PotentialFindingView {
  id: string;
  auditId: string;
  questionId: string;
  organizationId: string;
  title: string;
  description: string;
  status: PotentialFindingStatus;
  revision: number;
  convertedFindingId: string | null;
}

export type DecidePotentialFindingInput =
  | (CommandMeta & {
      potentialFindingId: string;
      expectedPotentialFindingRevision: number;
      decision: "RETURN" | "DISMISS";
      reason: string;
    })
  | (CommandMeta & {
      potentialFindingId: string;
      expectedPotentialFindingRevision: number;
      decision: "CONVERT";
      severity: FindingSeverity;
      capRequired: boolean;
      evidenceRequired: boolean;
      dueDate: LocalDate | null;
    });

export interface PotentialFindingDecisionOutput {
  potentialFinding: PotentialFindingView;
  finding: FindingView | null;
}

export interface FindingView {
  id: string;
  findingNumber: string;
  auditId: string;
  organizationId: string;
  organizationName: string;
  title: string;
  description: string;
  regulatoryReference: string | null;
  findingBasis: string;
  severity: FindingSeverity;
  status: FindingStatus;
  dueDate: LocalDate | null;
  dueState: DueState;
  currentOwnerType: "CAA" | "AUDITEE";
  currentOwnerId: string;
  currentOwnerRole: Role;
  nextAction: string;
  capRequired: boolean;
  evidenceRequired: boolean;
  repeatFinding: boolean;
  createdAt: Instant;
  issuedAt: Instant | null;
  closedAt: Instant | null;
  closureBasis: "EVIDENCE_VERIFIED" | "AUTHORIZED" | null;
  revision: number;
}

export interface ListFindingsInput {
  cursor?: string;
  limit?: number;
  status?: FindingStatus;
}

export interface ListFindingsOutput {
  items: FindingView[];
  nextCursor: string | null;
}

export interface AuthorizedCloseInput extends CommandMeta {
  findingId: string;
  expectedFindingRevision: number;
  reason: string;
}

export interface SubmitCapInput extends CommandMeta {
  findingId: string;
  expectedFindingRevision: number;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  responsiblePerson: string;
  targetCompletionDate: LocalDate;
  commentToCaa: string;
}

export interface SubmitCapOutput {
  capRevisionId: string;
  capRevision: number;
  capStatus: "SUBMITTED" | "PENDING_CAA_REVIEW";
  findingStatus: FindingStatus;
  findingRevision: number;
}

export interface ReviewCapInput extends CommandMeta {
  capRevisionId: string;
  expectedCapRevision: number;
  findingId: string;
  expectedFindingRevision: number;
  decision: "ACCEPT" | "REJECT" | "REQUEST_MORE_INFORMATION";
  commentToAuditee: string;
  internalCaaNote: string;
}

export interface ReviewCapOutput {
  capRevisionId: string;
  capRevision: number;
  capStatus: CapStatus;
  findingStatus: FindingStatus;
  findingRevision: number;
}

export interface BeginInspectionAttachmentUploadInput extends CommandMeta {
  inspectionAttachmentId: string;
  packageId: string;
  byteSize: number;
  sha256: string;
  fileName: string;
  declaredMediaType: string;
}

export interface BeginInspectionAttachmentUploadOutput {
  uploadId: string;
  stagingObjectKey: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  expiresAt: Instant;
  maximumByteSize: number;
}

export interface CompleteInspectionAttachmentUploadInput extends CommandMeta {
  uploadId: string;
  sha256: string;
  byteSize: number;
}

export interface CompleteInspectionAttachmentUploadOutput {
  inspectionAttachmentId: string;
  uploadState: "UPLOADED";
  scanState: "PENDING";
}

export interface BeginEvidenceUploadInput extends CommandMeta {
  findingId: string;
  expectedFindingRevision: number;
  fileName: string;
  declaredMediaType: string;
  byteSize: number;
  sha256: string;
}

export interface BeginEvidenceUploadOutput {
  uploadId: string;
  stagingObjectKey: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  expiresAt: Instant;
  maximumByteSize: number;
}

export interface CompleteEvidenceUploadInput extends CommandMeta {
  uploadId: string;
  sha256: string;
  byteSize: number;
}

export interface CompleteEvidenceUploadOutput {
  evidenceVersionId: string;
  version: number;
  uploadState: "UPLOADED";
  scanState: "PENDING" | "CLEAN";
  reviewState: EvidenceReviewState;
}

export interface EvidenceVersionView {
  id: string;
  findingId: string;
  organizationId: string;
  version: number;
  fileName: string;
  submittedAt: Instant;
  uploadState: EvidenceUploadState;
  scanState: EvidenceScanState;
  reviewState: EvidenceReviewState;
  revision: number;
}

export interface ReviewEvidenceInput extends CommandMeta {
  evidenceVersionId: string;
  expectedEvidenceVersionRevision: number;
  findingId: string;
  expectedFindingRevision: number;
  decision: "CLOSE" | "PARTIALLY_CLOSE" | "NOT_CLOSE" | "REQUEST_MORE_INFORMATION";
  commentToAuditee: string;
  internalCaaNote: string;
}

export interface ReviewEvidenceOutput {
  reviewDecisionId: string;
  evidenceVersionId: string;
  evidenceVersionRevision: number;
  findingStatus: FindingStatus;
  findingRevision: number;
}

export interface ReportVersionView {
  reportVersionId: string;
  reportId: string;
  organizationId: string;
  auditId: string;
  findingIds: string[];
  contentHash: string;
  version: number;
  status: ReportApprovalStatus;
  revision: number;
  issuedAt: Instant | null;
}

export interface DecideReportInput extends CommandMeta {
  reportVersionId: string;
  expectedReportVersionRevision: number;
  decision: "RETURN" | "FORWARD" | "ISSUE_AND_LOCK";
  reason: string;
}

export interface ManagerDashboardProjection {
  generatedAt: Instant;
  openFindings: number;
  closedFindings: number;
  overdueFindings: number;
  pendingCapReviews: number;
  pendingEvidenceReviews: number;
  recentFindingNumbers: string[];
}

export interface OrganizationSummary {
  id: string;
  legalName: string;
  organizationType: string;
  status: string;
  openFindingCount: number;
  lastAuditDate: LocalDate | null;
  nextAuditDate: LocalDate | null;
  revision: number;
}

export interface ListOrganizationsOutput {
  items: OrganizationSummary[];
  nextCursor: string | null;
}

export type PlanningStatus =
  | "FINANCE_REVIEW"
  | "GM_REVIEW"
  | "EXECUTIVE_DIRECTOR_REVIEW"
  | "GM_RELEASE"
  | "RELEASED"
  | "RETURNED";

export type PlanningDecision =
  | "APPROVE_BUDGET"
  | "FORWARD_FOR_FINAL_APPROVAL"
  | "APPROVE_PLAN"
  | "RELEASE_PLAN"
  | "RETURN_FOR_REVISION";

export interface PlanningItemView {
  id: string;
  title: string;
  planYear: number;
  organizationId: string;
  organizationName: string;
  inspectionType: string;
  scheduledDate: LocalDate;
  estimatedBudget: number;
  status: PlanningStatus;
  currentOwnerRole: Role;
  nextAction: string;
  revision: number;
}

export interface ListPlanningItemsOutput {
  items: PlanningItemView[];
  nextCursor: string | null;
}

export interface PlanningDecisionInput extends CommandMeta {
  planningItemId: string;
  expectedPlanningRevision: number;
  decision: PlanningDecision;
  reason: string;
}

export interface ChecklistTemplateVersionView {
  id: string;
  templateId: string;
  title: string;
  version: number;
  status: "PUBLISHED";
  publishedAt: Instant;
  questionCount: number;
}

export interface ReminderRuleView {
  id: string;
  label: string;
  offsetDays: number;
  channel: "IN_APP";
  status: "ACTIVE";
  revision: number;
}

export interface AuditEventView {
  eventId: string;
  occurredAt: Instant;
  actorRole: Role | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeStatus: string | null;
  afterStatus: string | null;
  reason: string | null;
}

export interface PageOutput<T> {
  items: T[];
  nextCursor: string | null;
}

export type FieldCommandType =
  | "UPSERT_CHECKLIST_RESPONSE"
  | "CREATE_POTENTIAL_FINDING"
  | "SUBMIT_CHECKLIST"
  | "REGISTER_INSPECTION_ATTACHMENT";

export interface FieldOperationBase<TType extends FieldCommandType, TPayload> {
  operationId: string;
  protocolVersion: number;
  offlineGrantId: string;
  packageId: string;
  packageVersion: number;
  entityId: string;
  commandType: TType;
  baseRevision: number | null;
  deviceInstanceId: string;
  clientOccurredAt: Instant;
  payload: TPayload;
}

export type FieldSyncOperation =
  | FieldOperationBase<
      "UPSERT_CHECKLIST_RESPONSE",
      { auditId: string; questionId: string; answer: ChecklistAnswer; comment: string }
    >
  | FieldOperationBase<
      "CREATE_POTENTIAL_FINDING",
      {
        auditId: string;
        questionId: string;
        checklistResponseId: string;
        expectedChecklistResponseRevision: number | null;
        title: string;
        description: string;
        requiredComment: string;
        inspectionAttachmentIds: string[];
      }
    >
  | FieldOperationBase<"SUBMIT_CHECKLIST", { auditId: string }>
  | FieldOperationBase<
      "REGISTER_INSPECTION_ATTACHMENT",
      {
        auditId: string;
        checklistResponseId: string;
        potentialFindingOperationId: string | null;
        fileName: string;
        mediaType: string;
        byteSize: number;
        sha256: string;
      }
    >;

export interface PushFieldOperationRequest {
  operation: FieldSyncOperation;
}

export type PushFieldOperationStatus =
  | "accepted"
  | "already_applied"
  | "conflict"
  | "forbidden"
  | "invalid"
  | "retryable";

export interface AuthorizedConflictDescriptor {
  code: "STALE_REVISION" | "PACKAGE_REVOKED" | "ASSIGNMENT_CHANGED";
  entityId: string;
  authoritativeRevision: number | null;
  authoritativeStatus: string | null;
  changedAt: Instant | null;
}

export interface PushFieldOperationResult {
  operationId: string;
  status: PushFieldOperationStatus;
  authoritativeEntityId: string | null;
  authoritativeRevision: number | null;
  errorCode: string | null;
  conflict: AuthorizedConflictDescriptor | null;
  acknowledgedAt: Instant;
}

export interface SyncPullRequest {
  packageId: string;
  offlineGrantId: string;
  cursor: string | null;
  limit?: number;
}

export type AuthorizedSyncChange =
  | { kind: "checklist_response"; value: ChecklistResponseView }
  | { kind: "potential_finding"; value: PotentialFindingView }
  | { kind: "package_revoked"; packageId: string; reasonCode: string; revokedAt: Instant }
  | {
      kind: "tombstone";
      entityType: "checklist_response" | "potential_finding";
      entityId: string;
      revision: number;
    };

export interface SyncPullResponse {
  changes: AuthorizedSyncChange[];
  nextCursor: string | null;
  hasMore: boolean;
  resnapshotRequired: boolean;
  projectionVersion: number;
}

export interface AssignmentBackend {
  list(input: ListAssignmentsInput, options?: BackendRequestOptions): Promise<ListAssignmentsOutput>;
}

export interface InspectionBackend {
  getPackage(
    input: { packageId: string },
    options?: BackendRequestOptions,
  ): Promise<InspectionPackage>;
  checkout(
    input: CheckoutInspectionPackageInput,
    options?: BackendRequestOptions,
  ): Promise<CheckoutInspectionPackageOutput>;
  upsertChecklistResponse(
    input: UpsertChecklistResponseInput,
    options?: BackendRequestOptions,
  ): Promise<ChecklistResponseView>;
  submitChecklist(
    input: SubmitChecklistInput,
    options?: BackendRequestOptions,
  ): Promise<SubmitChecklistOutput>;
  reopenChecklist(
    input: ReopenChecklistInput,
    options?: BackendRequestOptions,
  ): Promise<SubmitChecklistOutput>;
}

export interface PotentialFindingBackend {
  create(
    input: CreatePotentialFindingInput,
    options?: BackendRequestOptions,
  ): Promise<PotentialFindingView>;
  decide(
    input: DecidePotentialFindingInput,
    options?: BackendRequestOptions,
  ): Promise<PotentialFindingDecisionOutput>;
}

export interface FindingBackend {
  list(input: ListFindingsInput, options?: BackendRequestOptions): Promise<ListFindingsOutput>;
  get(
    input: { findingId: string },
    options?: BackendRequestOptions,
  ): Promise<FindingView>;
  authorizedClose(
    input: AuthorizedCloseInput,
    options?: BackendRequestOptions,
  ): Promise<FindingView>;
}

export interface CapBackend {
  submit(input: SubmitCapInput, options?: BackendRequestOptions): Promise<SubmitCapOutput>;
  review(input: ReviewCapInput, options?: BackendRequestOptions): Promise<ReviewCapOutput>;
}

export interface InspectionAttachmentBackend {
  beginUpload(
    input: BeginInspectionAttachmentUploadInput,
    options?: BackendRequestOptions,
  ): Promise<BeginInspectionAttachmentUploadOutput>;
  completeUpload(
    input: CompleteInspectionAttachmentUploadInput,
    options?: BackendRequestOptions,
  ): Promise<CompleteInspectionAttachmentUploadOutput>;
}

export interface EvidenceBackend {
  beginUpload(
    input: BeginEvidenceUploadInput,
    options?: BackendRequestOptions,
  ): Promise<BeginEvidenceUploadOutput>;
  completeUpload(
    input: CompleteEvidenceUploadInput,
    options?: BackendRequestOptions,
  ): Promise<CompleteEvidenceUploadOutput>;
  listVersions(
    input: { findingId: string },
    options?: BackendRequestOptions,
  ): Promise<EvidenceVersionView[]>;
  review(
    input: ReviewEvidenceInput,
    options?: BackendRequestOptions,
  ): Promise<ReviewEvidenceOutput>;
}

export interface ReportBackend {
  getVersion(
    input: { reportVersionId: string },
    options?: BackendRequestOptions,
  ): Promise<ReportVersionView>;
  decide(input: DecideReportInput, options?: BackendRequestOptions): Promise<ReportVersionView>;
}

export interface DashboardBackend {
  getManagerProjection(
    input: { organizationId?: string },
    options?: BackendRequestOptions,
  ): Promise<ManagerDashboardProjection>;
}

export interface OrganizationBackend {
  list(
    input: { limit?: number },
    options?: BackendRequestOptions,
  ): Promise<ListOrganizationsOutput>;
}

export interface PlanningBackend {
  list(
    input: { limit?: number },
    options?: BackendRequestOptions,
  ): Promise<ListPlanningItemsOutput>;
  decide(
    input: PlanningDecisionInput,
    options?: BackendRequestOptions,
  ): Promise<PlanningItemView>;
}

export interface ConfigurationBackend {
  listChecklistTemplateVersions(
    input: { limit?: number },
    options?: BackendRequestOptions,
  ): Promise<PageOutput<ChecklistTemplateVersionView>>;
  listReminderRules(
    input: { limit?: number },
    options?: BackendRequestOptions,
  ): Promise<PageOutput<ReminderRuleView>>;
}

export interface AuditTrailBackend {
  list(
    input: { entityType?: string; entityId?: string; limit?: number },
    options?: BackendRequestOptions,
  ): Promise<PageOutput<AuditEventView>>;
}

export interface SyncBackend {
  pushOperation(
    input: PushFieldOperationRequest,
    options?: BackendRequestOptions,
  ): Promise<PushFieldOperationResult>;
  pull(input: SyncPullRequest, options?: BackendRequestOptions): Promise<SyncPullResponse>;
}

export interface Backend {
  readonly mode: BackendMode;
  readonly assignments: AssignmentBackend;
  readonly inspections: InspectionBackend;
  readonly potentialFindings: PotentialFindingBackend;
  readonly findings: FindingBackend;
  readonly caps: CapBackend;
  readonly inspectionAttachments: InspectionAttachmentBackend;
  readonly evidence: EvidenceBackend;
  readonly reports: ReportBackend;
  readonly dashboards: DashboardBackend;
  readonly organizations: OrganizationBackend;
  readonly planning: PlanningBackend;
  readonly configuration: ConfigurationBackend;
  readonly auditTrail: AuditTrailBackend;
  readonly sync: SyncBackend;
}
