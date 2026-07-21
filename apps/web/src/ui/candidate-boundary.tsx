import type { RoleSelectionMode } from "./role-select-page";

export function CandidateBoundary({
  mode,
  environmentLabel,
}: {
  mode: RoleSelectionMode;
  environmentLabel: string;
}) {
  const modeLabel =
    mode === "demo-role-switch"
      ? "Deterministic mock data"
      : mode === "canonical-test-role-switch"
        ? environmentLabel
        : "Browser session candidate";
  return (
    <div className="candidate-boundary">
      <span>Candidate-only</span>
      <span>{modeLabel}</span>
      <span>No production-readiness claim</span>
    </div>
  );
}
