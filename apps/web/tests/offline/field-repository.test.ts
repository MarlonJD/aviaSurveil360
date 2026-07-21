import "fake-indexeddb/auto";

import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";

import type {
  InspectionPackage,
  OfflineGrant,
  SyncPullResponse,
} from "../../src/backend/backend";
import {
  OfflineFieldDatabase,
  type FieldMigrationPhase,
} from "../../src/offline/db";
import {
  FieldAtomicWriteError,
  FieldPackageUnavailableError,
  IndexedDbFieldRepository,
  type FieldTransactionBoundary,
} from "../../src/offline/field-repository";
import { isFieldSchemaNOrNMinusOne } from "../../src/offline/schema-migrations";

const subjectId = "USR-INSPECTOR-AMINA";
const otherSubjectId = "USR-INSPECTOR-DAVID";
const packageId = "PKG-CAB-2026-001";
const now = new Date("2026-07-21T08:00:00.000Z");
const databaseNames = new Set<string>();

function packageFixture(overrides: Partial<InspectionPackage> = {}): InspectionPackage {
  return {
    id: packageId,
    auditId: "AUD-2026-001",
    organizationId: "ORG-FLY-NAMIBIA",
    organizationName: "Fly Namibia",
    title: "2026 Cabin Inspection - Fly Namibia",
    packageVersion: 1,
    schemaVersion: 1,
    protocolVersion: 1,
    templateVersionId: "TPL-CAB-001-V1",
    packageDigest: "sha256:candidate-cabin-package-v1",
    expiresAt: "2026-07-24T08:00:00.000Z",
    checklistStatus: "IN_PROGRESS",
    checklistRevision: 3,
    questions: [
      {
        id: "CAB-EMEQ-PBE-001",
        sectionId: "Emergency equipment",
        prompt: "Protective breathing equipment serviceable and accessible?",
        regulatoryReference: "Configured cabin reference",
        expectedEvidence: "Serviceability record",
        allowedAnswers: ["COMPLIANT", "NON_COMPLIANT", "OBSERVATION", "NOT_CHECKED"],
        commentRequiredFor: ["NON_COMPLIANT", "OBSERVATION"],
        assignedInspectorUserIds: [subjectId],
        currentResponse: null,
      },
      {
        id: "CAB-OTHER-001",
        sectionId: "Cabin records",
        prompt: "Crew training records complete?",
        regulatoryReference: null,
        expectedEvidence: null,
        allowedAnswers: ["COMPLIANT", "NON_COMPLIANT", "NOT_CHECKED"],
        commentRequiredFor: ["NON_COMPLIANT"],
        assignedInspectorUserIds: [otherSubjectId],
        currentResponse: null,
      },
    ],
    ...overrides,
  };
}

function grantFixture(
  inspectionPackage = packageFixture(),
  overrides: Partial<OfflineGrant> = {},
): OfflineGrant {
  return {
    grantId: `GRANT-${overrides.subjectId ?? subjectId}`,
    subjectId,
    organizationId: inspectionPackage.organizationId,
    packageId: inspectionPackage.id,
    packageVersion: inspectionPackage.packageVersion,
    packageDigest: inspectionPackage.packageDigest,
    allowedCommandTypes: [
      "UPSERT_CHECKLIST_RESPONSE",
      "CREATE_POTENTIAL_FINDING",
      "SUBMIT_CHECKLIST",
      "REGISTER_INSPECTION_ATTACHMENT",
    ],
    assignmentScope: { questionIds: ["CAB-EMEQ-PBE-001"] },
    deviceInstanceId: "DEVICE-CANDIDATE-001",
    issuedAt: "2026-07-21T07:59:00.000Z",
    expiresAt: "2026-07-22T08:00:00.000Z",
    protocolVersion: inspectionPackage.protocolVersion,
    ...overrides,
  };
}

function createDatabase(
  migrationFault?: (phase: FieldMigrationPhase) => void,
): OfflineFieldDatabase {
  const name = `aviasurveil360-field-test-${crypto.randomUUID()}`;
  databaseNames.add(name);
  return new OfflineFieldDatabase({ name, migrationFault });
}

function createRepository(input: {
  database?: OfflineFieldDatabase;
  activeSubjectId?: string;
  fault?: (boundary: FieldTransactionBoundary) => void;
} = {}) {
  const database = input.database ?? createDatabase();
  return {
    database,
    repository: new IndexedDbFieldRepository({
      database,
      subjectId: input.activeSubjectId ?? subjectId,
      now: () => now,
      transactionFault: input.fault,
    }),
  };
}

async function checkout(repository: IndexedDbFieldRepository, inspectionPackage = packageFixture()) {
  await repository.checkoutPackage({
    inspectionPackage,
    offlineGrant: grantFixture(inspectionPackage),
    checkedOutAt: "2026-07-21T08:00:00.000Z",
  });
}

afterEach(async () => {
  await Promise.all([...databaseNames].map((name) => Dexie.delete(name)));
  databaseNames.clear();
});

describe("IndexedDbFieldRepository atomic writes", () => {
  it("commits a checklist response and typed outbox operation together", async () => {
    const { repository } = createRepository();
    await checkout(repository);

    const saved = await repository.saveChecklistResponse({
      operationId: "OP-RESPONSE-001",
      packageId,
      responseId: "RESP-CAB-EMEQ-PBE-001",
      questionId: "CAB-EMEQ-PBE-001",
      answer: "NOT_CHECKED",
      comment: "",
    });

    expect(saved).toMatchObject({
      answer: "NOT_CHECKED",
      syncState: "PENDING",
      operationId: "OP-RESPONSE-001",
    });
    expect(await repository.listOutbox(packageId)).toEqual([
      expect.objectContaining({
        operationId: "OP-RESPONSE-001",
        commandType: "UPSERT_CHECKLIST_RESPONSE",
        state: "PENDING",
        operation: expect.objectContaining({
          offlineGrantId: `GRANT-${subjectId}`,
          deviceInstanceId: "DEVICE-CANDIDATE-001",
          baseRevision: null,
          payload: expect.objectContaining({ answer: "NOT_CHECKED", comment: "" }),
        }),
      }),
    ]);
  });

  it.each([
    "after-checklist-response-write",
    "after-potential-finding-write",
    "after-checklist-submission-write",
  ] as const)("aborts entity and outbox together at %s", async (boundary) => {
    const database = createDatabase();
    const setup = createRepository({ database }).repository;
    await checkout(setup);
    await setup.saveChecklistResponse({
      operationId: "OP-BASE-RESPONSE",
      packageId,
      responseId: "RESP-CAB-EMEQ-PBE-001",
      questionId: "CAB-EMEQ-PBE-001",
      answer: "NON_COMPLIANT",
      comment: "PBE record unavailable.",
    });

    const failing = createRepository({
      database,
      fault: (candidate) => {
        if (candidate === boundary) throw new DOMException("quota exhausted", "QuotaExceededError");
      },
    }).repository;
    const before = await failing.exportSubjectSnapshot();

    const action =
      boundary === "after-checklist-response-write"
        ? failing.saveChecklistResponse({
            operationId: "OP-FAILED-RESPONSE",
            packageId,
            responseId: "RESP-CAB-EMEQ-PBE-001",
            questionId: "CAB-EMEQ-PBE-001",
            answer: "OBSERVATION",
            comment: "Observed during cabin check.",
          })
        : boundary === "after-potential-finding-write"
          ? failing.createPotentialFindingDraft({
              operationId: "OP-FAILED-PF",
              packageId,
              localId: "PF-LOCAL-FAILED",
              questionId: "CAB-EMEQ-PBE-001",
              checklistResponseId: "RESP-CAB-EMEQ-PBE-001",
              title: "PBE serviceability not confirmed",
              description: "Required serviceability record was unavailable.",
              requiredComment: "PBE record unavailable.",
              inspectionAttachmentIds: [],
            })
          : failing.submitChecklist({ operationId: "OP-FAILED-SUBMIT", packageId });

    await expect(action).rejects.toBeInstanceOf(FieldAtomicWriteError);
    expect(await failing.exportSubjectSnapshot()).toEqual(before);
  });

  it("deduplicates identical operation IDs and rejects different payload reuse", async () => {
    const { repository } = createRepository();
    await checkout(repository);
    const input = {
      operationId: "OP-DUPLICATE-001",
      packageId,
      responseId: "RESP-CAB-EMEQ-PBE-001",
      questionId: "CAB-EMEQ-PBE-001",
      answer: "COMPLIANT" as const,
      comment: "Checked.",
    };

    const first = await repository.saveChecklistResponse(input);
    const replay = await repository.saveChecklistResponse(input);
    expect(replay).toEqual(first);
    expect(await repository.listOutbox(packageId)).toHaveLength(1);

    await expect(
      repository.saveChecklistResponse({ ...input, answer: "NOT_CHECKED" }),
    ).rejects.toMatchObject({ code: "OPERATION_ID_REUSED" });
    expect(await repository.listOutbox(packageId)).toHaveLength(1);
  });

  it("coalesces an unsent edit but freezes an in-flight payload and blocks its later edit", async () => {
    const { repository } = createRepository();
    await checkout(repository);
    await repository.saveChecklistResponse({
      operationId: "OP-EDIT-001",
      packageId,
      responseId: "RESP-CAB-EMEQ-PBE-001",
      questionId: "CAB-EMEQ-PBE-001",
      answer: "NON_COMPLIANT",
      comment: "First local draft.",
    });
    await repository.saveChecklistResponse({
      operationId: "OP-EDIT-002",
      packageId,
      responseId: "RESP-CAB-EMEQ-PBE-001",
      questionId: "CAB-EMEQ-PBE-001",
      answer: "OBSERVATION",
      comment: "Replacement unsent draft.",
    });

    expect(await repository.listDeliverableOperations(packageId)).toEqual([
      expect.objectContaining({ operationId: "OP-EDIT-002", state: "PENDING" }),
    ]);
    expect(await repository.listOutbox(packageId, { includeTerminal: true })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ operationId: "OP-EDIT-001", state: "SUPERSEDED" }),
      ]),
    );

    await repository.markOperationInFlight("OP-EDIT-002");
    const frozen = (await repository.listOutbox(packageId, { includeTerminal: true })).find(
      (row) => row.operationId === "OP-EDIT-002",
    );
    await repository.saveChecklistResponse({
      operationId: "OP-EDIT-003",
      packageId,
      responseId: "RESP-CAB-EMEQ-PBE-001",
      questionId: "CAB-EMEQ-PBE-001",
      answer: "COMPLIANT",
      comment: "Later edit waits for the authoritative revision.",
    });

    const rows = await repository.listOutbox(packageId, { includeTerminal: true });
    expect(rows.find((row) => row.operationId === "OP-EDIT-002")).toEqual(frozen);
    expect(rows.find((row) => row.operationId === "OP-EDIT-003")).toMatchObject({
      state: "BLOCKED_ON_DEPENDENCY",
      baseRevision: null,
      dependsOnOperationIds: ["OP-EDIT-002"],
    });
  });

  it("creates Potential Finding and checklist-submit commands with causal dependencies", async () => {
    const { repository } = createRepository();
    await checkout(repository);
    await repository.saveChecklistResponse({
      operationId: "OP-RESPONSE-CAUSAL",
      packageId,
      responseId: "RESP-CAB-EMEQ-PBE-001",
      questionId: "CAB-EMEQ-PBE-001",
      answer: "NON_COMPLIANT",
      comment: "PBE record unavailable.",
    });
    const potential = await repository.createPotentialFindingDraft({
      operationId: "OP-PF-CAUSAL",
      packageId,
      localId: "PF-LOCAL-001",
      questionId: "CAB-EMEQ-PBE-001",
      checklistResponseId: "RESP-CAB-EMEQ-PBE-001",
      title: "PBE serviceability not confirmed",
      description: "Required serviceability record was unavailable.",
      requiredComment: "PBE record unavailable.",
      inspectionAttachmentIds: [],
    });
    const submission = await repository.submitChecklist({
      operationId: "OP-SUBMIT-CAUSAL",
      packageId,
    });

    expect(potential).toMatchObject({ syncState: "PENDING", operationId: "OP-PF-CAUSAL" });
    expect(submission).toMatchObject({ checklistStatus: "SUBMITTED", syncState: "PENDING" });
    const rows = await repository.listOutbox(packageId, { includeTerminal: true });
    expect(rows.find((row) => row.operationId === "OP-PF-CAUSAL")).toMatchObject({
      state: "BLOCKED_ON_DEPENDENCY",
      dependsOnOperationIds: ["OP-RESPONSE-CAUSAL"],
    });
    expect(rows.find((row) => row.operationId === "OP-SUBMIT-CAUSAL")).toMatchObject({
      state: "BLOCKED_ON_DEPENDENCY",
      dependsOnOperationIds: expect.arrayContaining(["OP-RESPONSE-CAUSAL", "OP-PF-CAUSAL"]),
    });
  });

  it("enforces immutable package assignment, allowed answers, and required comments locally", async () => {
    const { repository } = createRepository();
    await checkout(repository);

    await expect(
      repository.saveChecklistResponse({
        operationId: "OP-UNASSIGNED",
        packageId,
        responseId: "RESP-OTHER",
        questionId: "CAB-OTHER-001",
        answer: "COMPLIANT",
        comment: "",
      }),
    ).rejects.toMatchObject({ code: "QUESTION_READ_ONLY" });
    await expect(
      repository.saveChecklistResponse({
        operationId: "OP-COMMENT-REQUIRED",
        packageId,
        responseId: "RESP-CAB-EMEQ-PBE-001",
        questionId: "CAB-EMEQ-PBE-001",
        answer: "NON_COMPLIANT",
        comment: "   ",
      }),
    ).rejects.toMatchObject({ code: "COMMENT_REQUIRED" });
    await expect(
      repository.saveChecklistResponse({
        operationId: "OP-BAD-ANSWER",
        packageId,
        responseId: "RESP-CAB-EMEQ-PBE-001",
        questionId: "CAB-EMEQ-PBE-001",
        answer: "NOT_APPLICABLE",
        comment: "",
      }),
    ).rejects.toMatchObject({ code: "ANSWER_NOT_ALLOWED" });

    await expect(
      repository.saveChecklistResponse({
        operationId: "OP-NOT-CHECKED",
        packageId,
        responseId: "RESP-CAB-EMEQ-PBE-001",
        questionId: "CAB-EMEQ-PBE-001",
        answer: "NOT_CHECKED",
        comment: "",
      }),
    ).resolves.toMatchObject({ answer: "NOT_CHECKED" });
  });

  it("rejects local writes after grant expiry and preserves the locked working set", async () => {
    const database = createDatabase();
    const repository = createRepository({ database }).repository;
    await checkout(repository);
    const expired = repository.withClock(() => new Date("2026-07-22T08:00:00.000Z"));

    await expect(
      expired.saveChecklistResponse({
        operationId: "OP-EXPIRED-WRITE",
        packageId,
        responseId: "RESP-CAB-EMEQ-PBE-001",
        questionId: "CAB-EMEQ-PBE-001",
        answer: "NOT_CHECKED",
        comment: "",
      }),
    ).rejects.toMatchObject({ code: "OFFLINE_GRANT_EXPIRED" });
    expect(await expired.exportSubjectSnapshot({ includeLocked: true })).toMatchObject({
      packages: [expect.objectContaining({ accessState: "LOCKED" })],
      checklistResponses: [],
      outbox: [],
    });
  });

  it("keeps one active response identity per immutable package question", async () => {
    const { repository } = createRepository();
    await checkout(repository);
    await repository.saveChecklistResponse({
      operationId: "OP-RESPONSE-IDENTITY-001",
      packageId,
      responseId: "RESP-CAB-EMEQ-PBE-001",
      questionId: "CAB-EMEQ-PBE-001",
      answer: "NOT_CHECKED",
      comment: "",
    });

    await expect(
      repository.saveChecklistResponse({
        operationId: "OP-RESPONSE-IDENTITY-002",
        packageId,
        responseId: "RESP-CAB-EMEQ-PBE-SECOND",
        questionId: "CAB-EMEQ-PBE-001",
        answer: "COMPLIANT",
        comment: "Checked.",
      }),
    ).rejects.toMatchObject({ code: "QUESTION_RESPONSE_IDENTITY_CHANGED" });
  });
});

describe("subject scope, pull pages, restart, and quarantine", () => {
  it("never exposes or deletes another subject's package when switching or logging out", async () => {
    const database = createDatabase();
    const first = createRepository({ database }).repository;
    await checkout(first);
    await first.saveChecklistResponse({
      operationId: "OP-PRESERVE-001",
      packageId,
      responseId: "RESP-CAB-EMEQ-PBE-001",
      questionId: "CAB-EMEQ-PBE-001",
      answer: "NOT_CHECKED",
      comment: "",
    });
    const before = await first.exportSubjectSnapshot();
    await first.lockSubject("LOGOUT");

    const second = createRepository({ database, activeSubjectId: otherSubjectId }).repository;
    expect(await second.loadPackage(packageId)).toBeNull();
    expect(await second.listOutbox(packageId)).toEqual([]);
    await expect(first.loadPackage(packageId)).rejects.toMatchObject({ code: "PACKAGE_LOCKED" });
    expect(await first.exportSubjectSnapshot({ includeLocked: true })).toMatchObject({
      checklistResponses: before.checklistResponses,
      outbox: before.outbox,
    });
  });

  it("applies an authorized pull page and cursor atomically", async () => {
    const database = createDatabase();
    const repository = createRepository({ database }).repository;
    await checkout(repository);
    const pull: SyncPullResponse = {
      changes: [
        {
          kind: "checklist_response",
          value: {
            id: "RESP-SERVER-001",
            questionId: "CAB-EMEQ-PBE-001",
            answer: "COMPLIANT",
            comment: "Server acknowledged response.",
            revision: 4,
            updatedAt: "2026-07-21T08:01:00.000Z",
          },
        },
      ],
      nextCursor: "CURSOR-002",
      hasMore: false,
      resnapshotRequired: false,
      projectionVersion: 7,
    };

    await repository.applyPullPage({
      packageId,
      grantId: `GRANT-${subjectId}`,
      expectedCursor: null,
      page: pull,
    });
    expect(await repository.getChecklistResponse(packageId, "RESP-SERVER-001")).toMatchObject({
      answer: "COMPLIANT",
      revision: 4,
      syncState: "ACKNOWLEDGED",
    });
    expect(await repository.getSyncState(packageId)).toMatchObject({
      cursor: "CURSOR-002",
      projectionVersion: 7,
    });

    const failing = createRepository({
      database,
      fault: (boundary) => {
        if (boundary === "before-pull-cursor-write") throw new Error("termination");
      },
    }).repository;
    await expect(
      failing.applyPullPage({
        packageId,
        grantId: `GRANT-${subjectId}`,
        expectedCursor: "CURSOR-002",
        page: {
          ...pull,
          changes: [{ kind: "tombstone", entityType: "checklist_response", entityId: "RESP-SERVER-001", revision: 5 }],
          nextCursor: "CURSOR-003",
          projectionVersion: 8,
        },
      }),
    ).rejects.toBeInstanceOf(FieldAtomicWriteError);
    expect(await repository.getChecklistResponse(packageId, "RESP-SERVER-001")).toMatchObject({
      tombstoned: false,
      revision: 4,
    });
    expect(await repository.getSyncState(packageId)).toMatchObject({ cursor: "CURSOR-002" });
  });

  it("preserves pending and in-flight operations across repository restart", async () => {
    const database = createDatabase();
    const first = createRepository({ database }).repository;
    await checkout(first);
    await first.saveChecklistResponse({
      operationId: "OP-RESTART-IN-FLIGHT",
      packageId,
      responseId: "RESP-CAB-EMEQ-PBE-001",
      questionId: "CAB-EMEQ-PBE-001",
      answer: "NON_COMPLIANT",
      comment: "Frozen in-flight payload.",
    });
    await first.markOperationInFlight("OP-RESTART-IN-FLIGHT");
    await first.saveChecklistResponse({
      operationId: "OP-RESTART-PENDING",
      packageId,
      responseId: "RESP-CAB-EMEQ-PBE-001",
      questionId: "CAB-EMEQ-PBE-001",
      answer: "OBSERVATION",
      comment: "Pending after restart.",
    });
    database.close();

    const reopenedDatabase = new OfflineFieldDatabase({ name: database.name });
    const reopened = createRepository({ database: reopenedDatabase }).repository;
    const rows = await reopened.listOutbox(packageId, { includeTerminal: true });
    expect(rows.find((row) => row.operationId === "OP-RESTART-IN-FLIGHT")).toMatchObject({
      state: "IN_FLIGHT",
      operation: expect.objectContaining({ payload: expect.objectContaining({ answer: "NON_COMPLIANT" }) }),
    });
    expect(rows.find((row) => row.operationId === "OP-RESTART-PENDING")).toMatchObject({
      state: "BLOCKED_ON_DEPENDENCY",
      dependsOnOperationIds: ["OP-RESTART-IN-FLIGHT"],
    });
  });

  it("locks expired grants and quarantines revocation, corruption, and incompatible package state", async () => {
    const database = createDatabase();
    const repository = createRepository({ database }).repository;
    await checkout(repository);

    const expired = createRepository({ database }).repository.withClock(
      () => new Date("2026-07-22T08:00:00.000Z"),
    );
    await expect(expired.loadPackage(packageId)).rejects.toMatchObject({ code: "OFFLINE_GRANT_EXPIRED" });
    expect(await expired.exportSubjectSnapshot({ includeLocked: true })).toMatchObject({
      packages: [expect.objectContaining({ accessState: "LOCKED" })],
    });

    const recovered = repository.withClock(
      () => new Date("2026-07-22T08:00:01.000Z"),
    );
    await recovered.resumePackageWithServerCheckout({
      inspectionPackage: packageFixture(),
      offlineGrant: grantFixture(packageFixture(), {
        grantId: "GRANT-RECOVERY-001",
        issuedAt: "2026-07-22T08:00:00.000Z",
        expiresAt: "2026-07-23T08:00:00.000Z",
      }),
      checkedOutAt: "2026-07-22T08:00:00.000Z",
    });
    await recovered.applyPullPage({
      packageId,
      grantId: "GRANT-RECOVERY-001",
      expectedCursor: null,
      page: {
        changes: [{ kind: "package_revoked", packageId, reasonCode: "ASSIGNMENT_CHANGED", revokedAt: "2026-07-22T09:00:00.000Z" }],
        nextCursor: "CURSOR-REVOKED",
        hasMore: false,
        resnapshotRequired: false,
        projectionVersion: 8,
      },
    });
    await expect(recovered.loadPackage(packageId)).rejects.toMatchObject({ code: "PACKAGE_REVOKED" });

    const corruptDatabase = createDatabase();
    const corruptRepo = createRepository({ database: corruptDatabase }).repository;
    await checkout(corruptRepo);
    await corruptDatabase.packages.update([subjectId, packageId], {
      inspectionPackage: packageFixture({ title: "Tampered package" }),
    });
    await expect(corruptRepo.loadPackage(packageId)).rejects.toBeInstanceOf(FieldPackageUnavailableError);
    expect(await corruptRepo.exportSubjectSnapshot({ includeLocked: true })).toMatchObject({
      packages: [expect.objectContaining({ accessState: "QUARANTINED" })],
    });

    const incompatibleDatabase = createDatabase();
    const incompatibleRepo = createRepository({ database: incompatibleDatabase }).repository;
    const incompatiblePackage = packageFixture({ schemaVersion: 99 });
    await expect(
      incompatibleRepo.checkoutPackage({
        inspectionPackage: incompatiblePackage,
        offlineGrant: grantFixture(incompatiblePackage),
        checkedOutAt: now.toISOString(),
      }),
    ).rejects.toMatchObject({ code: "PACKAGE_SCHEMA_INCOMPATIBLE" });
  });
});

describe("released schema migration", () => {
  async function seedReleasedV1(name: string): Promise<void> {
    databaseNames.add(name);
    const snapshot = {
      subjectId,
      inspectionPackage: packageFixture(),
      offlineGrant: grantFixture(),
      checkedOutAt: now.toISOString(),
      versions: {
        appShellVersion: 1,
        indexedDbSchemaVersion: 1,
        packageSchemaVersion: 1,
        syncProtocolVersion: 1,
      },
    };
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(name, 1);
      request.onupgradeneeded = () => request.result.createObjectStore("foundation", { keyPath: "key" });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction("foundation", "readwrite");
        transaction.objectStore("foundation").put({
          key: `checkout:${subjectId}:${packageId}`,
          value: snapshot,
        });
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }

  it("upgrades the released Task 6 snapshot to the complete subject-scoped schema", async () => {
    const name = `aviasurveil360-field-migration-${crypto.randomUUID()}`;
    await seedReleasedV1(name);
    const database = new OfflineFieldDatabase({ name });
    const repository = createRepository({ database }).repository;

    await expect(repository.initialize()).resolves.toEqual({ mode: "read-write", version: 2 });
    expect(await repository.loadPackage(packageId)).toMatchObject({
      inspectionPackage: expect.objectContaining({ id: packageId }),
      accessState: "AVAILABLE",
    });
    expect(await database.foundation.get(`checkout:${subjectId}:${packageId}`)).toBeTruthy();
  });

  it.each(["before-expand", "after-expand", "after-copy", "before-contract"] as const)(
    "opens read-only recovery and preserves v1 data after termination at %s",
    async (phase) => {
      const name = `aviasurveil360-field-migration-failure-${phase}-${crypto.randomUUID()}`;
      await seedReleasedV1(name);
      const database = new OfflineFieldDatabase({
        name,
        migrationFault: (candidate) => {
          if (candidate === phase) throw new Error(`terminated at ${phase}`);
        },
      });
      const repository = createRepository({ database }).repository;

      await expect(repository.initialize()).resolves.toMatchObject({
        mode: "read-only-recovery",
        failedPhase: phase,
      });
      await expect(repository.saveChecklistResponse({
        operationId: "OP-BLOCKED-MIGRATION",
        packageId,
        responseId: "RESP-CAB-EMEQ-PBE-001",
        questionId: "CAB-EMEQ-PBE-001",
        answer: "NOT_CHECKED",
        comment: "",
      })).rejects.toMatchObject({ code: "READ_ONLY_RECOVERY" });
      expect(await database.readFoundationRecoveryRecord(`checkout:${subjectId}:${packageId}`)).toBeTruthy();
    },
  );

  it("accepts only positive N and N-1 field schema versions", () => {
    expect(isFieldSchemaNOrNMinusOne(2, 2)).toBe(true);
    expect(isFieldSchemaNOrNMinusOne(1, 2)).toBe(true);
    expect(isFieldSchemaNOrNMinusOne(0, 1)).toBe(false);
    expect(isFieldSchemaNOrNMinusOne(3, 2)).toBe(false);
  });
});
