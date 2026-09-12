import type { ReactElement, ReactNode } from "react";

import { cn } from "../utils";

export interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  headerActions?: ReactNode;
  className?: string;
}

export const PageLayout = ({
  children,
  title,
  description,
  headerActions,
  className,
}: PageLayoutProps): ReactElement => {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col h-full", className)}>
      <div className="flex-shrink-0 px-6 py-4 border-b border-border-default bg-surface-primary">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {title && <h1 className="text-2xl font-semibold text-text-primary text-red-500">{title}</h1>}
            {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
          </div>
          {headerActions && <div className="flex-shrink-0 flex items-center">{headerActions}</div>}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
};
