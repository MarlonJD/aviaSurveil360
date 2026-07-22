import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useApplicationRuntime } from "../../app/providers";
import type { InspectionTeamAuditView } from "../../backend/backend";
import { CommandError, errorMessage, formatLocalDate, PageHeader, WorkspaceShell } from "../shared/workspace-shell";

const tabs = ["Overview", "Team Members", "Assignments", "Documents", "History"] as const;
type TeamTab = typeof tabs[number];

export function InspectionTeamPage() {
  const runtime = useApplicationRuntime();
  const backend = useMemo(() => runtime.backendForRole?.("manager") ?? runtime.backend, [runtime]);
  const [audits, setAudits] = useState<InspectionTeamAuditView[]>([]);
  const [selected, setSelected] = useState<InspectionTeamAuditView | null>(null);
  const [activeTab, setActiveTab] = useState<TeamTab>("Overview");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const teams = backend.teams;
    if (!teams) {
      setError("Inspection Team capability is unavailable in this build profile.");
      return () => { cancelled = true; };
    }
    void teams.listAuditTeams({}).then(({ items }) => {
      if (!cancelled) {
        setAudits(items);
        setSelected(null);
      }
    }).catch((cause) => !cancelled && setError(errorMessage(cause)));
    return () => { cancelled = true; };
  }, [backend]);

  const visible = audits.filter((audit) => {
    const people = [audit.leadInspector, ...audit.members].map((member) => `${member.subjectId} ${member.displayName}`).join(" ");
    return `${audit.auditId} ${audit.organizationId} ${audit.organizationName} ${audit.title} ${people}`.toLowerCase().includes(query.toLowerCase());
  });

  async function openAuditTeam(auditId: string): Promise<void> {
    if (!backend.teams) return;
    setError(null);
    try {
      setSelected(await backend.teams.openAuditTeam({ auditId }));
      setActiveTab("Overview");
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  const mutationReason = selected
    ? `Audit ${selected.auditId} has no declared Department Manager team-mutation command in Plan 1.`
    : "Select an Audit team.";

  return (
    <WorkspaceShell roleLabel="Department Manager" routeLabel="Inspection Team">
      <div className="manager-ops-page" data-testid="manager-inspection-team-page">
        <PageHeader eyebrow="Audit team ownership" title="Inspection Team" description="Review the typed Audit team register, exact schedule, Lead, assigned Inspectors, assignments, documents, and history." />
        <CommandError message={error} />
        <section aria-label="Team filters" className="manager-ops-filters"><label>Search Audit team<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label></section>
        <div className="manager-ops-layout">
          <section aria-label="Inspection Team register" className="manager-ops-register">
            {visible.map((audit) => (
              <article className="manager-ops-card" data-audit-id={audit.auditId} key={audit.auditId}>
                <div><p className="eyebrow">{audit.status}</p><h2>{audit.auditId}</h2><p>{audit.organizationName} · {audit.organizationId}</p></div>
                <dl>
                  <div><dt>Schedule</dt><dd>{formatLocalDate(audit.scheduledStartDate)} – {formatLocalDate(audit.scheduledEndDate)}</dd></div>
                  <div><dt>Lead</dt><dd>{audit.leadInspector.displayName} · {audit.leadInspector.subjectId}</dd></div>
                  <div><dt>Assigned members</dt><dd>{audit.members.length}</dd></div>
                </dl>
                <button onClick={() => void openAuditTeam(audit.auditId)} type="button">Open Inspection Team for {audit.auditId}</button>
              </article>
            ))}
          </section>
          {selected ? (
            <section aria-label={`Inspection Team for Audit ${selected.auditId}`} className="manager-ops-dossier">
              <p className="eyebrow">Exact Audit team dossier</p><h2>{selected.auditId}</h2><p>{selected.title} · {selected.organizationName} · {selected.organizationId}</p>
              <div aria-label="Inspection Team dossier sections" className="report-tabs" role="tablist">
                {tabs.map((tab) => <button aria-selected={activeTab === tab} key={tab} onClick={() => setActiveTab(tab)} role="tab" type="button">{tab}</button>)}
              </div>
              <div className="report-tab-panel" role="tabpanel">
                {activeTab === "Overview" ? <dl className="manager-ops-facts"><div><dt>Status</dt><dd>{selected.status}</dd></div><div><dt>Schedule</dt><dd>{formatLocalDate(selected.scheduledStartDate)} – {formatLocalDate(selected.scheduledEndDate)}</dd></div><div><dt>Lead Inspector</dt><dd>{selected.leadInspector.displayName} · {selected.leadInspector.subjectId}</dd></div><div><dt>Assigned Inspectors</dt><dd>{selected.members.map((member) => member.subjectId).join(", ") || "No typed Inspector assignments"}</dd></div><div><dt>Revision</dt><dd>{selected.revision}</dd></div></dl> : null}
                {activeTab === "Team Members" ? <ul><li>{selected.leadInspector.displayName} · {selected.leadInspector.subjectId} · Lead Inspector</li>{selected.members.map((member) => <li key={member.subjectId}>{member.displayName} · {member.subjectId} · CAA Inspector</li>)}</ul> : null}
                {activeTab === "Assignments" ? selected.assignments.length ? <ul>{selected.assignments.map((assignment) => <li key={assignment.questionId}><b>{assignment.questionId}</b> · {assignment.assignedMemberSubjectIds.join(", ")}</li>)}</ul> : <p>Audit {selected.auditId} has no typed question assignments.</p> : null}
                {activeTab === "Documents" ? selected.documents.length ? <ul>{selected.documents.map((document) => <li key={document.id}><b>{document.id}</b> · {document.title} · Version {document.version}</li>)}</ul> : <p>Audit {selected.auditId} has no typed documents.</p> : null}
                {activeTab === "History" ? <ul>{selected.history.map((event) => <li key={event.eventId}><b>{event.action}</b> · {event.detail} · {event.actorSubjectId}</li>)}</ul> : null}
              </div>
              <div className="manager-record-actions">
                <Link to={`/department-manager/audits?auditId=${selected.auditId}`}>Open Audit {selected.auditId}</Link>
                <button aria-label={`Edit Inspection Team for ${selected.auditId} unavailable`} disabled title={mutationReason} type="button">Edit team unavailable</button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </WorkspaceShell>
  );
}
