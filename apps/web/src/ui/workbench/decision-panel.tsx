export interface DecisionAction {
  id: string;
  label: string;
  onSelect?: () => void;
  disabledReason?: string;
  pending?: boolean;
}

export interface DecisionPanelProps {
  title: string;
  description?: string;
  statusMessage?: string;
  actions: readonly DecisionAction[];
}

function assertAction(action: DecisionAction): void {
  if (!action.onSelect && !action.disabledReason) {
    throw new Error(`Decision action "${action.label}" requires a handler or disabled reason.`);
  }
}

export function DecisionPanel({
  title,
  description,
  statusMessage,
  actions,
}: DecisionPanelProps) {
  actions.forEach(assertAction);
  return (
    <section aria-labelledby="workbench-decision-panel-title" className="workbench-decision-panel">
      <div>
        <h2 id="workbench-decision-panel-title">{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {statusMessage ? <p role="status">{statusMessage}</p> : null}
      <div className="workbench-decision-panel__actions">
        {actions.map((action) => {
          const reasonId = `${action.id}-disabled-reason`;
          const disabled = action.pending || Boolean(action.disabledReason);
          return (
            <div className="workbench-decision-panel__action" key={action.id}>
              <button
                aria-busy={action.pending ? "true" : undefined}
                aria-describedby={action.disabledReason ? reasonId : undefined}
                className="primary-button"
                disabled={disabled}
                onClick={action.onSelect}
                type="button"
              >
                {action.label}
              </button>
              {action.disabledReason ? <p id={reasonId}>{action.disabledReason}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
