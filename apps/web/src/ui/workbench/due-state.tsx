export interface DueStateProps {
  dueDate: string | null;
  today?: string;
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseDate(value));
}

export function dueStateLabel(dueDate: string | null, today = new Date().toISOString().slice(0, 10)): string {
  if (!dueDate) return "Due Date: Not set";
  const dueTime = parseDate(dueDate).getTime();
  const todayTime = parseDate(today).getTime();
  const daysUntilDue = Math.round((dueTime - todayTime) / 86_400_000);
  if (daysUntilDue < 0) return `Overdue: ${formatDate(dueDate)}`;
  if (daysUntilDue > 0 && daysUntilDue <= 7) return `Due Soon: ${formatDate(dueDate)}`;
  return `Due Date: ${formatDate(dueDate)}`;
}

export function DueState({ dueDate, today }: DueStateProps) {
  const label = dueStateLabel(dueDate, today);
  return <span className="workbench-due-state">{label}</span>;
}
