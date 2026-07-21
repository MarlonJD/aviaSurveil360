import type { ReactNode } from "react";

export interface MobileRecordCardField {
  label: string;
  value: ReactNode;
}

export function MobileRecordCard({
  title,
  fields,
}: {
  title: string;
  fields: readonly MobileRecordCardField[];
}) {
  return (
    <article aria-label={title} className="workbench-record-card">
      <h3>{title}</h3>
      <dl>
        {fields.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
