import Dexie, { type Table } from "dexie";

import type {
  AuthorizedSyncChange,
  ChecklistAnswer,
  ChecklistResponseView,
  FieldSyncOperation,
  InspectionPackage,
  OfflineGrant,
  SyncPullResponse,
} from "../backend/backend";
import {
  getBrowserOfflineFieldDatabase,
  type ChecklistResponseRow,
  type FieldAccessState,
  type FieldDatabaseOpenResult,
  type OfflineFieldDatabase,
  type OutboxRow,
  type PackageRow,
  type PotentialFindingDraftRow,
  type SyncStateRow,
} from "./db";
import {
  createOutboxRow,
  fieldOperationRequestDigest,
  isCausalDependencyState,
  isTerminalOutboxState,
  isUnsentOutboxState,
} from "./outbox";
import {
  canonicalJson,
  CURRENT_FIELD_PACKAGE_SCHEMA_VERSION,
  CURRENT_FIELD_PROTOCOL_VERSION,
  isFieldSchemaNOrNMinusOne,
  sha256Canonical,
} from "./schema-migrations";

export type FieldTransactionBoundary =
  | "after-checklist-response-write"
  | "after-potential-finding-write"
  | "after-checklist-submission-write"
  | "before-pull-cursor-write";

export type FieldTransactionFault = (
  boundary: FieldTransactionBoundary,
) => void | Promise<void>;

export class FieldRepositoryError extends Error {
  constructor(
    readonly code: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "FieldRepositoryError";
  }
}

export class FieldAtomicWriteError extends FieldRepositoryError {
  constructor(message: string, cause: unknown) {
    super("ATOMIC_WRITE_FAILED", message, { cause });
    this.name = "FieldAtomicWriteError";
  }
}

export class FieldPackageUnavailableError extends FieldRepositoryError {
  constructor(code: string, message: string) {
    super(code, message);
    this.name = "FieldPackageUnavailableError";
  }
}

export interface FieldCheckoutInput {
  inspectionPackage: InspectionPackage;
  offlineGrant: OfflineGrant;
  checkedOutAt: string;
}

export interface SaveLocalChecklistResponseInput {
  operationId: string;
  packageId: string;
  responseId: string;
  questionId: string;
  answer: ChecklistAnswer;
  comment: string;
}

export interface CreateLocalPotentialFindingInput {
  operationId: string;
  packageId: string;
  localId: string;
  questionId: string;
  checklistResponseId: string;
  title: string;
  description: string;
  requiredComment: string;
  inspectionAttachmentIds: string[];
}

export interface SubmitLocalChecklistInput {
  operationId: string;
  packageId: string;
}

export interface FieldChecklistSubmission {
  auditId: string;
  checklistStatus: "SUBMITTED";
  checklistRevision: number;
  syncState: "PENDING";
  operationId: string;
}

export interface FieldPackageView {
  inspectionPackage: InspectionPackage;
  accessState: FieldAccessState;
  responses: ChecklistResponseRow[];
  potentialFindingDrafts: PotentialFindingDraftRow[];
  pendingOperationCount: number;
}

export interface ApplyFieldPullPageInput {
  packageId: string;
  grantId: string;
  expectedCursor: string | null;
  page: SyncPullResponse;
}

export interface FieldSubjectSnapshot {
  packages: PackageRow[];
  checklistResponses: ChecklistResponseRow[];
  potentialFindingDrafts: PotentialFindingDraftRow[];
  outbox: OutboxRow[];
  syncState: SyncStateRow[];
}

interface IndexedDbFieldRepositoryOptions {
  database?: OfflineFieldDatabase;
  subjectId: string;
  now?: () => Date;
  transactionFault?: FieldTransactionFault;
}

const CLOCK_SKEW_MS = 5 * 60_000;

function parseInstant(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function sortByKey<T>(values: T[], key: (value: T) => string): T[] {
  return values.sort((left, right) => key(left).localeCompare(key(right)));
}

export class IndexedDbFieldRepository {
  readonly database: OfflineFieldDatabase;
  readonly subjectId: string;
  private readonly now: () => Date;
  private readonly transactionFault?: FieldTransactionFault;

  constructor(options: IndexedDbFieldRepositoryOptions) {
    this.database = options.database ?? getBrowserOfflineFieldDatabase();
    this.subjectId = options.subjectId;
    this.now = options.now ?? (() => new Date());
    this.transactionFault = options.transactionFault;
    if (!this.subjectId.trim()) {
      throw new FieldRepositoryError("SUBJECT_REQUIRED", "A bound session subject is required.");
    }
  }

  withClock(now: () => Date): IndexedDbFieldRepository {
    return new IndexedDbFieldRepository({
      database: this.database,
      subjectId: this.subjectId,
      now,
      transactionFault: this.transactionFault,
    });
  }

  async initialize(): Promise<FieldDatabaseOpenResult> {
    return this.database.openForFieldUse();
  }

  private async requireReadWrite(): Promise<void> {
    const result = await this.initialize();
    if (result.mode === "read-only-recovery") {
      throw new FieldRepositoryError(
        "READ_ONLY_RECOVERY",
        `Local schema recovery is read-only after ${result.failedPhase}.`,
      );
    }
  }

  private async fault(boundary: FieldTransactionBoundary): Promise<void> {
    await this.transactionFault?.(boundary);
  }

  private async atomic<T>(tables: Table[], action: () => Promise<T>): Promise<T> {
    await this.requireReadWrite();
    try {
      return await this.database.transaction("rw", tables, action);
    } catch (error) {
      if (error instanceof FieldRepositoryError) throw error;
      throw new FieldAtomicWriteError("The local entity and outbox transaction was aborted.", error);
    }
  }

  private validateCheckout(input: FieldCheckoutInput): void {
    const { inspectionPackage, offlineGrant } = input;
    const now = this.now().getTime();
    const issuedAt = parseInstant(offlineGrant.issuedAt);
    const grantExpiresAt = parseInstant(offlineGrant.expiresAt);
    const packageExpiresAt = parseInstant(inspectionPackage.expiresAt);
    if (!isFieldSchemaNOrNMinusOne(
      inspectionPackage.schemaVersion,
      CURRENT_FIELD_PACKAGE_SCHEMA_VERSION,
    )) {
      throw new FieldPackageUnavailableError(
        "PACKAGE_SCHEMA_INCOMPATIBLE",
        "The inspection package schema is outside the positive N/N-1 window.",
      );
    }
    if (
      inspectionPackage.protocolVersion !== CURRENT_FIELD_PROTOCOL_VERSION ||
      offlineGrant.protocolVersion !== CURRENT_FIELD_PROTOCOL_VERSION
    ) {
      throw new FieldPackageUnavailableError(
        "PROTOCOL_VERSION_INCOMPATIBLE",
        "The offline protocol version is incompatible.",
      );
    }
    if (
      offlineGrant.subjectId !== this.subjectId ||
      offlineGrant.organizationId !== inspectionPackage.organizationId ||
      offlineGrant.packageId !== inspectionPackage.id ||
      offlineGrant.packageVersion !== inspectionPackage.packageVersion ||
      offlineGrant.packageDigest !== inspectionPackage.packageDigest ||
      offlineGrant.deviceInstanceId.trim() === "" ||
      offlineGrant.assignmentScope.questionIds.length === 0
    ) {
      throw new FieldPackageUnavailableError(
        "OFFLINE_GRANT_SCOPE_INVALID",
        "The server-issued grant does not exactly match this subject and package.",
      );
    }
    const questions = new Map(inspectionPackage.questions.map((question) => [question.id, question]));
    if (
      offlineGrant.assignmentScope.questionIds.some((questionId) => {
        const question = questions.get(questionId);
        return !question || !question.assignedInspectorUserIds.includes(this.subjectId);
      })
    ) {
      throw new FieldPackageUnavailableError(
        "OFFLINE_GRANT_ASSIGNMENT_INVALID",
        "The grant assignment is not present in the immutable package.",
      );
    }
    if (
      issuedAt === null ||
      grantExpiresAt === null ||
      packageExpiresAt === null ||
      issuedAt > now + CLOCK_SKEW_MS ||
      grantExpiresAt <= now ||
      packageExpiresAt <= now
    ) {
      throw new FieldPackageUnavailableError(
        "OFFLINE_GRANT_EXPIRED",
        "The package or server-issued offline grant is not currently valid.",
      );
    }
  }

  async checkoutPackage(input: FieldCheckoutInput): Promise<void> {
    this.validateCheckout(input);
    const inspectionPackage = clone(input.inspectionPackage);
    const offlineGrant = clone(input.offlineGrant);
    const storageDigest = await sha256Canonical(inspectionPackage);
    await this.atomic(
      [
        this.database.packages,
        this.database.offlineGrants,
        this.database.checklistResponses,
        this.database.outbox,
        this.database.syncState,
      ],
      async () => {
        const key: [string, string] = [this.subjectId, inspectionPackage.id];
        const existing = await this.database.packages.get(key);
        if (
          existing &&
          (existing.packageVersion !== inspectionPackage.packageVersion ||
            existing.packageDigest !== inspectionPackage.packageDigest)
        ) {
          const active = await this.activePackageOutbox(inspectionPackage.id);
          if (active.length > 0) {
            throw new FieldRepositoryError(
              "PACKAGE_REPLACEMENT_REQUIRES_SYNC",
              "A changed package cannot replace pending local work.",
            );
          }
        }
        await this.database.packages.put({
          id: inspectionPackage.id,
          subjectId: this.subjectId,
          auditId: inspectionPackage.auditId,
          organizationId: inspectionPackage.organizationId,
          packageVersion: inspectionPackage.packageVersion,
          schemaVersion: inspectionPackage.schemaVersion,
          protocolVersion: inspectionPackage.protocolVersion,
          packageDigest: inspectionPackage.packageDigest,
          storageDigest,
          checkedOutAt: input.checkedOutAt,
          expiresAt: inspectionPackage.expiresAt,
          grantId: offlineGrant.grantId,
          accessState: "AVAILABLE",
          unavailableReason: null,
          localChecklistStatus: existing?.localChecklistStatus ?? inspectionPackage.checklistStatus,
          localChecklistRevision:
            existing?.localChecklistRevision ?? inspectionPackage.checklistRevision,
          pendingSubmissionOperationId: existing?.pendingSubmissionOperationId ?? null,
          inspectionPackage,
        });
        await this.database.offlineGrants.put({
          grantId: offlineGrant.grantId,
          subjectId: this.subjectId,
          organizationId: offlineGrant.organizationId,
          packageId: offlineGrant.packageId,
          packageVersion: offlineGrant.packageVersion,
          packageDigest: offlineGrant.packageDigest,
          deviceInstanceId: offlineGrant.deviceInstanceId,
          issuedAt: offlineGrant.issuedAt,
          expiresAt: offlineGrant.expiresAt,
          protocolVersion: offlineGrant.protocolVersion,
          offlineGrant,
        });
        for (const question of inspectionPackage.questions) {
          if (!question.currentResponse) continue;
          const responseKey: [string, string] = [this.subjectId, question.currentResponse.id];
          if (await this.database.checklistResponses.get(responseKey)) continue;
          await this.database.checklistResponses.put({
            ...clone(question.currentResponse),
            subjectId: this.subjectId,
            packageId: inspectionPackage.id,
            auditId: inspectionPackage.auditId,
            questionId: question.id,
            syncState: "ACKNOWLEDGED",
            operationId: null,
            tombstoned: false,
          });
        }
        const existingSync = await this.database.syncState.get(key);
        await this.database.syncState.put({
          subjectId: this.subjectId,
          packageId: inspectionPackage.id,
          grantId: offlineGrant.grantId,
          projectionVersion: existingSync?.projectionVersion ?? 0,
          cursor: existingSync?.cursor ?? null,
          lastSuccessAt: existingSync?.lastSuccessAt ?? null,
          lastErrorCode: null,
        });
      },
    );
  }

  async resumePackageWithServerCheckout(input: FieldCheckoutInput): Promise<void> {
    return this.checkoutPackage(input);
  }

  private async quarantine(packageId: string, reason: string): Promise<never> {
    await this.database.packages.update([this.subjectId, packageId], {
      accessState: "QUARANTINED",
      unavailableReason: reason,
    });
    throw new FieldPackageUnavailableError(reason, "The local package is preserved in quarantine.");
  }

  private async lockUnavailable(packageId: string, reason: string): Promise<never> {
    await this.database.packages.update([this.subjectId, packageId], {
      accessState: "LOCKED",
      unavailableReason: reason,
    });
    throw new FieldPackageUnavailableError(reason, "The local package is locked and preserved.");
  }

  private accessError(row: PackageRow): never {
    const code = row.unavailableReason ?? (row.accessState === "LOCKED" ? "PACKAGE_LOCKED" : "PACKAGE_QUARANTINED");
    throw new FieldPackageUnavailableError(code, "The local package is unavailable but preserved.");
  }

  private async validateStoredPackage(row: PackageRow): Promise<void> {
    if (row.accessState !== "AVAILABLE") this.accessError(row);
    const now = this.now().getTime();
    const packageExpiry = parseInstant(row.expiresAt);
    const grant = await this.database.offlineGrants.get([this.subjectId, row.grantId]);
    if (!grant) return this.quarantine(row.id, "OFFLINE_GRANT_MISSING");
    const grantIssuedAt = parseInstant(grant.issuedAt);
    const grantExpiry = parseInstant(grant.expiresAt);
    if (
      packageExpiry === null ||
      grantIssuedAt === null ||
      grantExpiry === null ||
      grantIssuedAt > now + CLOCK_SKEW_MS ||
      packageExpiry <= now ||
      grantExpiry <= now
    ) {
      await this.lockUnavailable(row.id, "OFFLINE_GRANT_EXPIRED");
    }
    if (
      !isFieldSchemaNOrNMinusOne(row.schemaVersion, CURRENT_FIELD_PACKAGE_SCHEMA_VERSION) ||
      row.protocolVersion !== CURRENT_FIELD_PROTOCOL_VERSION ||
      grant.protocolVersion !== CURRENT_FIELD_PROTOCOL_VERSION
    ) {
      await this.quarantine(row.id, "PACKAGE_SCHEMA_INCOMPATIBLE");
    }
    if (
      grant.subjectId !== this.subjectId ||
      grant.organizationId !== row.organizationId ||
      grant.packageId !== row.id ||
      grant.packageVersion !== row.packageVersion ||
      grant.packageDigest !== row.packageDigest ||
      grant.deviceInstanceId.trim() === "" ||
      grant.offlineGrant.grantId !== grant.grantId ||
      grant.offlineGrant.subjectId !== grant.subjectId ||
      grant.offlineGrant.organizationId !== grant.organizationId ||
      grant.offlineGrant.packageId !== grant.packageId ||
      grant.offlineGrant.packageVersion !== grant.packageVersion ||
      grant.offlineGrant.packageDigest !== grant.packageDigest ||
      grant.offlineGrant.deviceInstanceId !== grant.deviceInstanceId ||
      grant.offlineGrant.issuedAt !== grant.issuedAt ||
      grant.offlineGrant.expiresAt !== grant.expiresAt ||
      grant.offlineGrant.protocolVersion !== grant.protocolVersion ||
      row.inspectionPackage.id !== row.id ||
      row.inspectionPackage.auditId !== row.auditId ||
      row.inspectionPackage.organizationId !== row.organizationId ||
      row.inspectionPackage.packageDigest !== row.packageDigest
    ) {
      await this.quarantine(row.id, "PACKAGE_SCOPE_CORRUPTED");
    }
    const questions = new Map(
      row.inspectionPackage.questions.map((question) => [question.id, question]),
    );
    if (
      grant.offlineGrant.assignmentScope.questionIds.length === 0 ||
      grant.offlineGrant.assignmentScope.questionIds.some((questionId) => {
        const question = questions.get(questionId);
        return !question || !question.assignedInspectorUserIds.includes(this.subjectId);
      })
    ) {
      await this.quarantine(row.id, "PACKAGE_ASSIGNMENT_CORRUPTED");
    }
    if ((await sha256Canonical(row.inspectionPackage)) !== row.storageDigest) {
      await this.quarantine(row.id, "PACKAGE_CONTENT_CORRUPTED");
    }
  }

  private async assertPackageAvailable(packageId: string): Promise<void> {
    await this.requireReadWrite();
    const row = await this.database.packages.get([this.subjectId, packageId]);
    if (!row) {
      throw new FieldPackageUnavailableError("PACKAGE_NOT_CHECKED_OUT", "Offline package is absent.");
    }
    await this.validateStoredPackage(row);
  }

  async loadPackage(packageId: string): Promise<FieldPackageView | null> {
    await this.requireReadWrite();
    const row = await this.database.packages.get([this.subjectId, packageId]);
    if (!row) return null;
    await this.validateStoredPackage(row);
    const [responses, potentialFindingDrafts, outbox] = await Promise.all([
      this.database.checklistResponses
        .where("[subjectId+packageId]")
        .equals([this.subjectId, packageId])
        .toArray(),
      this.database.potentialFindingDrafts
        .where("[subjectId+packageId]")
        .equals([this.subjectId, packageId])
        .toArray(),
      this.activePackageOutbox(packageId),
    ]);
    const responseByQuestion = new Map(
      responses.filter((response) => !response.tombstoned).map((response) => [response.questionId, response]),
    );
    const inspectionPackage = clone(row.inspectionPackage);
    inspectionPackage.checklistStatus = row.localChecklistStatus;
    inspectionPackage.checklistRevision = row.localChecklistRevision;
    inspectionPackage.questions = inspectionPackage.questions.map((question) => {
      const local = responseByQuestion.get(question.id);
      return {
        ...question,
        currentResponse: local
          ? {
              id: local.id,
              questionId: local.questionId,
              answer: local.answer,
              comment: local.comment,
              revision: local.revision,
              updatedAt: local.updatedAt,
            }
          : question.currentResponse,
      };
    });
    return {
      inspectionPackage,
      accessState: row.accessState,
      responses: clone(responses),
      potentialFindingDrafts: clone(potentialFindingDrafts.filter((draft) => !draft.tombstoned)),
      pendingOperationCount: outbox.length,
    };
  }

  private async requirePackage(packageId: string): Promise<{ packageRow: PackageRow; grant: OfflineGrant }> {
    const packageRow = await this.database.packages.get([this.subjectId, packageId]);
    if (!packageRow) {
      throw new FieldPackageUnavailableError("PACKAGE_NOT_CHECKED_OUT", "Offline package is absent.");
    }
    if (packageRow.accessState !== "AVAILABLE") this.accessError(packageRow);
    const grantRow = await this.database.offlineGrants.get([this.subjectId, packageRow.grantId]);
    if (!grantRow) {
      throw new FieldPackageUnavailableError("OFFLINE_GRANT_MISSING", "Offline grant is absent.");
    }
    return { packageRow, grant: grantRow.offlineGrant };
  }

  private requireCommand(grant: OfflineGrant, commandType: FieldSyncOperation["commandType"]): void {
    if (!grant.allowedCommandTypes.includes(commandType)) {
      throw new FieldRepositoryError("COMMAND_NOT_GRANTED", "The offline grant excludes this command.");
    }
  }

  private operationBase(input: {
    operationId: string;
    packageRow: PackageRow;
    grant: OfflineGrant;
    entityId: string;
    baseRevision: number | null;
  }) {
    return {
      operationId: input.operationId,
      protocolVersion: input.packageRow.protocolVersion,
      offlineGrantId: input.grant.grantId,
      packageId: input.packageRow.id,
      packageVersion: input.packageRow.packageVersion,
      entityId: input.entityId,
      baseRevision: input.baseRevision,
      deviceInstanceId: input.grant.deviceInstanceId,
      clientOccurredAt: this.now().toISOString(),
    };
  }

  private async existingOperation(operationId: string): Promise<OutboxRow | undefined> {
    return this.database.outbox.get([this.subjectId, operationId]);
  }

  private async persistOutbox(input: Parameters<typeof createOutboxRow>[0]): Promise<void> {
    const row = await Dexie.waitFor(createOutboxRow(input));
    await this.database.outbox.put(row);
  }

  private assertOperationReplay(existing: OutboxRow, input: {
    commandType: FieldSyncOperation["commandType"];
    packageId: string;
    entityId: string;
    payload: unknown;
  }): void {
    if (
      existing.commandType !== input.commandType ||
      existing.packageId !== input.packageId ||
      existing.entityId !== input.entityId ||
      canonicalJson(existing.operation.payload) !== canonicalJson(input.payload)
    ) {
      throw new FieldRepositoryError(
        "OPERATION_ID_REUSED",
        "An operation ID cannot be reused with a different command or payload.",
      );
    }
  }

  private async entityOutbox(entityId: string): Promise<OutboxRow[]> {
    return this.database.outbox
      .where("[subjectId+entityId]")
      .equals([this.subjectId, entityId])
      .toArray();
  }

  private async activePackageOutbox(packageId: string): Promise<OutboxRow[]> {
    const rows = await this.database.outbox
      .where("[subjectId+packageId]")
      .equals([this.subjectId, packageId])
      .toArray();
    return rows.filter((row) => isCausalDependencyState(row.state));
  }

  async saveChecklistResponse(input: SaveLocalChecklistResponseInput): Promise<ChecklistResponseRow> {
    const normalizedComment = input.comment.trim();
    await this.assertPackageAvailable(input.packageId);
    return this.atomic(
      [
        this.database.packages,
        this.database.offlineGrants,
        this.database.checklistResponses,
        this.database.outbox,
      ],
      async () => {
        const { packageRow, grant } = await this.requirePackage(input.packageId);
        this.requireCommand(grant, "UPSERT_CHECKLIST_RESPONSE");
        if (packageRow.localChecklistStatus !== "IN_PROGRESS") {
          throw new FieldRepositoryError(
            "SUBMITTED_CHECKLIST_READ_ONLY",
            "A submitted checklist requires an online reasoned reopen.",
          );
        }
        const question = packageRow.inspectionPackage.questions.find(
          (candidate) => candidate.id === input.questionId,
        );
        if (!question) {
          throw new FieldRepositoryError("QUESTION_NOT_FOUND", "The exact package question is absent.");
        }
        if (
          !question.assignedInspectorUserIds.includes(this.subjectId) ||
          !grant.assignmentScope.questionIds.includes(question.id)
        ) {
          throw new FieldRepositoryError(
            "QUESTION_READ_ONLY",
            "Another Inspector's package question is read-only.",
          );
        }
        if (!question.allowedAnswers.includes(input.answer)) {
          throw new FieldRepositoryError("ANSWER_NOT_ALLOWED", "The immutable package excludes this answer.");
        }
        if (question.commentRequiredFor.includes(input.answer) && !normalizedComment) {
          throw new FieldRepositoryError("COMMENT_REQUIRED", "This answer requires an Inspector comment.");
        }
        const payload = {
          auditId: packageRow.auditId,
          questionId: question.id,
          answer: input.answer,
          comment: normalizedComment,
        };
        const duplicate = await this.existingOperation(input.operationId);
        if (duplicate) {
          this.assertOperationReplay(duplicate, {
            commandType: "UPSERT_CHECKLIST_RESPONSE",
            packageId: input.packageId,
            entityId: input.responseId,
            payload,
          });
          const existingResponse = await this.database.checklistResponses.get([
            this.subjectId,
            input.responseId,
          ]);
          if (!existingResponse) {
            throw new FieldRepositoryError("LOCAL_STATE_CORRUPTED", "The idempotent response is missing.");
          }
          return clone(existingResponse);
        }
        const existingResponse = await this.database.checklistResponses.get([
          this.subjectId,
          input.responseId,
        ]);
        if (existingResponse && existingResponse.questionId !== question.id) {
          throw new FieldRepositoryError(
            "RESPONSE_IDENTITY_CHANGED",
            "A response identity cannot move to another question.",
          );
        }
        const responseForQuestion = await this.database.checklistResponses
          .where("[subjectId+questionId]")
          .equals([this.subjectId, question.id])
          .filter((row) => row.packageId === packageRow.id && !row.tombstoned)
          .first();
        if (responseForQuestion && responseForQuestion.id !== input.responseId) {
          throw new FieldRepositoryError(
            "QUESTION_RESPONSE_IDENTITY_CHANGED",
            "A package question cannot acquire a second active response identity.",
          );
        }
        const activeEntityRows = (await this.entityOutbox(input.responseId)).filter(
          (row) => row.commandType === "UPSERT_CHECKLIST_RESPONSE" && !isTerminalOutboxState(row.state),
        );
        const inFlight = activeEntityRows.filter((row) => row.state === "IN_FLIGHT");
        for (const row of activeEntityRows.filter((candidate) => isUnsentOutboxState(candidate.state))) {
          row.state = "SUPERSEDED";
          row.supersededByOperationId = input.operationId;
          await this.database.outbox.put(row);
        }
        const authoritativeRevision = existingResponse?.revision ?? question.currentResponse?.revision ?? 0;
        const baseRevision = inFlight.length > 0 || authoritativeRevision === 0
          ? null
          : authoritativeRevision;
        const operation: FieldSyncOperation = {
          ...this.operationBase({
            operationId: input.operationId,
            packageRow,
            grant,
            entityId: input.responseId,
            baseRevision,
          }),
          commandType: "UPSERT_CHECKLIST_RESPONSE",
          payload,
        };
        const dependencies = inFlight.map((row) => row.operationId).sort();
        const response: ChecklistResponseRow = {
          id: input.responseId,
          subjectId: this.subjectId,
          packageId: packageRow.id,
          auditId: packageRow.auditId,
          questionId: question.id,
          answer: input.answer,
          comment: normalizedComment,
          revision: authoritativeRevision,
          syncState: "PENDING",
          updatedAt: operation.clientOccurredAt,
          operationId: operation.operationId,
          tombstoned: false,
        };
        await this.database.checklistResponses.put(response);
        await this.fault("after-checklist-response-write");
        await this.persistOutbox({
          subjectId: this.subjectId,
          operation,
          state: dependencies.length > 0 ? "BLOCKED_ON_DEPENDENCY" : "PENDING",
          createdAt: operation.clientOccurredAt,
          dependsOnOperationIds: dependencies,
        });
        return clone(response);
      },
    );
  }

  async createPotentialFindingDraft(
    input: CreateLocalPotentialFindingInput,
  ): Promise<PotentialFindingDraftRow> {
    const title = input.title.trim();
    const description = input.description.trim();
    const requiredComment = input.requiredComment.trim();
    await this.assertPackageAvailable(input.packageId);
    return this.atomic(
      [
        this.database.packages,
        this.database.offlineGrants,
        this.database.checklistResponses,
        this.database.potentialFindingDrafts,
        this.database.outbox,
      ],
      async () => {
        const { packageRow, grant } = await this.requirePackage(input.packageId);
        this.requireCommand(grant, "CREATE_POTENTIAL_FINDING");
        if (packageRow.localChecklistStatus !== "IN_PROGRESS") {
          throw new FieldRepositoryError(
            "SUBMITTED_CHECKLIST_READ_ONLY",
            "Potential Findings cannot be drafted after submission.",
          );
        }
        const question = packageRow.inspectionPackage.questions.find(
          (candidate) => candidate.id === input.questionId,
        );
        if (
          !question ||
          !question.assignedInspectorUserIds.includes(this.subjectId) ||
          !grant.assignmentScope.questionIds.includes(input.questionId)
        ) {
          throw new FieldRepositoryError(
            "QUESTION_READ_ONLY",
            "Potential Finding authority requires the assigned Inspector.",
          );
        }
        const response = await this.database.checklistResponses.get([
          this.subjectId,
          input.checklistResponseId,
        ]);
        if (!response || response.packageId !== packageRow.id || response.questionId !== question.id) {
          throw new FieldRepositoryError(
            "CHECKLIST_RESPONSE_REQUIRED",
            "The exact local checklist response is required.",
          );
        }
        if (response.answer !== "NON_COMPLIANT" && response.answer !== "OBSERVATION") {
          throw new FieldRepositoryError(
            "POTENTIAL_FINDING_ANSWER_INVALID",
            "Only Non-Compliant or Observation may create a Potential Finding.",
          );
        }
        if (!title || !description || !requiredComment) {
          throw new FieldRepositoryError(
            "POTENTIAL_FINDING_FIELDS_REQUIRED",
            "Title, description, and required Inspector comment are mandatory.",
          );
        }
        const payload = {
          auditId: packageRow.auditId,
          questionId: question.id,
          checklistResponseId: response.id,
          expectedChecklistResponseRevision: response.revision || null,
          title,
          description,
          requiredComment,
          inspectionAttachmentIds: [...input.inspectionAttachmentIds],
        };
        const duplicate = await this.existingOperation(input.operationId);
        if (duplicate) {
          this.assertOperationReplay(duplicate, {
            commandType: "CREATE_POTENTIAL_FINDING",
            packageId: packageRow.id,
            entityId: input.localId,
            payload,
          });
          const existingDraft = await this.database.potentialFindingDrafts.get([
            this.subjectId,
            input.localId,
          ]);
          if (!existingDraft) {
            throw new FieldRepositoryError("LOCAL_STATE_CORRUPTED", "The idempotent draft is missing.");
          }
          return clone(existingDraft);
        }
        const activeDrafts = await this.database.potentialFindingDrafts
          .where("[subjectId+questionId]")
          .equals([this.subjectId, question.id])
          .filter(
            (draft) =>
              draft.packageId === packageRow.id &&
              !draft.tombstoned &&
              draft.syncState !== "REJECTED",
          )
          .toArray();
        if (activeDrafts.length > 0) {
          throw new FieldRepositoryError(
            "POTENTIAL_FINDING_ALREADY_EXISTS",
            "An active Potential Finding already exists for this response.",
          );
        }
        const dependencies = (await this.entityOutbox(response.id))
          .filter((row) => isCausalDependencyState(row.state))
          .map((row) => row.operationId)
          .sort();
        const operation: FieldSyncOperation = {
          ...this.operationBase({
            operationId: input.operationId,
            packageRow,
            grant,
            entityId: input.localId,
            baseRevision: null,
          }),
          commandType: "CREATE_POTENTIAL_FINDING",
          payload,
        };
        const draft: PotentialFindingDraftRow = {
          id: input.localId,
          subjectId: this.subjectId,
          packageId: packageRow.id,
          auditId: packageRow.auditId,
          questionId: question.id,
          checklistResponseId: response.id,
          organizationId: packageRow.organizationId,
          title,
          description,
          requiredComment,
          inspectionAttachmentIds: [...input.inspectionAttachmentIds],
          baseRevision: payload.expectedChecklistResponseRevision,
          status: "PENDING_LEAD_REVIEW",
          syncState: "PENDING",
          updatedAt: operation.clientOccurredAt,
          operationId: operation.operationId,
          authoritativeEntityId: null,
          tombstoned: false,
        };
        await this.database.potentialFindingDrafts.put(draft);
        await this.fault("after-potential-finding-write");
        await this.persistOutbox({
          subjectId: this.subjectId,
          operation,
          state: dependencies.length > 0 ? "BLOCKED_ON_DEPENDENCY" : "PENDING",
          createdAt: operation.clientOccurredAt,
          dependsOnOperationIds: dependencies,
        });
        return clone(draft);
      },
    );
  }

  async submitChecklist(input: SubmitLocalChecklistInput): Promise<FieldChecklistSubmission> {
    await this.assertPackageAvailable(input.packageId);
    return this.atomic(
      [
        this.database.packages,
        this.database.offlineGrants,
        this.database.checklistResponses,
        this.database.outbox,
      ],
      async () => {
        const { packageRow, grant } = await this.requirePackage(input.packageId);
        this.requireCommand(grant, "SUBMIT_CHECKLIST");
        const payload = { auditId: packageRow.auditId };
        const duplicate = await this.existingOperation(input.operationId);
        if (duplicate) {
          this.assertOperationReplay(duplicate, {
            commandType: "SUBMIT_CHECKLIST",
            packageId: packageRow.id,
            entityId: packageRow.auditId,
            payload,
          });
          return {
            auditId: packageRow.auditId,
            checklistStatus: "SUBMITTED",
            checklistRevision: packageRow.localChecklistRevision,
            syncState: "PENDING",
            operationId: input.operationId,
          };
        }
        if (packageRow.localChecklistStatus !== "IN_PROGRESS") {
          throw new FieldRepositoryError(
            "SUBMITTED_CHECKLIST_READ_ONLY",
            "Only an in-progress checklist can be submitted offline.",
          );
        }
        const assigned = packageRow.inspectionPackage.questions.some((question) =>
          question.assignedInspectorUserIds.includes(this.subjectId),
        );
        const responses = await this.database.checklistResponses
          .where("[subjectId+packageId]")
          .equals([this.subjectId, packageRow.id])
          .toArray();
        if (!assigned || responses.length === 0) {
          throw new FieldRepositoryError(
            "CHECKLIST_RESPONSE_REQUIRED",
            "An assigned Inspector response is required before submission.",
          );
        }
        const dependencies = (await this.activePackageOutbox(packageRow.id))
          .map((row) => row.operationId)
          .sort();
        const operation: FieldSyncOperation = {
          ...this.operationBase({
            operationId: input.operationId,
            packageRow,
            grant,
            entityId: packageRow.auditId,
            baseRevision: packageRow.localChecklistRevision,
          }),
          commandType: "SUBMIT_CHECKLIST",
          payload,
        };
        packageRow.localChecklistStatus = "SUBMITTED";
        packageRow.pendingSubmissionOperationId = input.operationId;
        await this.database.packages.put(packageRow);
        await this.fault("after-checklist-submission-write");
        await this.persistOutbox({
          subjectId: this.subjectId,
          operation,
          state: dependencies.length > 0 ? "BLOCKED_ON_DEPENDENCY" : "PENDING",
          createdAt: operation.clientOccurredAt,
          dependsOnOperationIds: dependencies,
        });
        return {
          auditId: packageRow.auditId,
          checklistStatus: "SUBMITTED",
          checklistRevision: packageRow.localChecklistRevision,
          syncState: "PENDING",
          operationId: input.operationId,
        };
      },
    );
  }

  async markOperationInFlight(operationId: string): Promise<OutboxRow> {
    return this.atomic([this.database.outbox], async () => {
      const row = await this.database.outbox.get([this.subjectId, operationId]);
      if (!row) throw new FieldRepositoryError("OPERATION_NOT_FOUND", "Outbox operation is absent.");
      if (row.state !== "PENDING") {
        throw new FieldRepositoryError(
          "OPERATION_NOT_DELIVERABLE",
          "Only a dependency-free pending operation may enter flight.",
        );
      }
      row.state = "IN_FLIGHT";
      row.attemptCount += 1;
      await this.database.outbox.put(row);
      return clone(row);
    });
  }

  async listOutbox(
    packageId: string,
    options: { includeTerminal?: boolean } = {},
  ): Promise<OutboxRow[]> {
    await this.requireReadWrite();
    const rows = await this.database.outbox
      .where("[subjectId+packageId]")
      .equals([this.subjectId, packageId])
      .toArray();
    return sortByKey(
      clone(options.includeTerminal ? rows : rows.filter((row) => !isTerminalOutboxState(row.state))),
      (row) => `${row.createdAt}:${row.operationId}`,
    );
  }

  async listDeliverableOperations(packageId: string): Promise<OutboxRow[]> {
    return (await this.listOutbox(packageId)).filter((row) => row.state === "PENDING");
  }

  async getChecklistResponse(
    packageId: string,
    responseId: string,
  ): Promise<ChecklistResponseRow | null> {
    await this.requireReadWrite();
    const row = await this.database.checklistResponses.get([this.subjectId, responseId]);
    return row?.packageId === packageId ? clone(row) : null;
  }

  async getSyncState(packageId: string): Promise<SyncStateRow | null> {
    await this.requireReadWrite();
    return clone((await this.database.syncState.get([this.subjectId, packageId])) ?? null);
  }

  private async applyAuthorizedChange(packageRow: PackageRow, change: AuthorizedSyncChange): Promise<void> {
    if (change.kind === "checklist_response") {
      const question = packageRow.inspectionPackage.questions.find(
        (candidate) => candidate.id === change.value.questionId,
      );
      if (!question) {
        throw new FieldRepositoryError(
          "PULL_CHANGE_OUT_OF_SCOPE",
          "A pulled checklist response is outside the exact package.",
        );
      }
      const existing = await this.database.checklistResponses
        .where("[subjectId+questionId]")
        .equals([this.subjectId, question.id])
        .filter((row) => row.packageId === packageRow.id && !row.tombstoned)
        .first();
      const hasLocalWork = existing?.operationId
        ? (await this.existingOperation(existing.operationId))?.state !== "ACKNOWLEDGED"
        : false;
      await this.database.checklistResponses.put({
        ...(hasLocalWork && existing ? existing : clone(change.value)),
        id: existing?.id ?? change.value.id,
        subjectId: this.subjectId,
        packageId: packageRow.id,
        auditId: packageRow.auditId,
        questionId: question.id,
        revision: change.value.revision,
        syncState: hasLocalWork ? "PENDING" : "ACKNOWLEDGED",
        updatedAt: hasLocalWork && existing ? existing.updatedAt : change.value.updatedAt,
        operationId: hasLocalWork && existing ? existing.operationId : null,
        tombstoned: false,
      });
      return;
    }
    if (change.kind === "potential_finding") {
      if (change.value.auditId !== packageRow.auditId) {
        throw new FieldRepositoryError(
          "PULL_CHANGE_OUT_OF_SCOPE",
          "A pulled Potential Finding is outside the exact Audit.",
        );
      }
      const existing = await this.database.potentialFindingDrafts
        .filter(
          (row) =>
            row.subjectId === this.subjectId &&
            row.packageId === packageRow.id &&
            (row.id === change.value.id || row.authoritativeEntityId === change.value.id),
        )
        .first();
      await this.database.potentialFindingDrafts.put({
        id: existing?.id ?? change.value.id,
        subjectId: this.subjectId,
        packageId: packageRow.id,
        auditId: packageRow.auditId,
        questionId: change.value.questionId,
        checklistResponseId: existing?.checklistResponseId ?? "",
        organizationId: packageRow.organizationId,
        title: change.value.title,
        description: change.value.description,
        requiredComment: existing?.requiredComment ?? "",
        inspectionAttachmentIds: existing?.inspectionAttachmentIds ?? [],
        baseRevision: change.value.revision,
        status: change.value.status,
        syncState: existing?.syncState === "PENDING" ? "PENDING" : "ACKNOWLEDGED",
        updatedAt: existing?.updatedAt ?? this.now().toISOString(),
        operationId: existing?.syncState === "PENDING" ? existing.operationId : null,
        authoritativeEntityId: change.value.id,
        tombstoned: false,
      });
      return;
    }
    if (change.kind === "package_revoked") {
      if (change.packageId !== packageRow.id) {
        throw new FieldRepositoryError("PULL_CHANGE_OUT_OF_SCOPE", "Package revocation is out of scope.");
      }
      packageRow.accessState = "QUARANTINED";
      packageRow.unavailableReason = "PACKAGE_REVOKED";
      await this.database.packages.put(packageRow);
      return;
    }
    if (change.entityType === "checklist_response") {
      const response = await this.database.checklistResponses.get([
        this.subjectId,
        change.entityId,
      ]);
      if (response?.packageId === packageRow.id) {
        response.tombstoned = true;
        response.syncState = response.operationId ? "PENDING" : "TOMBSTONED";
        response.revision = Math.max(response.revision, change.revision);
        await this.database.checklistResponses.put(response);
      }
      return;
    }
    const draft = await this.database.potentialFindingDrafts.get([
      this.subjectId,
      change.entityId,
    ]);
    if (draft?.packageId === packageRow.id) {
      draft.tombstoned = true;
      draft.syncState = draft.operationId ? "PENDING" : "TOMBSTONED";
      draft.baseRevision = Math.max(draft.baseRevision ?? 0, change.revision);
      await this.database.potentialFindingDrafts.put(draft);
    }
  }

  async applyPullPage(input: ApplyFieldPullPageInput): Promise<void> {
    await this.assertPackageAvailable(input.packageId);
    await this.atomic(
      [
        this.database.packages,
        this.database.offlineGrants,
        this.database.checklistResponses,
        this.database.potentialFindingDrafts,
        this.database.outbox,
        this.database.syncState,
      ],
      async () => {
        const { packageRow } = await this.requirePackage(input.packageId);
        if (packageRow.grantId !== input.grantId) {
          throw new FieldRepositoryError("PULL_GRANT_SCOPE_MISMATCH", "Pull grant is not current.");
        }
        const state = await this.database.syncState.get([this.subjectId, input.packageId]);
        if (!state || state.grantId !== input.grantId || state.cursor !== input.expectedCursor) {
          throw new FieldRepositoryError("PULL_CURSOR_SCOPE_MISMATCH", "Pull cursor is not current.");
        }
        for (const change of input.page.changes) {
          await this.applyAuthorizedChange(packageRow, change);
        }
        await this.fault("before-pull-cursor-write");
        await this.database.syncState.put({
          ...state,
          projectionVersion: input.page.projectionVersion,
          cursor: input.page.nextCursor,
          lastSuccessAt: this.now().toISOString(),
          lastErrorCode: input.page.resnapshotRequired ? "RESNAPSHOT_REQUIRED" : null,
        });
      },
    );
  }

  async lockSubject(reason: "LOGOUT" | "USER_SWITCH" | string): Promise<void> {
    await this.atomic([this.database.packages], async () => {
      const rows = await this.database.packages.where("subjectId").equals(this.subjectId).toArray();
      for (const row of rows) {
        row.accessState = "LOCKED";
        row.unavailableReason = reason === "LOGOUT" || reason === "USER_SWITCH"
          ? "PACKAGE_LOCKED"
          : reason;
        await this.database.packages.put(row);
      }
    });
  }

  async exportSubjectSnapshot(
    options: { includeLocked?: boolean } = {},
  ): Promise<FieldSubjectSnapshot> {
    await this.requireReadWrite();
    const [packages, checklistResponses, potentialFindingDrafts, outbox, syncState] =
      await Promise.all([
        this.database.packages.where("subjectId").equals(this.subjectId).toArray(),
        this.database.checklistResponses.where("subjectId").equals(this.subjectId).toArray(),
        this.database.potentialFindingDrafts.where("subjectId").equals(this.subjectId).toArray(),
        this.database.outbox.where("subjectId").equals(this.subjectId).toArray(),
        this.database.syncState.where("subjectId").equals(this.subjectId).toArray(),
      ]);
    return {
      packages: sortByKey(
        clone(options.includeLocked ? packages : packages.filter((row) => row.accessState === "AVAILABLE")),
        (row) => row.id,
      ),
      checklistResponses: sortByKey(clone(checklistResponses), (row) => row.id),
      potentialFindingDrafts: sortByKey(clone(potentialFindingDrafts), (row) => row.id),
      outbox: sortByKey(clone(outbox), (row) => row.operationId),
      syncState: sortByKey(clone(syncState), (row) => row.packageId),
    };
  }
}

export function createBrowserFieldRepository(
  subjectId: string,
  now?: () => Date,
): IndexedDbFieldRepository {
  return new IndexedDbFieldRepository({ subjectId, now });
}

export async function outboxPayloadIsImmutable(
  before: OutboxRow,
  after: OutboxRow,
): Promise<boolean> {
  return (
    before.requestDigest === after.requestDigest &&
    before.requestDigest === (await fieldOperationRequestDigest(before.operation)) &&
    canonicalJson(before.operation) === canonicalJson(after.operation)
  );
}

export function toChecklistResponseView(row: ChecklistResponseRow): ChecklistResponseView {
  return {
    id: row.id,
    questionId: row.questionId,
    answer: row.answer,
    comment: row.comment,
    revision: row.revision,
    updatedAt: row.updatedAt,
  };
}
