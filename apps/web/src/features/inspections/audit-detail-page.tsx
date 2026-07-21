import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useApplicationRuntime } from "../../app/providers";
import { useScenario } from "../../app/scenario-context";
import {
  CommandError,
  errorMessage,
  PageHeader,
  StatusPill,
  WorkspaceShell,
} from "../shared/workspace-shell";
import { OfflineReadinessPanel } from "./offline-readiness-panel";

export function AuditDetailPage() {
  const runtime = useApplicationRuntime();
  const { projection, actions } = useScenario();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void actions.loadPackage().catch((cause) => setError(errorMessage(cause)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const packageView = projection.packageView;

  return (
    <WorkspaceShell roleLabel="CAA Inspector" routeLabel="Audit Detail">
      <PageHeader
        eyebrow="Cabin surveillance"
        title={packageView?.title ?? "Cabin Inspection"}
        description="Review the exact Audit package before entering checklist execution."
      />
      <CommandError message={error} />
      <article className="surface-card detail-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">Audit</p>
            <h2 data-testid="audit-id">{packageView?.auditId ?? "AUD-2026-001"}</h2>
          </div>
          <StatusPill>{packageView?.checklistStatus ?? "IN_PROGRESS"}</StatusPill>
        </div>
        <dl className="fact-grid">
          <div><dt>Organization</dt><dd>{packageView?.organizationName ?? "Fly Namibia"}</dd></div>
          <div><dt>Package</dt><dd>{packageView?.id ?? "PKG-CAB-2026-001"}</dd></div>
          <div><dt>Checklist questions</dt><dd>{packageView?.questions.length ?? 6}</dd></div>
          <div><dt>Next action</dt><dd>Run assigned Cabin checklist</dd></div>
        </dl>
        <Link className="primary-link" to="/inspector/audits/AUD-2026-001/checklist">
          Run Cabin checklist
        </Link>
      </article>
      {packageView ? (
        <OfflineReadinessPanel
          inspectionPackage={packageView}
          subjectId={runtime.subjectId ?? "USR-INSPECTOR-AMINA"}
        />
      ) : null}
    </WorkspaceShell>
  );
}
