import { useEffect, useState } from "react";

import { useBackendForRole } from "../../app/providers";
import type {
  AuditEventView,
  ChecklistTemplateVersionView,
  ReminderRuleView,
} from "../../backend/backend";
import {
  CommandError,
  errorMessage,
  PageHeader,
  StatusPill,
  WorkspaceShell,
} from "../shared/workspace-shell";

export function AdminConfigurationPage() {
  const backend = useBackendForRole("admin");
  const [templates, setTemplates] = useState<ChecklistTemplateVersionView[]>([]);
  const [rules, setRules] = useState<ReminderRuleView[]>([]);
  const [events, setEvents] = useState<AuditEventView[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      backend.configuration.listChecklistTemplateVersions({ limit: 100 }),
      backend.configuration.listReminderRules({ limit: 100 }),
      backend.auditTrail.list({ entityType: "SURVEILLANCE_PLAN", entityId: "PLAN-2026-CAB-001", limit: 100 }),
    ])
      .then(([templateOutput, ruleOutput, eventOutput]) => {
        setTemplates(templateOutput.items);
        setRules(ruleOutput.items);
        setEvents(eventOutput.items);
      })
      .catch((cause) => setError(errorMessage(cause)));
  }, [backend]);

  return (
    <WorkspaceShell roleLabel="Admin Preview" routeLabel="Templates">
      <PageHeader
        eyebrow="Versioned configuration"
        title="Admin Configuration Preview"
        description="Preview published checklist versions and deterministic Due Date reminder rules. Editing and broad regulatory authoring remain outside this slice."
      />
      <CommandError message={error} />
      <section className="card-grid">
        {templates.map((template) => (
          <article className="surface-card" key={template.id}>
            <div className="card-heading"><div><p className="eyebrow">{template.templateId}</p><h2>{template.title}</h2></div><StatusPill>{template.status}</StatusPill></div>
            <dl className="compact-facts">
              <div><dt>Version</dt><dd data-testid="template-version">Version {template.version}</dd></div>
              <div><dt>Questions</dt><dd>{template.questionCount}</dd></div>
              <div><dt>Published</dt><dd>{template.publishedAt.slice(0, 10)}</dd></div>
            </dl>
          </article>
        ))}
        <article className="surface-card">
          <div className="card-heading"><h2>Due Date reminder rules</h2><StatusPill>ACTIVE</StatusPill></div>
          <ul className="route-list compact-list">
            {rules.map((rule) => (
              <li data-testid="reminder-rule-row" key={rule.id}>
                <strong>{rule.label}</strong><span>{rule.channel}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
      <article className="surface-card audit-trail-card">
        <div className="card-heading"><div><p className="eyebrow">Append-only record</p><h2>Planning Audit Trail</h2></div><StatusPill>{events.length} events</StatusPill></div>
        {events.length ? (
          <ol className="route-list compact-list">
            {events.map((event) => (
              <li data-testid="audit-event-row" key={event.eventId}>
                <strong>{event.action}</strong>
                <span>{event.beforeStatus} → {event.afterStatus}</span>
                <small>{event.reason}</small>
              </li>
            ))}
          </ol>
        ) : <p>No planning decisions have been recorded in this candidate session.</p>}
      </article>
    </WorkspaceShell>
  );
}
