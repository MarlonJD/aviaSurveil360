import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useScenario } from "../../app/scenario-context";
import {
  CommandError,
  errorMessage,
  FindingFacts,
  PageHeader,
  WorkspaceShell,
} from "../shared/workspace-shell";

export function ReportPreviewPage() {
  const { projection, actions } = useScenario();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      actions.loadReport("manager"),
      actions.refreshFinding("manager"),
    ]).catch((cause) => setError(errorMessage(cause)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WorkspaceShell roleLabel="Department Manager" routeLabel="Report Preview">
      <PageHeader
        eyebrow="Locked candidate report"
        title="Cabin Inspection Report Preview"
        description="This preview reads the locked report version and the current server-shaped Finding projection."
      />
      <CommandError message={error} />
      <article className="surface-card report-preview">
        <div className="card-heading">
          <div><p className="eyebrow">{projection.report?.reportVersionId}</p><h2>Fly Namibia · AUD-2026-001</h2></div>
          <span className="status-pill" data-testid="report-status">{projection.report?.status}</span>
        </div>
        {projection.finding ? (
          <>
            <FindingFacts finding={projection.finding} />
            <div className="report-conclusion">
              <span data-testid="report-finding-status">{projection.finding.status}</span>
              <strong>{projection.finding.closureBasis === "EVIDENCE_VERIFIED" ? "Evidence accepted and verified" : "Finding remains open"}</strong>
            </div>
          </>
        ) : null}
        <Link className="primary-link" to="/auditee/service-provider-cap">
          View as Fly Namibia Auditee
        </Link>
      </article>
    </WorkspaceShell>
  );
}
