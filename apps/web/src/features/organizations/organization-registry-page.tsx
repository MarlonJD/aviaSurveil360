import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useBackendForRole } from "../../app/providers";
import type { OrganizationSummary } from "../../backend/backend";
import {
  CommandError,
  errorMessage,
  PageHeader,
  StatusPill,
  WorkspaceShell,
} from "../shared/workspace-shell";

export function OrganizationRegistryPage() {
  const backend = useBackendForRole("manager");
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void backend.organizations
      .list({ limit: 100 })
      .then((output) => setOrganizations(output.items))
      .catch((cause) => setError(errorMessage(cause)));
  }, [backend]);

  return (
    <WorkspaceShell roleLabel="Department Manager" routeLabel="Organization Registry">
      <PageHeader
        eyebrow="Oversight entities"
        title="Organization Registry"
        description="View operator identity, current oversight activity, and open Finding counts without exposing internal CAA notes."
        action={<Link className="primary-link" to="/department-manager/audit-plan">Open Audit Plan Calendar</Link>}
      />
      <CommandError message={error} />
      <section className="route-list" aria-label="Organizations">
        {organizations.map((organization) => (
          <article className="surface-card route-list__item" data-testid="organization-row" key={organization.id}>
            <div className="card-heading">
              <div><p className="eyebrow">{organization.id}</p><h2>{organization.legalName}</h2></div>
              <StatusPill>{organization.status}</StatusPill>
            </div>
            <dl className="compact-facts">
              <div><dt>Organization type</dt><dd>{organization.organizationType}</dd></div>
              <div><dt>Open Findings</dt><dd>{organization.openFindingCount}</dd></div>
              <div><dt>Next Audit</dt><dd>{organization.nextAuditDate ?? "Not scheduled"}</dd></div>
            </dl>
          </article>
        ))}
      </section>
    </WorkspaceShell>
  );
}
