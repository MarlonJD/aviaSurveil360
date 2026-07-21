import type {
  Backend,
  PushFieldOperationResult,
  SyncPullResponse,
} from "../backend/backend";
import {
  BackendAuthorizationInvariantError,
  BackendConflictError,
  BackendInvariantError,
} from "../backend/backend-contracts";
import type { AttachmentManifestRow, OutboxRow, SyncStateRow } from "./db";

export type FieldSyncTrigger = "startup" | "foreground" | "online" | "manual" | "app-open";

export interface FieldSyncTarget {
  packageId: string;
  offlineGrantId: string;
}

export interface FieldSyncRepository {
  recoverInterruptedOperations(packageId: string): Promise<void>;
  releaseRetryableOperations(packageId: string, force: boolean): Promise<void>;
  listDeliverableOperations(packageId: string): Promise<OutboxRow[]>;
  markOperationInFlight(operationId: string): Promise<OutboxRow>;
  applyPushResult(operationId: string, result: PushFieldOperationResult): Promise<void>;
  getSyncState(packageId: string): Promise<SyncStateRow | null>;
  applyPullPage(input: {
    packageId: string;
    grantId: string;
    expectedCursor: string | null;
    page: SyncPullResponse;
  }): Promise<void>;
  listRegisteredAttachmentsReadyForUpload(packageId: string): Promise<AttachmentManifestRow[]>;
  beginRegisteredAttachmentUpload(attachmentId: string): Promise<AttachmentManifestRow>;
  markAttachmentUploadRetryable(attachmentId: string, errorCode: string): Promise<void>;
  acknowledgeUploadedAttachment(input: {
    attachmentId: string;
    authoritativeEntityId: string;
    acknowledgedAt: string;
  }): Promise<void>;
}

export interface SyncOwnerLockResult<T> {
  acquired: boolean;
  value?: T;
}

export interface SyncOwnerLock {
  request<T>(
    name: string,
    callback: () => Promise<T>,
  ): Promise<SyncOwnerLockResult<T>>;
}

export interface SyncCycleReport {
  acquired: boolean;
  trigger: FieldSyncTrigger;
  status:
    | "synchronized"
    | "contended"
    | "retryable"
    | "conflict"
    | "forbidden"
    | "invalid"
    | "resnapshot-required";
  pushed: number;
  pulled: number;
  uploaded: number;
  conflict: PushFieldOperationResult["conflict"];
  errorCode: string | null;
}

export interface SyncStatusMessage {
  type: "field-sync-status";
  packageId: string;
  report: SyncCycleReport;
}

export interface SyncStatusBroadcast {
  broadcast(message: SyncStatusMessage): void;
  subscribe(listener: (message: SyncStatusMessage) => void): () => void;
  close(): void;
}

interface ForegroundSyncEngineOptions {
  backend: Backend;
  repository: FieldSyncRepository;
  lock: SyncOwnerLock;
  now?: () => Date;
  readAttachmentBytes?: (path: string) => Promise<Uint8Array>;
  uploadBytes?: (
    url: string,
    bytes: Uint8Array,
    requiredHeaders: Record<string, string>,
  ) => Promise<void>;
  operationId?: (prefix: string) => string;
  broadcast?: (message: SyncStatusMessage) => void;
}

function retryableResult(operationId: string, now: Date, errorCode: string): PushFieldOperationResult {
  return {
    operationId,
    status: "retryable",
    authoritativeEntityId: null,
    authoritativeRevision: null,
    errorCode,
    conflict: null,
    acknowledgedAt: now.toISOString(),
  };
}

function errorCode(error: unknown): string {
  if (error instanceof BackendAuthorizationInvariantError) return "FORBIDDEN";
  if (error instanceof BackendConflictError) return "CONFLICT";
  if (error instanceof BackendInvariantError) return "INVALID_RESPONSE";
  if (error instanceof Error && error.name === "AbortError") return "REQUEST_ABORTED";
  return "NETWORK_OR_INFRASTRUCTURE";
}

async function browserUpload(
  url: string,
  bytes: Uint8Array,
  requiredHeaders: Record<string, string>,
): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    headers: requiredHeaders,
    body: new Blob([Uint8Array.from(bytes)]),
    credentials: "omit",
  });
  if (!response.ok) throw new Error(`Inspection Attachment upload failed with HTTP ${response.status}.`);
}

export class ForegroundSyncEngine {
  private readonly backend: Backend;
  private readonly repository: FieldSyncRepository;
  private readonly lock: SyncOwnerLock;
  private readonly now: () => Date;
  private readonly readAttachmentBytes?: (path: string) => Promise<Uint8Array>;
  private readonly uploadBytes: NonNullable<ForegroundSyncEngineOptions["uploadBytes"]>;
  private readonly operationId: NonNullable<ForegroundSyncEngineOptions["operationId"]>;
  private readonly broadcast?: (message: SyncStatusMessage) => void;

  constructor(options: ForegroundSyncEngineOptions) {
    this.backend = options.backend;
    this.repository = options.repository;
    this.lock = options.lock;
    this.now = options.now ?? (() => new Date());
    this.readAttachmentBytes = options.readAttachmentBytes;
    this.uploadBytes = options.uploadBytes ?? browserUpload;
    this.operationId = options.operationId ?? ((prefix) => `${prefix}-${crypto.randomUUID()}`);
    this.broadcast = options.broadcast;
  }

  async run(target: FieldSyncTarget, trigger: FieldSyncTrigger): Promise<SyncCycleReport> {
    const lockResult = await this.lock.request(
      `aviasurveil360-field-sync:${target.packageId}`,
      () => this.runAsOwner(target, trigger),
    );
    if (!lockResult.acquired || !lockResult.value) {
      const report: SyncCycleReport = {
        acquired: false,
        trigger,
        status: "contended",
        pushed: 0,
        pulled: 0,
        uploaded: 0,
        conflict: null,
        errorCode: "SYNC_OWNER_CONTENDED",
      };
      this.broadcast?.({ type: "field-sync-status", packageId: target.packageId, report });
      return report;
    }
    this.broadcast?.({ type: "field-sync-status", packageId: target.packageId, report: lockResult.value });
    return lockResult.value;
  }

  private async runAsOwner(
    target: FieldSyncTarget,
    trigger: FieldSyncTrigger,
  ): Promise<SyncCycleReport> {
    const report: SyncCycleReport = {
      acquired: true,
      trigger,
      status: "synchronized",
      pushed: 0,
      pulled: 0,
      uploaded: 0,
      conflict: null,
      errorCode: null,
    };
    await this.repository.recoverInterruptedOperations(target.packageId);
    await this.repository.releaseRetryableOperations(target.packageId, trigger === "manual");

    while (true) {
      const [next] = await this.repository.listDeliverableOperations(target.packageId);
      if (!next) break;
      const inFlight = await this.repository.markOperationInFlight(next.operationId);
      let result: PushFieldOperationResult;
      try {
        result = await this.backend.sync.pushOperation({ operation: inFlight.operation });
      } catch (error) {
        result = retryableResult(inFlight.operationId, this.now(), errorCode(error));
      }
      await this.repository.applyPushResult(inFlight.operationId, result);
      report.pushed += 1;
      if (result.status === "retryable") {
        report.status = "retryable";
        report.errorCode = result.errorCode;
        return report;
      }
      if (result.status === "conflict") {
        report.status = "conflict";
        report.conflict = result.conflict;
        report.errorCode = result.conflict?.code ?? result.errorCode;
        break;
      }
      if (result.status === "forbidden" || result.status === "invalid") {
        report.status = result.status;
        report.errorCode = result.errorCode;
        break;
      }
    }

    const uploadStatus = await this.uploadRegisteredAttachments(target.packageId);
    report.uploaded += uploadStatus.uploaded;
    if (uploadStatus.errorCode) {
      report.status = "retryable";
      report.errorCode = uploadStatus.errorCode;
      return report;
    }

    try {
      const state = await this.repository.getSyncState(target.packageId);
      if (!state || state.grantId !== target.offlineGrantId) {
        report.status = "forbidden";
        report.errorCode = "SYNC_STATE_SCOPE_MISMATCH";
        return report;
      }
      let cursor = state.cursor;
      while (true) {
        const page = await this.backend.sync.pull({
          packageId: target.packageId,
          offlineGrantId: target.offlineGrantId,
          cursor,
          limit: 100,
        });
        await this.repository.applyPullPage({
          packageId: target.packageId,
          grantId: target.offlineGrantId,
          expectedCursor: cursor,
          page,
        });
        report.pulled += page.changes.length;
        if (page.resnapshotRequired) {
          report.status = "resnapshot-required";
          report.errorCode = "RESNAPSHOT_REQUIRED";
          break;
        }
        cursor = page.nextCursor;
        if (!page.hasMore) break;
      }
    } catch (error) {
      if (error instanceof BackendAuthorizationInvariantError) {
        report.status = "forbidden";
        report.errorCode = "FORBIDDEN";
      } else if (report.status === "synchronized") {
        report.status = "retryable";
        report.errorCode = errorCode(error);
      }
    }
    return report;
  }

  private async uploadRegisteredAttachments(
    packageId: string,
  ): Promise<{ uploaded: number; errorCode: string | null }> {
    const manifests = await this.repository.listRegisteredAttachmentsReadyForUpload(packageId);
    let uploaded = 0;
    for (const candidate of manifests) {
      const manifest = await this.repository.beginRegisteredAttachmentUpload(candidate.attachmentId);
      try {
        if (
          !manifest.authoritativeEntityId ||
          !manifest.finalOpfsPath ||
          !manifest.sha256 ||
          !this.readAttachmentBytes
        ) {
          throw new Error("Registered Inspection Attachment bytes are unavailable.");
        }
        const bytes = await this.readAttachmentBytes(manifest.finalOpfsPath);
        if (bytes.byteLength !== manifest.observedByteSize) {
          throw new Error("Inspection Attachment byte size changed after staging.");
        }
        const begin = await this.backend.inspectionAttachments.beginUpload({
          operationId: this.operationId("OP-ATTACHMENT-BEGIN"),
          inspectionAttachmentId: manifest.authoritativeEntityId,
          packageId: manifest.packageId,
          byteSize: bytes.byteLength,
          sha256: manifest.sha256,
          fileName: manifest.fileName,
          declaredMediaType: manifest.declaredMediaType,
        });
        await this.uploadBytes(begin.uploadUrl, bytes, begin.requiredHeaders);
        const completed = await this.backend.inspectionAttachments.completeUpload({
          operationId: this.operationId("OP-ATTACHMENT-COMPLETE"),
          uploadId: begin.uploadId,
          sha256: manifest.sha256,
          byteSize: bytes.byteLength,
        });
        if (completed.inspectionAttachmentId !== manifest.authoritativeEntityId) {
          throw new Error("Inspection Attachment completion scope changed.");
        }
        await this.repository.acknowledgeUploadedAttachment({
          attachmentId: manifest.attachmentId,
          authoritativeEntityId: completed.inspectionAttachmentId,
          acknowledgedAt: this.now().toISOString(),
        });
        uploaded += 1;
      } catch (error) {
        const code = errorCode(error);
        await this.repository.markAttachmentUploadRetryable(manifest.attachmentId, code);
        return { uploaded, errorCode: code };
      }
    }
    return { uploaded, errorCode: null };
  }
}

interface BrowserLockManager {
  request<T>(
    name: string,
    options: { ifAvailable: true; mode: "exclusive" },
    callback: (lock: unknown | null) => Promise<T | undefined>,
  ): Promise<T | undefined>;
}

export function createBrowserSyncOwnerLock(): SyncOwnerLock | null {
  const browserNavigator = navigator as Navigator & { locks?: BrowserLockManager };
  if (!browserNavigator.locks) return null;
  return {
    request: async (name, callback) => {
      let acquired = false;
      const value = await browserNavigator.locks!.request(
        name,
        { ifAvailable: true, mode: "exclusive" },
        async (lock) => {
          if (!lock) return undefined;
          acquired = true;
          return callback();
        },
      );
      return { acquired, value };
    },
  };
}

export function createBrowserSyncBroadcast(): SyncStatusBroadcast | null {
  if (typeof BroadcastChannel === "undefined") return null;
  const channel = new BroadcastChannel("aviasurveil360-field-sync");
  return {
    broadcast: (message) => channel.postMessage(message),
    subscribe(listener) {
      const receive = (event: MessageEvent<SyncStatusMessage>) => {
        if (
          event.data?.type === "field-sync-status" &&
          typeof event.data.packageId === "string" &&
          event.data.report
        ) {
          listener(event.data);
        }
      };
      channel.addEventListener("message", receive);
      return () => channel.removeEventListener("message", receive);
    },
    close: () => channel.close(),
  };
}

export function installForegroundSyncTriggers(options: {
  eventTarget: EventTarget;
  documentTarget: EventTarget & { visibilityState: string };
  run(trigger: FieldSyncTrigger): void | Promise<void>;
  serviceWorker?: unknown;
}): { close(): void } {
  const invoke = (trigger: FieldSyncTrigger) => {
    void options.run(trigger);
  };
  const online = () => invoke("online");
  const appOpen = () => invoke("app-open");
  const foreground = () => {
    if (options.documentTarget.visibilityState === "visible") invoke("foreground");
  };
  const manual = () => invoke("manual");
  options.eventTarget.addEventListener("online", online);
  options.eventTarget.addEventListener("pageshow", appOpen);
  options.eventTarget.addEventListener("avia:manual-sync", manual);
  options.documentTarget.addEventListener("visibilitychange", foreground);
  invoke("startup");
  return {
    close() {
      options.eventTarget.removeEventListener("online", online);
      options.eventTarget.removeEventListener("pageshow", appOpen);
      options.eventTarget.removeEventListener("avia:manual-sync", manual);
      options.documentTarget.removeEventListener("visibilitychange", foreground);
    },
  };
}
