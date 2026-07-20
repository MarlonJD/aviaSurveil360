import type {
  Backend,
  BackendPrincipal,
  ChecklistResponseView,
  EvidenceReviewState,
  FindingStatus,
  FindingView,
  InspectionPackage,
  PotentialFindingView,
  ReportApprovalStatus,
} from "../backend/backend";
import {
  BackendAuthorizationInvariantError,
  BackendConflictError,
  BackendInvariantError,
  requireNonEmpty,
  requireRevision,
  requireRole,
} from "../backend/backend-contracts";
import { MemoryMockStore } from "./memory-mock-store";
import {
  publicEvidenceVersion,
  type MockEvidenceUpload,
  type MockEvidenceVersion,
  type MockInspectionAttachmentUpload,
  type MockState,
} from "./seed-data";

function pad(value: number, width = 3): string {
  return String(value).padStart(width, "0");
}

function addHours(instant: string, hours: number): string {
  return new Date(new Date(instant).getTime() + hours * 60 * 60 * 1000).toISOString();
}

function getPackage(state: Readonly<MockState>, packageId: string): InspectionPackage {
  const packageView = state.packages[packageId];
  if (!packageView) throw new BackendInvariantError(`Inspection package ${packageId} was not found.`);
  return {
    ...packageView,
    questions: packageView.questions.map((question) => ({
      ...question,
      currentResponse:
        Object.values(state.checklistResponses).find(
          (response) => response.questionId === question.id,
        ) ?? null,
    })),
  };
}

function packageForAudit(state: Readonly<MockState>, auditId: string): InspectionPackage {
  const packageView = Object.values(state.packages).find((candidate) => candidate.auditId === auditId);
  if (!packageView) throw new BackendInvariantError(`Audit ${auditId} has no inspection package.`);
  return packageView;
}

function findingForPrincipal(
  state: Readonly<MockState>,
  principal: BackendPrincipal,
  findingId: string,
): FindingView {
  const finding = state.findings[findingId];
  if (!finding) throw new BackendInvariantError(`Finding ${findingId} was not found.`);
  if (principal.role === "auditee" && finding.organizationId !== principal.organizationId) {
    throw new BackendAuthorizationInvariantError("Finding is unavailable to this Auditee organization.");
  }
  return finding;
}

function mutableFinding(state: MockState, findingId: string): FindingView {
  const finding = state.findings[findingId];
  if (!finding) throw new BackendInvariantError(`Finding ${findingId} was not found.`);
  return finding;
}

function requireAuditeeOrganization(principal: BackendPrincipal, organizationId: string): void {
  requireRole(principal, ["auditee"], "Auditee authority is required.");
  if (!principal.organizationId || principal.organizationId !== organizationId) {
    throw new BackendAuthorizationInvariantError("Auditee organization scope does not match this record.");
  }
}

function requireSeparateReviewComments(commentToAuditee: string, internalCaaNote: string): void {
  requireNonEmpty(commentToAuditee, "Comment to Auditee");
  requireNonEmpty(internalCaaNote, "Internal CAA Note");
}

export class MockBackendEngine implements Backend {
  readonly mode = "mock" as const;

  constructor(
    private readonly store: MemoryMockStore,
    private readonly principal: BackendPrincipal,
  ) {}

  readonly assignments: Backend["assignments"] = {
    list: async (input) =>
      this.store.read((state) => {
        let items = state.assignments;
        if (this.principal.role === "inspector") {
          items = items.filter((assignment) => {
            const packageView = Object.values(state.packages).find(
              (candidate) => candidate.auditId === assignment.auditId,
            );
            return packageView?.questions.some((question) =>
              question.assignedInspectorUserIds.includes(this.principal.subjectId),
            );
          });
        } else if (this.principal.role === "auditee") {
          items = items.filter(
            (assignment) => assignment.organizationId === this.principal.organizationId,
          );
        }
        if (input.status) items = items.filter((assignment) => assignment.status === input.status);
        const limit = input.limit ?? items.length;
        return { items: items.slice(0, limit), nextCursor: null };
      }),
  };

  readonly inspections: Backend["inspections"] = {
    getPackage: async ({ packageId }) =>
      this.store.read((state) => {
        const packageView = getPackage(state, packageId);
        if (this.principal.role === "auditee") {
          throw new BackendAuthorizationInvariantError(
            "Inspection execution packages are not available to Auditee users.",
          );
        }
        return packageView;
      }),

    checkout: async (input) => {
      requireRole(this.principal, ["inspector", "leadInspector"], "Inspector authority is required.");
      return this.store.execute(input.operationId, input, (state) => {
        const packageView = getPackage(state, input.packageId);
        requireRevision(packageView.packageVersion, input.expectedPackageVersion, "Package");
        const questionIds = packageView.questions
          .filter(
            (question) =>
              this.principal.role === "leadInspector" ||
              question.assignedInspectorUserIds.includes(this.principal.subjectId),
          )
          .map((question) => question.id);
        return {
          inspectionPackage: packageView,
          offlineGrant: {
            grantId: "GRANT-CANDIDATE-001",
            subjectId: this.principal.subjectId,
            organizationId: packageView.organizationId,
            packageId: packageView.id,
            packageVersion: packageView.packageVersion,
            packageDigest: packageView.packageDigest,
            allowedCommandTypes: [
              "UPSERT_CHECKLIST_RESPONSE",
              "CREATE_POTENTIAL_FINDING",
              "SUBMIT_CHECKLIST",
              "REGISTER_INSPECTION_ATTACHMENT",
            ],
            assignmentScope: { questionIds },
            deviceInstanceId: input.deviceInstanceId,
            issuedAt: this.store.clock(),
            expiresAt: "2026-07-15T23:59:59.000Z",
            protocolVersion: packageView.protocolVersion,
          },
        };
      });
    },

    upsertChecklistResponse: async (input) => {
      requireRole(
        this.principal,
        ["inspector", "leadInspector"],
        "Inspector or Lead Inspector authority is required.",
      );
      return this.store.execute(input.operationId, input, (state) => {
        const packageView = packageForAudit(state, input.auditId);
        if (packageView.checklistStatus === "SUBMITTED") {
          throw new BackendInvariantError("Submitted checklist is read-only until a reasoned reopen.");
        }
        const question = packageView.questions.find((candidate) => candidate.id === input.questionId);
        if (!question) {
          throw new BackendInvariantError("Checklist response must target an exact Audit question.");
        }
        if (
          this.principal.role === "inspector" &&
          !question.assignedInspectorUserIds.includes(this.principal.subjectId)
        ) {
          throw new BackendAuthorizationInvariantError(
            "This question is read-only because it belongs to another assigned Inspector.",
          );
        }
        if (!question.allowedAnswers.includes(input.answer)) {
          throw new BackendInvariantError("Checklist answer is not allowed for this question.");
        }
        if (question.commentRequiredFor.includes(input.answer)) {
          requireNonEmpty(input.comment, "Required checklist comment");
        }
        const existing = state.checklistResponses[input.responseId];
        requireRevision(existing?.revision ?? null, input.expectedResponseRevision, "Checklist response");
        if (existing && existing.questionId !== input.questionId) {
          throw new BackendInvariantError("Checklist response identity cannot move to another question.");
        }
        const response: ChecklistResponseView = {
          id: input.responseId,
          questionId: input.questionId,
          answer: input.answer,
          comment: input.comment.trim(),
          revision: (existing?.revision ?? 0) + 1,
          updatedAt: this.store.clock(),
        };
        state.checklistResponses[response.id] = response;
        return response;
      });
    },

    submitChecklist: async (input) => {
      requireRole(
        this.principal,
        ["inspector", "leadInspector"],
        "Inspector or Lead Inspector authority is required.",
      );
      return this.store.execute(input.operationId, input, (state) => {
        const packageView = packageForAudit(state, input.auditId);
        requireRevision(packageView.checklistRevision, input.expectedChecklistRevision, "Checklist");
        if (!Object.values(state.checklistResponses).some((response) => response.questionId === "CAB-EMEQ-PBE-001")) {
          throw new BackendInvariantError("The canonical PBE response is required before submission.");
        }
        packageView.checklistStatus = "SUBMITTED";
        packageView.checklistRevision += 1;
        return {
          auditId: packageView.auditId,
          checklistStatus: packageView.checklistStatus,
          checklistRevision: packageView.checklistRevision,
        };
      });
    },

    reopenChecklist: async (input) => {
      requireRole(
        this.principal,
        ["inspector", "leadInspector"],
        "Inspector or Lead Inspector authority is required.",
      );
      requireNonEmpty(input.reason, "Reopen reason");
      return this.store.execute(input.operationId, input, (state) => {
        const packageView = packageForAudit(state, input.auditId);
        requireRevision(packageView.checklistRevision, input.expectedChecklistRevision, "Checklist");
        if (packageView.checklistStatus !== "SUBMITTED") {
          throw new BackendInvariantError("Only a submitted checklist can be reopened.");
        }
        packageView.checklistStatus = "IN_PROGRESS";
        packageView.checklistRevision += 1;
        return {
          auditId: packageView.auditId,
          checklistStatus: packageView.checklistStatus,
          checklistRevision: packageView.checklistRevision,
        };
      });
    },
  };

  readonly potentialFindings: Backend["potentialFindings"] = {
    create: async (input) => {
      requireRole(this.principal, ["inspector"], "CAA Inspector authority is required.");
      return this.store.execute(input.operationId, input, (state) => {
        const packageView = packageForAudit(state, input.auditId);
        const question = packageView.questions.find((candidate) => candidate.id === input.questionId);
        if (!question) throw new BackendInvariantError("Potential Finding must target an exact Audit question.");
        if (!question.assignedInspectorUserIds.includes(this.principal.subjectId)) {
          throw new BackendAuthorizationInvariantError(
            "Potential Finding requires the question's assigned Inspector.",
          );
        }
        const response = state.checklistResponses[input.checklistResponseId];
        if (!response || response.questionId !== input.questionId) {
          throw new BackendInvariantError(
            "Potential Finding must target the exact checklist response and question.",
          );
        }
        requireRevision(
          response.revision,
          input.expectedChecklistResponseRevision,
          "Checklist response",
        );
        if (!(["NON_COMPLIANT", "OBSERVATION"] as const).includes(response.answer as never)) {
          throw new BackendInvariantError(
            "Only Non-Compliant or Observation responses may create a Potential Finding.",
          );
        }
        requireNonEmpty(input.requiredComment, "Required Potential Finding comment");
        if (
          Object.values(state.potentialFindings).some(
            (candidate) =>
              candidate.auditId === input.auditId &&
              candidate.questionId === input.questionId &&
              candidate.status !== "DISMISSED",
          )
        ) {
          throw new BackendConflictError("An active Potential Finding already exists for this response.");
        }
        const sequence = state.counters.potentialFinding++;
        const potential: PotentialFindingView = {
          id: `PF-2026-${pad(sequence)}`,
          auditId: input.auditId,
          questionId: input.questionId,
          organizationId: packageView.organizationId,
          title: input.title.trim(),
          description: input.description.trim(),
          status: "PENDING_LEAD_REVIEW",
          revision: 1,
          convertedFindingId: null,
        };
        state.potentialFindings[potential.id] = potential;
        return potential;
      });
    },

    decide: async (input) => {
      requireRole(this.principal, ["leadInspector"], "Lead Inspector authority is required.");
      return this.store.execute(input.operationId, input, (state) => {
        const potential = state.potentialFindings[input.potentialFindingId];
        if (!potential) throw new BackendInvariantError("Potential Finding was not found.");
        requireRevision(
          potential.revision,
          input.expectedPotentialFindingRevision,
          "Potential Finding",
        );
        if (potential.status !== "PENDING_LEAD_REVIEW" && potential.status !== "RETURNED") {
          throw new BackendInvariantError("Potential Finding is not available for a Lead decision.");
        }
        if (input.decision === "RETURN" || input.decision === "DISMISS") {
          requireNonEmpty(input.reason, "Lead decision reason");
          potential.status = input.decision === "RETURN" ? "RETURNED" : "DISMISSED";
          potential.revision += 1;
          return { potentialFinding: potential, finding: null };
        }

        const conversion = input as Extract<typeof input, { decision: "CONVERT" }>;

        const packageView = packageForAudit(state, potential.auditId);
        const question = packageView.questions.find(
          (candidate) => candidate.id === potential.questionId,
        );
        if (!question) throw new BackendInvariantError("Potential Finding question is unavailable.");
        const sequence = state.counters.finding++;
        const findingId =
          sequence === 1 ? "FND-CAB-2026-001" : `FND-CAB-2026-${pad(sequence)}`;
        const findingNumber = `CAB-2026-${pad(sequence)}`;
        const finding: FindingView = {
          id: findingId,
          findingNumber,
          auditId: potential.auditId,
          organizationId: potential.organizationId,
          organizationName: packageView.organizationName,
          title: potential.title,
          description: potential.description,
          regulatoryReference: question.regulatoryReference,
          findingBasis: `Non-Compliant response and required Inspector comment for ${question.id}`,
          severity: conversion.severity,
          status: conversion.capRequired ? "WAITING_FOR_CAP" : "PENDING_CLOSURE",
          dueDate: conversion.dueDate,
          dueState: conversion.dueDate ? "NOT_DUE" : "NONE",
          currentOwnerType: conversion.capRequired ? "AUDITEE" : "CAA",
          currentOwnerId: conversion.capRequired
            ? potential.organizationId
            : this.principal.subjectId,
          currentOwnerRole: conversion.capRequired ? "auditee" : "leadInspector",
          nextAction: conversion.capRequired
            ? "Auditee to submit CAP"
            : "CAA to verify closure path",
          capRequired: conversion.capRequired,
          evidenceRequired: conversion.evidenceRequired,
          repeatFinding: false,
          createdAt: this.store.clock(),
          issuedAt: this.store.clock(),
          closedAt: null,
          closureBasis: null,
          revision: 1,
        };
        state.findings[finding.id] = finding;
        potential.status = "CONVERTED";
        potential.convertedFindingId = finding.id;
        potential.revision += 1;
        return { potentialFinding: potential, finding };
      });
    },
  };

  readonly findings: Backend["findings"] = {
    list: async (input) =>
      this.store.read((state) => {
        let items = Object.values(state.findings);
        if (this.principal.role === "auditee") {
          items = items.filter((finding) => finding.organizationId === this.principal.organizationId);
        }
        if (input.status) items = items.filter((finding) => finding.status === input.status);
        items = items.sort((left, right) => left.findingNumber.localeCompare(right.findingNumber));
        const limit = input.limit ?? items.length;
        return { items: items.slice(0, limit), nextCursor: null };
      }),

    get: async ({ findingId }) =>
      this.store.read((state) => findingForPrincipal(state, this.principal, findingId)),

    authorizedClose: async (input) => {
      requireRole(
        this.principal,
        ["manager"],
        "Department Manager authority is required for authorized closure.",
      );
      requireNonEmpty(input.reason, "Authorized closure reason");
      return this.store.execute(input.operationId, input, (state) => {
        const finding = mutableFinding(state, input.findingId);
        requireRevision(finding.revision, input.expectedFindingRevision, "Finding");
        if (finding.status === "CLOSED") throw new BackendInvariantError("Finding is already closed.");
        finding.status = "CLOSED";
        finding.currentOwnerType = "CAA";
        finding.currentOwnerId = this.principal.subjectId;
        finding.currentOwnerRole = "manager";
        finding.nextAction = "No action — Finding closed through authorized path";
        finding.closedAt = this.store.clock();
        finding.closureBasis = "AUTHORIZED";
        finding.revision += 1;
        return finding;
      });
    },
  };

  readonly caps: Backend["caps"] = {
    submit: async (input) => {
      requireRole(this.principal, ["auditee"], "Auditee authority is required to submit CAP.");
      for (const [value, label] of [
        [input.rootCause, "Root cause"],
        [input.correctiveAction, "Corrective action"],
        [input.preventiveAction, "Preventive action"],
        [input.responsiblePerson, "Responsible person"],
        [input.targetCompletionDate, "Target completion date"],
      ] as const) {
        requireNonEmpty(value, label);
      }
      return this.store.execute(input.operationId, input, (state) => {
        const finding = mutableFinding(state, input.findingId);
        requireAuditeeOrganization(this.principal, finding.organizationId);
        requireRevision(finding.revision, input.expectedFindingRevision, "Finding");
        if (
          finding.status !== "WAITING_FOR_CAP" &&
          finding.status !== "CAP_MORE_INFORMATION_REQUESTED" &&
          finding.status !== "CAP_REJECTED"
        ) {
          throw new BackendInvariantError("Finding is not accepting a CAP submission.");
        }
        const existingVersions = state.capRevisions.filter(
          (revision) => revision.findingId === finding.id,
        );
        for (const prior of existingVersions) {
          if (prior.status !== "SUPERSEDED") prior.status = "SUPERSEDED";
        }
        const version = existingVersions.length + 1;
        const capRevisionId = `CAP-${finding.findingNumber}-R${version}`;
        state.capRevisions.push({
          id: capRevisionId,
          findingId: finding.id,
          organizationId: finding.organizationId,
          version,
          revision: 1,
          status: "SUBMITTED",
          rootCause: input.rootCause.trim(),
          correctiveAction: input.correctiveAction.trim(),
          preventiveAction: input.preventiveAction.trim(),
          responsiblePerson: input.responsiblePerson.trim(),
          targetCompletionDate: input.targetCompletionDate,
          commentToCaa: input.commentToCaa.trim(),
          commentToAuditee: "",
          internalCaaNote: "",
          submittedAt: this.store.clock(),
          reviewedAt: null,
        });
        finding.status = "CAP_SUBMITTED";
        finding.currentOwnerType = "CAA";
        finding.currentOwnerId = "USR-LEAD-CANER";
        finding.currentOwnerRole = "leadInspector";
        finding.nextAction = "CAA to review submitted CAP";
        finding.revision += 1;
        return {
          capRevisionId,
          capRevision: 1,
          capStatus: "SUBMITTED",
          findingStatus: finding.status,
          findingRevision: finding.revision,
        };
      });
    },

    review: async (input) => {
      requireRole(
        this.principal,
        ["inspector", "leadInspector"],
        "CAA Inspector or Lead Inspector authority is required to review CAP.",
      );
      requireSeparateReviewComments(input.commentToAuditee, input.internalCaaNote);
      return this.store.execute(input.operationId, input, (state) => {
        const finding = mutableFinding(state, input.findingId);
        requireRevision(finding.revision, input.expectedFindingRevision, "Finding");
        const cap = state.capRevisions.find((revision) => revision.id === input.capRevisionId);
        if (!cap || cap.findingId !== finding.id) {
          throw new BackendInvariantError("CAP review must target the exact Finding revision.");
        }
        requireRevision(cap.revision, input.expectedCapRevision, "CAP");
        if (cap.status !== "SUBMITTED" && cap.status !== "PENDING_CAA_REVIEW") {
          throw new BackendInvariantError("CAP revision is not pending CAA review.");
        }
        cap.commentToAuditee = input.commentToAuditee.trim();
        cap.internalCaaNote = input.internalCaaNote.trim();
        cap.reviewedAt = this.store.clock();
        cap.revision += 1;

        if (input.decision === "ACCEPT") {
          cap.status = "ACCEPTED";
          finding.status = finding.evidenceRequired ? "EVIDENCE_REQUIRED" : "PENDING_CLOSURE";
          finding.currentOwnerType = finding.evidenceRequired ? "AUDITEE" : "CAA";
          finding.currentOwnerId = finding.evidenceRequired
            ? finding.organizationId
            : this.principal.subjectId;
          finding.currentOwnerRole = finding.evidenceRequired ? "auditee" : this.principal.role;
          finding.nextAction = finding.evidenceRequired
            ? "Auditee to submit required Evidence"
            : "CAA to verify closure";
        } else if (input.decision === "REJECT") {
          cap.status = "REJECTED";
          finding.status = "CAP_REJECTED";
          finding.currentOwnerType = "AUDITEE";
          finding.currentOwnerId = finding.organizationId;
          finding.currentOwnerRole = "auditee";
          finding.nextAction = "Auditee to revise CAP";
        } else {
          cap.status = "MORE_INFORMATION_REQUESTED";
          finding.status = "CAP_MORE_INFORMATION_REQUESTED";
          finding.currentOwnerType = "AUDITEE";
          finding.currentOwnerId = finding.organizationId;
          finding.currentOwnerRole = "auditee";
          finding.nextAction = "Auditee to provide more CAP information";
        }
        finding.revision += 1;
        return {
          capRevisionId: cap.id,
          capRevision: cap.revision,
          capStatus: cap.status,
          findingStatus: finding.status,
          findingRevision: finding.revision,
        };
      });
    },
  };

  readonly inspectionAttachments: Backend["inspectionAttachments"] = {
    beginUpload: async (input) => {
      requireRole(
        this.principal,
        ["inspector", "leadInspector"],
        "Inspector authority is required for Inspection Attachment upload.",
      );
      return this.store.execute(input.operationId, input, (state) => {
        getPackage(state, input.packageId);
        const sequence = state.counters.upload++;
        const uploadId = `UP-ATT-${pad(sequence, 4)}`;
        const upload: MockInspectionAttachmentUpload = {
          kind: "inspection-attachment",
          uploadId,
          inspectionAttachmentId: input.inspectionAttachmentId,
          packageId: input.packageId,
          fileName: input.fileName,
          byteSize: input.byteSize,
          sha256: input.sha256,
        };
        state.uploads[uploadId] = upload;
        return {
          uploadId,
          stagingObjectKey: `candidate/inspection-attachments/${input.inspectionAttachmentId}`,
          uploadUrl: `mock://inspection-attachments/${uploadId}`,
          requiredHeaders: { "x-candidate-sha256": input.sha256 },
          expiresAt: addHours(this.store.clock(), 1),
          maximumByteSize: 10_000_000,
        };
      });
    },

    completeUpload: async (input) =>
      this.store.execute(input.operationId, input, (state) => {
        const upload = state.uploads[input.uploadId];
        if (!upload || upload.kind !== "inspection-attachment") {
          throw new BackendInvariantError("Inspection Attachment upload was not found.");
        }
        if (upload.sha256 !== input.sha256 || upload.byteSize !== input.byteSize) {
          throw new BackendInvariantError("Inspection Attachment checksum or byte size does not match.");
        }
        return {
          inspectionAttachmentId: upload.inspectionAttachmentId,
          uploadState: "UPLOADED",
          scanState: "PENDING",
        };
      }),
  };

  readonly evidence: Backend["evidence"] = {
    beginUpload: async (input) => {
      requireRole(this.principal, ["auditee"], "Auditee authority is required to submit Evidence.");
      requireNonEmpty(input.fileName, "Evidence filename");
      return this.store.execute(input.operationId, input, (state) => {
        const finding = mutableFinding(state, input.findingId);
        requireAuditeeOrganization(this.principal, finding.organizationId);
        requireRevision(finding.revision, input.expectedFindingRevision, "Finding");
        if (
          finding.status !== "EVIDENCE_REQUIRED" &&
          finding.status !== "EVIDENCE_MORE_INFORMATION_REQUESTED"
        ) {
          throw new BackendInvariantError("Finding is not accepting Evidence.");
        }
        const sequence = state.counters.upload++;
        const uploadId = `UP-EV-${pad(sequence, 4)}`;
        const upload: MockEvidenceUpload = {
          kind: "evidence",
          uploadId,
          findingId: finding.id,
          organizationId: finding.organizationId,
          fileName: input.fileName.trim(),
          declaredMediaType: input.declaredMediaType,
          byteSize: input.byteSize,
          sha256: input.sha256,
        };
        state.uploads[uploadId] = upload;
        return {
          uploadId,
          stagingObjectKey: `candidate/evidence/${uploadId}`,
          uploadUrl: `mock://evidence/${uploadId}`,
          requiredHeaders: { "x-candidate-sha256": input.sha256 },
          expiresAt: addHours(this.store.clock(), 1),
          maximumByteSize: 10_000_000,
        };
      });
    },

    completeUpload: async (input) =>
      this.store.execute(input.operationId, input, (state) => {
        const upload = state.uploads[input.uploadId];
        if (!upload || upload.kind !== "evidence") {
          throw new BackendInvariantError("Evidence upload was not found.");
        }
        requireAuditeeOrganization(this.principal, upload.organizationId);
        if (upload.sha256 !== input.sha256 || upload.byteSize !== input.byteSize) {
          throw new BackendInvariantError("Evidence checksum or byte size does not match.");
        }
        const finding = mutableFinding(state, upload.findingId);
        const version =
          state.evidenceVersions.filter((candidate) => candidate.findingId === finding.id).length + 1;
        const evidenceVersion: MockEvidenceVersion = {
          id: `EV-${finding.findingNumber}-V${version}`,
          findingId: finding.id,
          organizationId: finding.organizationId,
          version,
          fileName: upload.fileName,
          submittedAt: this.store.clock(),
          uploadState: "UPLOADED",
          scanState: "CLEAN",
          reviewState: "PENDING_CAA_REVIEW",
          revision: 1,
          commentToAuditee: "",
        };
        state.evidenceVersions.push(evidenceVersion);
        finding.status = "EVIDENCE_SUBMITTED";
        finding.currentOwnerType = "CAA";
        finding.currentOwnerId = "USR-LEAD-CANER";
        finding.currentOwnerRole = "leadInspector";
        finding.nextAction = "CAA to review latest Evidence version";
        finding.revision += 1;
        return {
          evidenceVersionId: evidenceVersion.id,
          version,
          uploadState: "UPLOADED",
          scanState: "CLEAN",
          reviewState: "PENDING_CAA_REVIEW",
        };
      }),

    listVersions: async ({ findingId }) =>
      this.store.read((state) => {
        findingForPrincipal(state, this.principal, findingId);
        return state.evidenceVersions
          .filter((version) => version.findingId === findingId)
          .sort((left, right) => left.version - right.version)
          .map(publicEvidenceVersion);
      }),

    review: async (input) => {
      requireRole(
        this.principal,
        ["inspector", "leadInspector"],
        "CAA Inspector or Lead Inspector authority is required to review Evidence.",
      );
      requireSeparateReviewComments(input.commentToAuditee, input.internalCaaNote);
      return this.store.execute(input.operationId, input, (state) => {
        const finding = mutableFinding(state, input.findingId);
        requireRevision(finding.revision, input.expectedFindingRevision, "Finding");
        const evidenceVersion = state.evidenceVersions.find(
          (version) => version.id === input.evidenceVersionId,
        );
        if (!evidenceVersion || evidenceVersion.findingId !== finding.id) {
          throw new BackendInvariantError("Evidence review must target the exact Finding version.");
        }
        const latestVersion = state.evidenceVersions
          .filter((version) => version.findingId === finding.id)
          .sort((left, right) => right.version - left.version)[0];
        if (latestVersion?.id !== evidenceVersion.id) {
          throw new BackendInvariantError("Evidence review must target the exact latest version.");
        }
        requireRevision(
          evidenceVersion.revision,
          input.expectedEvidenceVersionRevision,
          "Evidence version",
        );
        if (evidenceVersion.scanState !== "CLEAN") {
          throw new BackendInvariantError("Only scan-clean Evidence can be reviewed.");
        }
        let reviewState: EvidenceReviewState;
        if (input.decision === "CLOSE") reviewState = "ACCEPTED";
        else if (input.decision === "PARTIALLY_CLOSE") reviewState = "PARTIALLY_ACCEPTED";
        else if (input.decision === "NOT_CLOSE") reviewState = "REJECTED";
        else reviewState = "MORE_INFORMATION_REQUESTED";
        evidenceVersion.reviewState = reviewState;
        evidenceVersion.commentToAuditee = input.commentToAuditee.trim();
        evidenceVersion.revision += 1;

        const reviewSequence = state.counters.evidenceReview++;
        const reviewDecisionId = `EVD-REVIEW-${pad(reviewSequence, 4)}`;
        state.evidenceReviews.push({
          id: reviewDecisionId,
          findingId: finding.id,
          evidenceVersionId: evidenceVersion.id,
          decision: input.decision,
          commentToAuditee: input.commentToAuditee.trim(),
          internalCaaNote: input.internalCaaNote.trim(),
          reviewedAt: this.store.clock(),
        });

        if (input.decision === "CLOSE") {
          finding.status = "CLOSED";
          finding.currentOwnerType = "CAA";
          finding.currentOwnerId = this.principal.subjectId;
          finding.currentOwnerRole = this.principal.role;
          finding.nextAction = "No action — Finding closed";
          finding.closedAt = this.store.clock();
          finding.closureBasis = "EVIDENCE_VERIFIED";
        } else {
          finding.status = "EVIDENCE_MORE_INFORMATION_REQUESTED";
          finding.currentOwnerType = "AUDITEE";
          finding.currentOwnerId = finding.organizationId;
          finding.currentOwnerRole = "auditee";
          finding.nextAction = "Auditee to provide remaining Evidence or information";
          finding.closedAt = null;
          finding.closureBasis = null;
        }
        finding.revision += 1;
        return {
          reviewDecisionId,
          evidenceVersionId: evidenceVersion.id,
          evidenceVersionRevision: evidenceVersion.revision,
          findingStatus: finding.status,
          findingRevision: finding.revision,
        };
      });
    },
  };

  readonly reports: Backend["reports"] = {
    getVersion: async ({ reportVersionId }) =>
      this.store.read((state) => {
        const report = state.reportVersions[reportVersionId];
        if (!report) throw new BackendInvariantError("Report version was not found.");
        if (
          this.principal.role === "auditee" &&
          (report.organizationId !== this.principal.organizationId ||
            !(["ISSUED", "LOCKED"] as ReportApprovalStatus[]).includes(report.status))
        ) {
          throw new BackendAuthorizationInvariantError("Report version is unavailable to this Auditee.");
        }
        return report;
      }),

    decide: async (input) =>
      this.store.execute(input.operationId, input, (state) => {
        const report = state.reportVersions[input.reportVersionId];
        if (!report) throw new BackendInvariantError("Report version was not found.");
        requireRevision(report.revision, input.expectedReportVersionRevision, "Report version");
        requireNonEmpty(input.reason, "Report decision reason");

        if (this.principal.role === "manager" && report.status === "DEPARTMENT_REVIEW") {
          if (input.decision === "ISSUE_AND_LOCK") {
            throw new BackendAuthorizationInvariantError("Department Manager cannot issue or lock reports.");
          }
          report.status = input.decision === "FORWARD" ? "GM_REVIEW" : "RETURNED";
        } else if (this.principal.role === "gm" && report.status === "GM_REVIEW") {
          if (input.decision === "ISSUE_AND_LOCK") {
            throw new BackendAuthorizationInvariantError("General Manager cannot issue or lock reports.");
          }
          report.status =
            input.decision === "FORWARD" ? "EXECUTIVE_DIRECTOR_REVIEW" : "RETURNED";
        } else if (
          this.principal.role === "executiveDirector" &&
          report.status === "EXECUTIVE_DIRECTOR_REVIEW" &&
          input.decision === "ISSUE_AND_LOCK"
        ) {
          report.status = "LOCKED";
          report.issuedAt = this.store.clock();
        } else {
          throw new BackendAuthorizationInvariantError(
            "This role or report stage cannot perform the requested report decision.",
          );
        }
        report.revision += 1;
        return report;
      }),
  };

  readonly dashboards: Backend["dashboards"] = {
    getManagerProjection: async ({ organizationId }) => {
      requireRole(
        this.principal,
        ["manager", "gm", "executiveDirector"],
        "CAA management authority is required for the manager dashboard.",
      );
      return this.store.read((state) => {
        const findings = Object.values(state.findings).filter(
          (finding) => !organizationId || finding.organizationId === organizationId,
        );
        return {
          generatedAt: this.store.clock(),
          openFindings: findings.filter((finding) => finding.status !== "CLOSED").length,
          closedFindings: findings.filter((finding) => finding.status === "CLOSED").length,
          overdueFindings: findings.filter(
            (finding) => finding.status !== "CLOSED" && finding.dueState === "OVERDUE",
          ).length,
          pendingCapReviews: findings.filter((finding) => finding.status === "CAP_SUBMITTED").length,
          pendingEvidenceReviews: findings.filter(
            (finding) => finding.status === "EVIDENCE_SUBMITTED",
          ).length,
          recentFindingNumbers: findings
            .slice()
            .sort((left, right) => right.revision - left.revision)
            .map((finding) => finding.findingNumber),
        };
      });
    },
  };

  readonly sync: Backend["sync"] = {
    pushOperation: async ({ operation }) => {
      requireRole(this.principal, ["inspector"], "CAA Inspector authority is required for sync.");
      return this.store.execute(operation.operationId, operation, (state) => {
        const packageView = getPackage(state, operation.packageId);
        if (
          operation.packageVersion !== packageView.packageVersion ||
          operation.protocolVersion !== packageView.protocolVersion
        ) {
          throw new BackendConflictError("Sync package or protocol version does not match.");
        }
        return {
          operationId: operation.operationId,
          status: "accepted",
          authoritativeEntityId: operation.entityId,
          authoritativeRevision: 1,
          errorCode: null,
          conflict: null,
          acknowledgedAt: this.store.clock(),
        };
      });
    },

    pull: async (input) => {
      requireRole(this.principal, ["inspector"], "CAA Inspector authority is required for sync.");
      return this.store.read((state) => {
        getPackage(state, input.packageId);
        return {
          changes: [],
          nextCursor: input.cursor,
          hasMore: false,
          resnapshotRequired: false,
          projectionVersion: 1,
        };
      });
    },
  };
}
