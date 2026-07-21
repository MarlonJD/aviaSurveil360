import type { ReactNode } from "react";

import { FactGrid, type FactGridItem } from "./fact-grid";

export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  facts: readonly FactGridItem[];
  primaryAction?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  facts,
  primaryAction,
}: PageHeaderProps) {
  return (
    <header className="workbench-page-header">
      <div className="workbench-page-header__main">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="workspace-purpose">{description}</p>
        <FactGrid items={facts} testId="page-header-facts" />
      </div>
      {primaryAction ? <div className="workbench-page-header__action">{primaryAction}</div> : null}
    </header>
  );
}
