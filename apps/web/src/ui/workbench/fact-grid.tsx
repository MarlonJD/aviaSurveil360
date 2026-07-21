import type { ReactNode } from "react";

export interface FactGridItem {
  label: string;
  value: ReactNode;
}

export function FactGrid({ items, testId }: { items: readonly FactGridItem[]; testId?: string }) {
  return (
    <dl className="workbench-fact-grid" data-testid={testId}>
      {items.map((item) => (
        <div className="workbench-fact-grid__item" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
