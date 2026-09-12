import type { ReactElement, ReactNode } from "react";

export interface RestaurantListCardProps {
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
  onClick: () => void;
  ariaLabel: string;
}

export const RestaurantListCard = ({
  title,
  subtitle,
  rightContent,
  onClick,
  ariaLabel,
}: RestaurantListCardProps): ReactElement => {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full rounded-lg border border-border-default bg-surface-primary px-4 py-3 text-left transition-colors hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        aria-label={ariaLabel}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <span className="font-medium text-text-primary">{title}</span>
            {subtitle !== undefined && <span className="ml-2 text-sm text-text-secondary">{subtitle}</span>}
          </div>
          {rightContent}
        </div>
      </button>
    </li>
  );
};
