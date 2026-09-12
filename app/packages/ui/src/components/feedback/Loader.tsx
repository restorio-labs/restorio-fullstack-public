import type { ReactElement } from "react";

import { cn } from "../../utils";

export type LoaderSize = "sm" | "md" | "lg";

export interface LoaderProps {
  size?: LoaderSize;
  className?: string;
  "aria-label"?: string;
}

const sizeStyles: Record<LoaderSize, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-4",
};

export const Loader = ({ size = "md", className, "aria-label": ariaLabel = "Loading" }: LoaderProps): ReactElement => {
  return (
    <div
      className={cn(
        "inline-block border-border-default border-t-interactive-primary rounded-full animate-spin",
        sizeStyles[size],
        className,
      )}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};
