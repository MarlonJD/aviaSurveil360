import { useEffect, useMemo, useState } from "react";

import { useApplicationRuntime } from "../../app/providers";
import type { InspectionPackage } from "../../backend/backend";
import { CommandError, errorMessage, PageHeader, WorkspaceShell } from "../shared/workspace-shell";

export function ChecklistManagementPage() {
  const runtime = useApplicationRuntime();
  const backend = useMemo(() => runtime.backendForRole?.("manager") ?? runtime.backend, [runtime]);
  const [inspectionPackage, setInspectionPackage] = useState<InspectionPackage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void backend.inspections.getPackage({ packageId: "PKG-CAB-2026-001" }).then((loaded) => !cancelled && setInspectionPackage(loaded)).catch((cause) => !cancelled && setError(errorMessage(cause)));
    return () => { cancelled = true; };
  }, [backend]);

  return (
    <WorkspaceShell roleLabel="Department Manager" routeLabel="Checklist Management">
      <div className="manager-ops-page" data-testid="manager-checklist-management-page">
        <PageHeader eyebrow="Published configuration" title="Checklist Management" description="Inspect the exact published Checklist Template Version used by the Audit package. Configuration remains Admin-owned." />
        <CommandError message={error} />
        {inspectionPackage ? <div className="manager-ops-layout"><section aria-label="Published Checklist questions" className="manager-ops-register"><article className="manager-ops-card"><p className="eyebrow">Configured · Published · version {inspectionPackage.packageVersion}</p><h2>{inspectionPackage.title}</h2><p>{inspectionPackage.questions.length} configured questions</p></article>{inspectionPackage.questions.map((question) => <article className="manager-ops-card" key={question.id}><p className="eyebrow">{question.sectionId}</p><h3>{question.id}</h3><p>{question.prompt}</p><small>{question.expectedEvidence ?? "No expected Evidence configured"}</small></article>)}</section><section aria-label="Checklist configuration boundary" className="manager-ops-dossier"><p className="eyebrow">Read-only authority</p><h2>{inspectionPackage.templateVersionId}</h2><p>Package {inspectionPackage.id} binds this published version to {inspectionPackage.auditId}.</p><button aria-label={`Edit ${inspectionPackage.templateVersionId} unavailable`} disabled title={`Checklist Template Version ${inspectionPackage.templateVersionId} is published and no Department Manager draft-mutation command is declared in Plan 1.`} type="button">Edit unavailable</button></section></div> : null}
      </div>
    </WorkspaceShell>
  );
}
