import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useScenario } from "../../app/scenario-context";
import {
  CommandError,
  errorMessage,
  PageHeader,
  StatusPill,
  WorkspaceShell,
} from "../shared/workspace-shell";

export function InspectorAssignmentsPage() {
  const { projection, actions } = useScenario();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void actions.loadAssignments().catch((cause) => setError(errorMessage(cause)));
    // The injected Backend instance is fixed for the lifetime of this candidate shell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WorkspaceShell roleLabel="CAA Inspector" routeLabel="My Assignments">
      <PageHeader
        eyebrow="Inspection execution"
        title="My Assignments"
        description="Open the exact assigned Audit and continue its Cabin Inspection checklist."
      />
      <CommandError message={error} />
      <section className="card-grid" aria-label="Assigned Audits">
        {projection.assignments.map((assignment) => (
          <article className="surface-card" key={assignment.auditId}>
            <div className="card-heading">
              <div>
                <p className="eyebrow">{assignment.auditId}</p>
                <h2>{assignment.title}</h2>
              </div>
              <StatusPill>{assignment.dueState.replaceAll("_", " ")}</StatusPill>
            </div>
            <p>{assignment.nextAction}</p>
            <dl className="compact-facts">
              <div><dt>Organization</dt><dd>{assignment.organizationName}</dd></div>
              <div><dt>Status</dt><dd>{assignment.status}</dd></div>
              <div><dt>Due Date</dt><dd>{assignment.dueDate ?? "Not set"}</dd></div>
            </dl>
            <Link className="primary-link" to="/inspector/audits/AUD-2026-001">
              Open Cabin Inspection
            </Link>
          </article>
        ))}
      </section>
    </WorkspaceShell>
  );
}
