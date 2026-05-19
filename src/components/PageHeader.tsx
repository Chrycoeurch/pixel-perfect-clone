import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  pillar,
  actions,
}: {
  title: string;
  description?: string;
  pillar?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-card">
      <div className="px-6 lg:px-10 py-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          {pillar && (
            <div className="text-xs font-medium uppercase tracking-wider text-primary mb-1">
              {pillar}
            </div>
          )}
          <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
