import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useApplicationRuntime } from "../../app/providers";
import { useScenario } from "../../app/scenario-context";
import { DueState } from "../../ui/workbench/due-state";
import { FactGrid } from "../../ui/workbench/fact-grid";
import { PageHeader } from "../../ui/workbench/page-header";
import { StatusPill } from "../../ui/workbench/status-pill";
import { CommandError, errorMessage, WorkspaceShell } from "../shared/workspace-shell";
import { OfflineReadinessPanel } from "./offline-readiness-panel";

const canonicalAuditDueDate = "2026-06-18";

export function AuditDetailPage() {
  const runtime = useApplicationRuntime();
  const { projection, actions } = useScenario();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void actions.loadPackage().catch((cause) => setError(errorMessage(cause)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const packageView = projection.packageView;
  const auditTitle = packageView?.title ?? "2026 Cabin Inspection - Fly Namibia";
  const checklistStatus = packageView?.checklistStatus ?? "IN_PROGRESS";
  const organizationName = packageView?.organizationName ?? "Fly Namibia";
  const packageId = packageView?.id ?? "PKG-CAB-2026-001";
  const checklistQuestionCount = packageView?.questions.length ?? 6;

  return (
    <WorkspaceShell roleLabel="CAA Inspector" routeLabel="Audit Detail">
      <PageHeader
        eyebrow="Cabin surveillance"
        title={auditTitle}
        description="Review the exact Audit package before entering checklist execution."
        facts={[
          { label: "Current owner", value: "CAA Inspector" },
          { label: "Next action", value: "Run assigned Cabin checklist" },
          { label: "Status", value: checklistStatus },
          { label: "Due Date", value: <DueState dueDate={canonicalAuditDueDate} today="2026-06-15" /> },
        ]}
      />
      <CommandError message={error} />
      <article className="inspector-dossier" data-testid="audit-dossier">
        <div className="inspector-dossier__head">
          <div>
            <p className="eyebrow">Audit</p>
            <h2 data-testid="audit-id">{packageView?.auditId ?? "AUD-2026-001"}</h2>
          </div>
          <StatusPill label={checklistStatus.replaceAll("_", " ")} tone="warning" />
        </div>
        <FactGrid
          items={[
            { label: "Organization", value: organizationName },
            { label: "Inspection type", value: "CABIN" },
            { label: "Status", value: checklistStatus },
            { label: "Assigned Inspector", value: "CAA Inspector" },
            { label: "Due Date", value: "Due Date: 18 Jun 2026" },
            { label: "Package", value: packageId },
            { label: "Checklist questions", value: String(checklistQuestionCount) },
            { label: "Offline eligibility", value: "Offline eligible" },
          ]}
        />
        <p className="inspector-dossier__summary">
          Package {packageId} contains {checklistQuestionCount} assigned Cabin questions. Offline
          checkout is available only for the active Inspector subject and preserves local edits
          until the server acknowledges them.
        </p>
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
