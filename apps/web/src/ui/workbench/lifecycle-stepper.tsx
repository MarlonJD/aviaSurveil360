export type LifecycleStageState = "complete" | "current" | "pending";

export interface LifecycleStage {
  id: string;
  label: string;
  description?: string;
}

export function LifecycleStepper({
  ariaLabel,
  stages,
  currentStageId,
}: {
  ariaLabel: string;
  stages: readonly LifecycleStage[];
  currentStageId: string;
}) {
  const currentIndex = stages.findIndex((stage) => stage.id === currentStageId);
  if (currentIndex === -1) {
    throw new Error(`Unknown lifecycle stage ${currentStageId}`);
  }
  return (
    <ol aria-label={ariaLabel} className="workbench-lifecycle-stepper">
      {stages.map((stage, index) => {
        const state: LifecycleStageState =
          stage.id === currentStageId ? "current" : index < currentIndex ? "complete" : "pending";
        return (
          <li
            aria-current={state === "current" ? "step" : undefined}
            data-state={state}
            key={stage.id}
          >
            <span aria-hidden="true" className="workbench-lifecycle-stepper__marker" />
            <span>{stage.label}</span>
            {stage.description ? <small>{stage.description}</small> : null}
          </li>
        );
      })}
    </ol>
  );
}
