import type { ElementType, ReactNode } from "react";

import { cn } from "../../utils";

export type NavOrientation = "vertical" | "horizontal";

export interface NavContainerProps {
  children: ReactNode;
  orientation?: NavOrientation;
  "aria-label": string;
  className?: string;
  as?: ElementType;
  [key: string]: unknown;
}

export const NavContainer = ({
  children,
  orientation = "vertical",
  "aria-label": ariaLabel,
  className,
  as: Component = "nav",
  ...rest
}: NavContainerProps): React.ReactElement => {
  return (
    <Component
      role="navigation"
      aria-label={ariaLabel}
      className={cn(
        "flex bg-surface-secondary border-border-default text-text-primary",
        orientation === "vertical" && "flex-col border-e",
        orientation === "horizontal" && "flex-row border-b",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
};
