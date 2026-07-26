import { useEffect, useState } from "react";

import { useBackendForRole } from "../../app/providers";
import type { NotificationView } from "../../backend/backend";
import { CommandError, errorMessage, WorkspaceShell } from "../shared/workspace-shell";

const deliveryLabels: Record<NotificationView["emailDeliveryStatus"], string> = {
  NOT_CONFIGURED: "Not configured in demo",
  PENDING: "Pending",
  RETRYING: "Retry scheduled",
  DELIVERED: "Delivered",
  FAILED: "Delivery failed",
};

export function ExecutiveNotificationsPage() {
  const backend = useBackendForRole("executiveDirector");
  const [items, setItems] = useState<NotificationView[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!backend.notifications) return;
    void backend.notifications.list({}).then((output) => setItems(output.items)).catch((cause) => setError(errorMessage(cause)));
  }, [backend]);

  async function markRead(item: NotificationView) {
    if (!backend.notifications) return;
    try {
      const updated = await backend.notifications.markRead({
        notificationId: item.id,
        expectedRevision: item.revision,
        idempotencyKey: `NOTIFICATION-${item.id}-READ-R${item.revision}`,
      });
      setItems((current) => current.map((candidate) => candidate.id === updated.id ? updated : candidate));
    } catch (cause) { setError(errorMessage(cause)); }
  }

  return <WorkspaceShell roleLabel="Executive Director" routeLabel="Notifications">
    <div className="executive-workspace-page executive-notifications-page" data-testid="executive-notifications-page">
      <header className="authority-page-head workbench-page-header"><h1>Notifications</h1><p>In-app Executive Director notices with explicit email delivery state.</p></header>
      <CommandError message={error} />
      <section className="executive-panel" aria-label="Executive notifications"><div className="executive-notification-list">{items.length ? items.map((item) => <article aria-label={`Notification ${item.id}`} data-notification-id={item.id} data-revision={item.revision} key={item.id}><span aria-hidden="true">RPT</span><div><b>{item.title}</b><p>{item.body}</p><small>{item.readAt ? "Read" : "Unread"} · revision {item.revision}</small><small>Email delivery: {deliveryLabels[item.emailDeliveryStatus]}{item.emailDeliveryAttempts > 0 ? ` · ${item.emailDeliveryAttempts} attempt${item.emailDeliveryAttempts === 1 ? "" : "s"}` : ""}{item.emailAcceptedAt ? ` · accepted ${item.emailAcceptedAt}` : ""}</small></div><div><button disabled={Boolean(item.readAt)} onClick={() => void markRead(item)} type="button">Mark {item.id} read</button><button aria-label={`Open related item for ${item.id} unavailable`} disabled title={`Notification ${item.id} has no typed related entity or route in Plan 1.`} type="button">Open related item unavailable</button></div></article>) : <div className="executive-empty"><b>No Executive Director notifications.</b><span>New planning and report submissions appear here when typed notification records exist.</span></div>}</div></section>
    </div>
  </WorkspaceShell>;
}
