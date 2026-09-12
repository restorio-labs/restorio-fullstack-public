import type { ReactElement, ReactNode } from "react";

import { cn } from "../../utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ title, description, icon, action, className }: EmptyStateProps): ReactElement => {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}
      role="status"
      aria-live="polite"
    >
      {icon && <div className="mb-4 text-text-tertiary">{icon}</div>}
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      {description && <p className="text-sm text-text-secondary max-w-md mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
