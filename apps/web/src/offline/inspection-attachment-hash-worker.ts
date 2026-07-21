export interface InspectionAttachmentHasher {
  sha256(bytes: Uint8Array): Promise<string>;
}

interface HashWorkerRequest {
  id: string;
  bytes: ArrayBuffer;
}

interface HashWorkerResponse {
  id: string;
  sha256?: string;
  error?: string;
}

function bytesToHex(value: ArrayBuffer): string {
  return Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256InspectionAttachment(bytes: Uint8Array): Promise<string> {
  const copy = Uint8Array.from(bytes);
  const digest = await crypto.subtle.digest("SHA-256", copy.buffer);
  return `sha256:${bytesToHex(digest)}`;
}

export class DedicatedInspectionAttachmentHasher implements InspectionAttachmentHasher {
  async sha256(bytes: Uint8Array): Promise<string> {
    const worker = new Worker(new URL("./inspection-attachment-hash-worker.ts", import.meta.url), {
      type: "module",
      name: "aviasurveil360-inspection-attachment-hash",
    });
    const id = crypto.randomUUID();
    const copy = Uint8Array.from(bytes);
    try {
      return await new Promise<string>((resolve, reject) => {
        worker.addEventListener("message", (event: MessageEvent<HashWorkerResponse>) => {
          if (event.data.id !== id) return;
          if (event.data.error || !event.data.sha256) {
            reject(new Error(event.data.error ?? "Attachment hash worker returned no digest."));
            return;
          }
          resolve(event.data.sha256);
        });
        worker.addEventListener("error", (event) => {
          reject(new Error(event.message || "Attachment hash worker failed."));
        });
        const request: HashWorkerRequest = { id, bytes: copy.buffer };
        worker.postMessage(request, [request.bytes]);
      });
    } finally {
      worker.terminate();
    }
  }
}

const possibleWorkerScope = globalThis as typeof globalThis & {
  postMessage?: (message: HashWorkerResponse) => void;
};

if (
  typeof document === "undefined" &&
  typeof possibleWorkerScope.addEventListener === "function" &&
  typeof possibleWorkerScope.postMessage === "function"
) {
  possibleWorkerScope.addEventListener(
    "message",
    (event: Event) => {
      const message = event as MessageEvent<HashWorkerRequest>;
      const request = message.data;
      if (!request || typeof request.id !== "string" || !(request.bytes instanceof ArrayBuffer)) {
        return;
      }
      void sha256InspectionAttachment(new Uint8Array(request.bytes))
        .then((sha256) => possibleWorkerScope.postMessage?.({ id: request.id, sha256 }))
        .catch((error) =>
          possibleWorkerScope.postMessage?.({
            id: request.id,
            error: error instanceof Error ? error.message : "Attachment hashing failed.",
          }),
        );
    },
  );
}
