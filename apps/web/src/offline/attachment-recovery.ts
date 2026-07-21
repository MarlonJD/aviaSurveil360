import type { AttachmentManifestRow } from "./db";
import type { IndexedDbFieldRepository } from "./field-repository";
import type { InspectionAttachmentHasher } from "./inspection-attachment-hash-worker";
import {
  inspectionAttachmentDirectory,
  type InspectionAttachmentFileSystem,
} from "./opfs-inspection-attachment-store";

export interface AttachmentRecoveryBlockingItem {
  attachmentId: string;
  code: "REFERENCED_BYTES_MISSING";
  message: string;
}

export interface AttachmentRecoveryReport {
  blocking: AttachmentRecoveryBlockingItem[];
  recoveredAttachmentIds: string[];
  quarantinedAttachmentIds: string[];
  quarantinedUnknownPaths: string[];
  deletedPaths: string[];
}

interface ReconcileInspectionAttachmentsInput {
  repository: IndexedDbFieldRepository;
  fileSystem: InspectionAttachmentFileSystem;
  hasher: InspectionAttachmentHasher;
}

function isFinalState(manifest: AttachmentManifestRow): boolean {
  return (
    manifest.stagingState === "ready" ||
    manifest.stagingState === "uploading" ||
    manifest.stagingState === "acknowledged" ||
    manifest.stagingState === "purge_eligible"
  );
}

async function presentPath(
  manifest: AttachmentManifestRow,
  fileSystem: InspectionAttachmentFileSystem,
): Promise<{ path: string; isTemporary: boolean } | null> {
  if (manifest.finalOpfsPath && (await fileSystem.exists(manifest.finalOpfsPath))) {
    return { path: manifest.finalOpfsPath, isTemporary: false };
  }
  if (manifest.temporaryOpfsPath && (await fileSystem.exists(manifest.temporaryOpfsPath))) {
    return { path: manifest.temporaryOpfsPath, isTemporary: true };
  }
  return null;
}

export async function reconcileInspectionAttachments(
  input: ReconcileInspectionAttachmentsInput,
): Promise<AttachmentRecoveryReport> {
  const report: AttachmentRecoveryReport = {
    blocking: [],
    recoveredAttachmentIds: [],
    quarantinedAttachmentIds: [],
    quarantinedUnknownPaths: [],
    deletedPaths: [],
  };
  const manifests = await input.repository.listAttachmentManifests();
  const referencedPaths = new Set<string>();
  for (const manifest of manifests) {
    if (manifest.temporaryOpfsPath) referencedPaths.add(manifest.temporaryOpfsPath);
    if (manifest.finalOpfsPath) referencedPaths.add(manifest.finalOpfsPath);
  }

  for (const manifest of manifests) {
    if (manifest.packageId === "__unknown__" || manifest.stagingState === "quarantined") continue;
    const available = await presentPath(manifest, input.fileSystem);
    if (!available) {
      await input.repository.markAttachmentRecovery(manifest.attachmentId, {
        state: "recovery_required",
        reason: "REFERENCED_BYTES_MISSING",
        localBytesPresent: false,
      });
      report.blocking.push({
        attachmentId: manifest.attachmentId,
        code: "REFERENCED_BYTES_MISSING",
        message: "Referenced Inspection Attachment bytes are missing; recovery is required.",
      });
      continue;
    }

    const bytes = await input.fileSystem.read(available.path);
    const sha256 = await input.hasher.sha256(bytes);
    const expectedSha256 = manifest.expectedSha256 ?? manifest.sha256;
    if (
      !expectedSha256 ||
      bytes.byteLength !== manifest.declaredByteSize ||
      sha256 !== expectedSha256
    ) {
      const reason = !expectedSha256
        ? "ATTACHMENT_SOURCE_DIGEST_MISSING"
        : bytes.byteLength !== manifest.declaredByteSize
          ? "ATTACHMENT_SIZE_MISMATCH"
          : "ATTACHMENT_HASH_MISMATCH";
      await input.repository.markAttachmentRecovery(manifest.attachmentId, {
        state: "quarantined",
        reason,
        localBytesPresent: true,
      });
      report.quarantinedAttachmentIds.push(manifest.attachmentId);
      continue;
    }

    if (isFinalState(manifest)) {
      if (available.isTemporary) {
        if (!manifest.temporaryOpfsPath || !manifest.finalOpfsPath) {
          await input.repository.markAttachmentRecovery(manifest.attachmentId, {
            state: "quarantined",
            reason: "ATTACHMENT_PATH_MISSING",
            localBytesPresent: true,
          });
          report.quarantinedAttachmentIds.push(manifest.attachmentId);
          continue;
        }
        await input.fileSystem.promote(manifest.temporaryOpfsPath, manifest.finalOpfsPath);
        report.recoveredAttachmentIds.push(manifest.attachmentId);
      }
      continue;
    }
    if (available.isTemporary) {
      if (!manifest.temporaryOpfsPath || !manifest.finalOpfsPath) {
        await input.repository.markAttachmentRecovery(manifest.attachmentId, {
          state: "quarantined",
          reason: "ATTACHMENT_PATH_MISSING",
          localBytesPresent: true,
        });
        report.quarantinedAttachmentIds.push(manifest.attachmentId);
        continue;
      }
      await input.fileSystem.promote(manifest.temporaryOpfsPath, manifest.finalOpfsPath);
    }
    await input.repository.commitReadyAttachment({
      attachmentId: manifest.attachmentId,
      observedByteSize: bytes.byteLength,
      sha256,
    });
    report.recoveredAttachmentIds.push(manifest.attachmentId);
  }

  const directory = inspectionAttachmentDirectory(input.repository.subjectId);
  const paths = await input.fileSystem.list(directory);
  for (const path of paths) {
    if (referencedPaths.has(path)) continue;
    const bytes = await input.fileSystem.read(path);
    const sha256 = await input.hasher.sha256(bytes);
    await input.repository.quarantineUnknownAttachmentPath({
      path,
      byteSize: bytes.byteLength,
      sha256,
    });
    report.quarantinedUnknownPaths.push(path);
  }
  report.blocking.sort((left, right) => left.attachmentId.localeCompare(right.attachmentId));
  report.recoveredAttachmentIds.sort();
  report.quarantinedAttachmentIds.sort();
  report.quarantinedUnknownPaths.sort();
  return report;
}
