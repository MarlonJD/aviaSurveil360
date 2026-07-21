import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

import { useScenario } from "../../app/scenario-context";
import { DataRegister, type DataRegisterColumn } from "../../ui/workbench/data-register";
import { DueState } from "../../ui/workbench/due-state";
import { PageHeader } from "../../ui/workbench/page-header";
import { StatusPill, type StatusPillTone } from "../../ui/workbench/status-pill";
import { CommandError, errorMessage, WorkspaceShell } from "../shared/workspace-shell";

interface AssignmentRegisterRow extends Record<string, ReactNode> {
  audit: ReactNode;
  organization: ReactNode;
  status: ReactNode;
  dueDate: ReactNode;
  dueState: ReactNode;
  nextAction: ReactNode;
  rowId: string;
}

const assignmentColumns: readonly DataRegisterColumn<AssignmentRegisterRow>[] = [
  { key: "audit", header: "Audit" },
  { key: "organization", header: "Organization" },
  { key: "status", header: "Status" },
  { key: "dueDate", header: "Due Date" },
  { key: "dueState", header: "Due state" },
  { key: "nextAction", header: "Next action" },
];

function statusTone(status: string): StatusPillTone {
  if (status.includes("SUBMITTED") || status.includes("COMPLETED")) return "success";
  if (status.includes("OVERDUE")) return "danger";
  if (status.includes("IN_PROGRESS")) return "warning";
  return "neutral";
}

function formatStatus(value: string): string {
  return value.replaceAll("_", " ");
}

export function InspectorAssignmentsPage() {
  const { projection, actions } = useScenario();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void actions.loadAssignments().catch((cause) => setError(errorMessage(cause)));
    // The injected Backend instance is fixed for the lifetime of this candidate shell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dueSoonCount = projection.assignments.filter(
    (assignment) => assignment.dueState === "DUE_SOON",
  ).length;
  const inProgressCount = projection.assignments.filter(
    (assignment) => assignment.status === "IN_PROGRESS",
  ).length;
  const primaryAssignment = projection.assignments[0] ?? null;
  const rows = useMemo<AssignmentRegisterRow[]>(
    () =>
      projection.assignments.map((assignment) => ({
        rowId: assignment.auditId,
        audit: assignment.auditId,
        organization: assignment.organizationName,
        status: (
          <StatusPill
            label={formatStatus(assignment.status)}
            tone={statusTone(assignment.status)}
          />
        ),
        dueDate: assignment.dueDate ?? "Not set",
        dueState: <DueState dueDate={assignment.dueDate} today="2026-06-15" />,
        nextAction: (
          <span className="inspector-register-action">
            <span>{assignment.nextAction}</span>
            <Link className="primary-link" to="/inspector/audits/AUD-2026-001">
              Open Cabin Inspection
            </Link>
          </span>
        ),
      })),
    [projection.assignments],
  );

  return (
    <WorkspaceShell roleLabel="CAA Inspector" routeLabel="My Assignments">
      <PageHeader
        eyebrow="Inspection execution"
        title="My Assignments"
        description="Open the exact assigned Audit and continue its Cabin Inspection checklist."
        facts={[
          { label: "Current owner", value: "CAA Inspector" },
          { label: "Open assignments", value: String(projection.assignments.length) },
          { label: "In progress", value: String(inProgressCount) },
          { label: "Due Soon", value: String(dueSoonCount) },
        ]}
      />
      <CommandError message={error} />
      <section className="inspector-attention-strip" aria-label="Assignment attention">
        <div className="inspector-attention-tile">
          <span>Ready to inspect</span>
          <strong>{projection.assignments.length}</strong>
        </div>
        <div className="inspector-attention-tile inspector-attention-tile--warning">
          <span>Due Soon</span>
          <strong>{dueSoonCount}</strong>
        </div>
        <div className="inspector-attention-tile">
          <span>Next action</span>
          <strong>{primaryAssignment?.title ?? "Start Cabin checklist"}</strong>
        </div>
      </section>
      <section className="inspector-register" aria-label="Assigned Audits">
        <DataRegister
          caption="Assigned Audits"
          columns={assignmentColumns}
          rowKey={(row) => row.rowId}
          rows={rows}
        />
      </section>
    </WorkspaceShell>
  );
}
