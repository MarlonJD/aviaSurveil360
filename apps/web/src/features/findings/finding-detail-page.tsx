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

export function FindingDetailPage() {
  const { projection, actions } = useScenario();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void actions.refreshFinding("leadInspector").catch((cause) => setError(errorMessage(cause)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WorkspaceShell roleLabel="Lead Inspector" routeLabel="Finding Detail">
      <PageHeader
        eyebrow="Finding lifecycle"
        title="Finding dossier"
        description="Owner, next action, Due Date, status, severity, related Audit, and organization remain visible together."
      />
      <CommandError message={error} />
      {projection.finding ? (
        <article className="surface-card detail-card" data-testid="finding-dossier">
          <div className="card-heading">
            <div>
              <p className="eyebrow">{projection.finding.id}</p>
              <h2>{projection.finding.findingNumber}</h2>
            </div>
            <span className="status-pill">{projection.finding.status}</span>
          </div>
          <p>{projection.finding.title}</p>
          <FindingFacts finding={projection.finding} />
          <Link className="primary-link" to="/auditee/service-provider-cap">
            Switch to Fly Namibia Auditee
          </Link>
        </article>
      ) : <p>Finding unavailable.</p>}
    </WorkspaceShell>
  );
}
