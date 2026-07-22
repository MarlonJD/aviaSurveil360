import { useEffect, useMemo, useState } from "react";

import { useApplicationRuntime } from "../../app/providers";
import type { CommunicationView, NotificationView, Role } from "../../backend/backend";
import { CommandError, errorMessage, WorkspaceShell } from "../shared/workspace-shell";

interface MessageCenterProjection {
  role: Role;
  roleLabel: string;
  routeLabel: string;
  scopeLabel: string;
  testId: string;
  auditeeOnly?: boolean;
}

const inspectorProjection: MessageCenterProjection = { role: "inspector", roleLabel: "CAA Inspector", routeLabel: "Messages", scopeLabel: "CAA Inspector workspace only", testId: "inspector-messages-page" };
const leadProjection: MessageCenterProjection = { role: "leadInspector", roleLabel: "Lead Inspector", routeLabel: "Lead Messages", scopeLabel: "Lead Inspector CAA workspace only", testId: "lead-messages-page" };
const auditeeProjection: MessageCenterProjection = { role: "auditee", roleLabel: "Auditee — Fly Namibia", routeLabel: "Auditee Messages", scopeLabel: "Fly Namibia · ORG-FLY-NAMIBIA", testId: "auditee-messages-page", auditeeOnly: true };

export function MessageCenterPage({ projection }: { projection: MessageCenterProjection }) {
  const runtime = useApplicationRuntime();
  const backend = useMemo(() => runtime.backendForRole?.(projection.role) ?? runtime.backend, [projection.role, runtime]);
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [communications, setCommunications] = useState<CommunicationView[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"CAA" | "AUDITEE">("CAA");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!backend.communications || (!projection.auditeeOnly && !backend.notifications)) return;
    let cancelled = false;
    void Promise.all([
      projection.auditeeOnly ? Promise.resolve({ items: [] as NotificationView[], nextCursor: null }) : backend.notifications!.list({}),
      backend.communications.list(projection.auditeeOnly ? { organizationId: "ORG-FLY-NAMIBIA" } : {}),
    ]).then(([nextNotifications, nextCommunications]) => {
      if (!cancelled) { setNotifications(nextNotifications.items); setCommunications(nextCommunications.items); }
    }).catch((cause) => !cancelled && setError(errorMessage(cause)));
    return () => { cancelled = true; };
  }, [backend]);

  async function sendMessage() {
    if (!backend.communications) return;
    try {
      const sent = await backend.communications.send({
        expectedRevision: null,
        idempotencyKey: `MSG-${projection.role}-${communications.length + 1}`,
        organizationId: projection.auditeeOnly ? "ORG-FLY-NAMIBIA" : audience === "AUDITEE" ? "ORG-FLY-NAMIBIA" : null,
        subject,
        body,
        audience: projection.auditeeOnly ? "CAA" : audience,
      });
      setCommunications((items) => [...items, sent]);
      setComposeOpen(false);
      setStatus("Message recorded in the demo workspace.");
    } catch (cause) { setError(errorMessage(cause)); }
  }

  return <WorkspaceShell roleLabel={projection.roleLabel} routeLabel={projection.routeLabel}>
    <div className="inspector-secondary-page inspector-messages-page" data-testid={projection.testId}>
      <header className="inspector-secondary-head workbench-page-header"><div><h1>Messages from the CAA</h1><p>{projection.auditeeOnly ? "Auditee-visible communication only — messages are scoped to Fly Namibia." : "In-app notifications (mock — no real email or SMS is sent)."}</p></div><button className="inspector-secondary-button" onClick={() => setComposeOpen((open) => !open)} type="button">{projection.auditeeOnly ? "Compose message to CAA" : "Compose message"}</button></header>
      <p className="inspector-scope-note">🔒 {projection.scopeLabel}</p>
      <CommandError message={error} />
      {composeOpen ? <section className="inspector-compose-panel">{projection.auditeeOnly ? <p>To: CAA · exact organization scope ORG-FLY-NAMIBIA</p> : <label>Visibility<select aria-label="Visibility" value={audience} onChange={(event) => setAudience(event.target.value as typeof audience)}><option value="CAA">Internal CAA Note</option><option value="AUDITEE">Comment to Auditee</option></select></label>}<label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} /></label><label>Message<textarea value={body} onChange={(event) => setBody(event.target.value)} /></label><button className="inspector-secondary-button inspector-secondary-button--primary" onClick={() => void sendMessage()} type="button">Send in-app message</button></section> : null}
      {status ? <p className="inspector-action-result" role="status">{status}</p> : null}
      {projection.auditeeOnly ? <section className="inspector-message-list auditee-message-list" aria-label="Auditee-visible communication">
        {communications.map((item) => <article key={item.id}><div><h2>{item.subject}</h2><p>{item.body}</p><small>{item.direction === "AUDITEE_TO_CAA" ? "Sent by Fly Namibia to CAA" : "Received from CAA"} · {item.organizationId}</small></div><span>{item.direction === "AUDITEE_TO_CAA" ? "Sent" : "Received"}</span></article>)}
        {!communications.length ? <p>No Auditee-visible messages are recorded.</p> : null}
      </section> : <><section className="inspector-message-list" aria-label="Internal CAA Note messages">
        {notifications.map((item) => <article key={item.id}><div><h2>{item.title}</h2><p>{item.body}</p><small>{item.id} · related CAA request where applicable</small></div><span>{item.readAt ? "Read" : "Unread"}</span></article>)}
        {communications.filter((item) => item.audience === "CAA").map((item) => <article key={item.id}><div><h2>{item.subject}</h2><p>{item.body}</p><small>Internal CAA Note · CAA-only</small></div><span>Sent</span></article>)}
      </section>
      <section className="inspector-message-list" aria-label="Comment to Auditee messages">
        <h2>Comment to Auditee</h2>
        <p>Only explicitly auditee-visible messages appear here; Internal CAA Notes remain separate.</p>
        {communications.filter((item) => item.audience === "AUDITEE").map((item) => <article key={item.id}><div><h2>{item.subject}</h2><p>{item.body}</p><small>Comment to Auditee · {item.organizationId}</small></div><span>Sent</span></article>)}
      </section></>}
    </div>
  </WorkspaceShell>;
}

export function InspectorMessageCenterPage() { return <MessageCenterPage projection={inspectorProjection} />; }
export function LeadMessageCenterPage() { return <MessageCenterPage projection={leadProjection} />; }
export function AuditeeMessageCenterPage() { return <MessageCenterPage projection={auditeeProjection} />; }
