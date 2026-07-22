import { useEffect, useMemo, useState } from "react";

import { useApplicationRuntime } from "../../app/providers";
import type { DocumentMetadataView } from "../../backend/backend";
import { CommandError, errorMessage, WorkspaceShell } from "../shared/workspace-shell";

function downloadDocument(document: DocumentMetadataView, onDone: (value: string) => void) {
  const fileName = document.downloadFileName ?? document.title;
  const content = `AviaSurveil360 browser-local demo artifact\nDocument: ${document.id}\nVersion: ${document.version}\nReview result: ${document.publicReviewResult ?? "Not available"}`;
  const url = URL.createObjectURL(new Blob([content], { type: document.kind === "REPORT" ? "application/pdf" : "text/plain" }));
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  onDone(`${fileName} downloaded for exact document ${document.id}, version ${document.version}. Browser-local demo artifact only.`);
}

export function AuditeeDocumentsPage() {
  const runtime = useApplicationRuntime();
  const backend = useMemo(() => runtime.backendForRole?.("auditee") ?? runtime.backend, [runtime]);
  const [documents, setDocuments] = useState<DocumentMetadataView[]>([]);
  const [kind, setKind] = useState<"ALL" | DocumentMetadataView["kind"]>("ALL");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!backend.documents) return;
    let cancelled = false;
    void backend.documents.list({ organizationId: "ORG-FLY-NAMIBIA" }).then((output) => {
      if (!cancelled) setDocuments(output.items);
    }).catch((cause) => !cancelled && setError(errorMessage(cause)));
    return () => { cancelled = true; };
  }, [backend]);
  const filtered = documents.filter((document) => (kind === "ALL" || document.kind === kind) && `${document.id} ${document.title}`.toLowerCase().includes(query.toLowerCase()));
  async function openAndDownload(document: DocumentMetadataView) {
    if (!backend.documents) return;
    try {
      const exact = await backend.documents.open({ documentId: document.id });
      downloadDocument(exact, setStatus);
      setError(null);
    } catch (cause) { setError(errorMessage(cause)); }
  }
  return <WorkspaceShell roleLabel="Auditee — Fly Namibia" routeLabel="Documents">
    <div className="auditee-secondary-page auditee-documents-page" data-testid="auditee-documents-page">
      <header className="auditee-secondary-head workbench-page-header"><div><span>Fly Namibia · ORG-FLY-NAMIBIA</span><h1>Documents</h1><p>Released Reports and submitted Evidence appear with exact immutable versions and public review results.</p></div></header>
      <p className="auditee-safe-boundary">Filename-only browser downloads; no real storage, signature, or official delivery.</p>
      <CommandError message={error} />
      {status ? <p className="auditee-action-result" role="status">{status}</p> : null}
      <section className="auditee-secondary-filters" aria-label="Document filters"><label>Document type<select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="ALL">All documents</option><option value="REPORT">Reports</option><option value="EVIDENCE">Evidence</option></select></label><label>Search exact document<input value={query} onChange={(event) => setQuery(event.target.value)} /></label></section>
      <section className="auditee-document-register" aria-label="Auditee documents"><div className="responsive-table-shell"><table><thead><tr><th>Document</th><th>Type</th><th>Version</th><th>Review result</th><th>Action</th></tr></thead><tbody>{filtered.map((document) => <tr key={document.id}><td><b>{document.id}</b><small>{document.title}</small></td><td>{document.kind === "REPORT" ? "Released Report" : "Evidence"}</td><td>Version {document.version}</td><td>{document.publicReviewResult ?? "Not available"}</td><td>{document.downloadFileName ? <button onClick={() => void openAndDownload(document)} type="button">Download {document.id}</button> : <button aria-label={`Download ${document.id} unavailable`} disabled title={`${document.id} has no browser-local filename in this projection.`} type="button">Download unavailable</button>}</td></tr>)}</tbody></table></div>{!filtered.length ? <p>No safe documents match this filter.</p> : null}</section>
    </div>
  </WorkspaceShell>;
}
