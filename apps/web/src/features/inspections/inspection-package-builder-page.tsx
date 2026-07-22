import { useEffect, useMemo, useState } from "react";

import { useApplicationRuntime } from "../../app/providers";
import type { InspectionPackageDraftView } from "../../backend/backend";
import { CommandError, errorMessage, PageHeader, WorkspaceShell } from "../shared/workspace-shell";

const PACKAGE_DRAFT_ID = "PKG-AUD-2026-001-CABIN";

export function InspectionPackageBuilderPage() {
  const runtime = useApplicationRuntime();
  const backend = useMemo(() => runtime.backendForRole?.("manager") ?? runtime.backend, [runtime]);
  const [draft, setDraft] = useState<InspectionPackageDraftView | null>(null);
  const [riskFocus, setRiskFocus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!backend.packageDrafts) {
      setError("Inspection Package draft commands are unavailable in this build profile.");
      return () => { cancelled = true; };
    }
    void backend.packageDrafts.get({ packageDraftId: PACKAGE_DRAFT_ID }).then((loaded) => {
      if (!cancelled) { setDraft(loaded); setRiskFocus(loaded.riskFocus.join(", ")); }
    }).catch((cause) => !cancelled && setError(errorMessage(cause)));
    return () => { cancelled = true; };
  }, [backend]);

  async function save() {
    if (!backend.packageDrafts || !draft) return;
    setError(null); setSavedMessage(null);
    try {
      const saved = await backend.packageDrafts.save({
        packageDraftId: draft.id,
        expectedRevision: draft.revision,
        idempotencyKey: `SAVE-${draft.id}-R${draft.revision}`,
        riskFocus: riskFocus.split(","),
      });
      setDraft(saved); setRiskFocus(saved.riskFocus.join(", ")); setSavedMessage(`Saved revision ${saved.revision}`);
    } catch (cause) { setError(errorMessage(cause)); }
  }

  return (
    <WorkspaceShell roleLabel="Department Manager" routeLabel="Inspection Package Builder">
      <div className="inspection-package-builder-page planning-intake-page" data-testid={draft ? "inspection-package-builder-page" : undefined}>
        <PageHeader eyebrow="Package governance" title="Dynamic Inspection Package Builder" description="Build an Inspection Package and understand why each configured question is included." />
        <div className="manager-intelligence-boundary" role="note"><b>Package Draft.</b> Demo-only configured references; not an official checklist publication.</div>
        <CommandError message={error} />{savedMessage ? <p role="status">{savedMessage}</p> : null}
        {draft ? <div className="inspection-package-layout"><section className="inspection-package-draft"><header><div><p className="eyebrow">Package Draft · version {draft.packageVersion}</p><h2>{draft.id}</h2></div><span>{draft.status} · revision {draft.revision}</span></header><dl><div><dt>Source Audit</dt><dd>{draft.sourceAuditId}</dd></div><div><dt>Organization</dt><dd>{draft.organizationName} · {draft.organizationId}</dd></div><div><dt>Application type</dt><dd>{draft.applicationType}</dd></div><div><dt>Domain</dt><dd>{draft.domain}</dd></div></dl><label>Risk focus<textarea aria-label="Risk focus" value={riskFocus} onChange={(event) => setRiskFocus(event.target.value)} /></label><button onClick={() => void save()} type="button">Save package draft</button><div className="inspection-package-questions"><h2>Proposed checklist questions</h2>{draft.questions.map((question) => <article key={question.id}><p className="eyebrow">{question.id}</p><h3>{question.prompt}</h3><p><b>Why included:</b> {question.whyIncluded}</p><p><b>Expected Evidence:</b> {question.expectedEvidence.join(", ")}</p><small>{question.configuredReference}</small></article>)}</div></section><aside className="inspection-package-focus"><h2>Risk Focus</h2>{draft.riskFocus.map((item) => <span key={item}>{item}</span>)}<button aria-label={`Runnable checklist unavailable for ${draft.sourceAuditId}`} disabled title={`Runnable checklist for ${draft.sourceAuditId} requires assigned CAA Inspector authority.`} type="button">Open runnable checklist</button></aside></div> : null}
      </div>
    </WorkspaceShell>
  );
}
