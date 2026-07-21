export type StatusPillTone = "neutral" | "success" | "warning" | "danger";

const toneIcon: Record<StatusPillTone, string> = {
  neutral: ".",
  success: "+",
  warning: "!",
  danger: "x",
};

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: StatusPillTone;
}) {
  return (
    <span
      aria-label={`Status: ${label}`}
      className={`workbench-status-pill workbench-status-pill--${tone}`}
      role="status"
    >
      <span aria-hidden="true">{toneIcon[tone]}</span>
      <span>{label}</span>
    </span>
  );
}
