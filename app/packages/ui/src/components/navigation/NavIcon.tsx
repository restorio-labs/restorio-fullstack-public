import type { ReactNode } from "react";

import { cn } from "../../utils";

export interface NavIconProps {
  children: ReactNode;
  className?: string;
  "aria-hidden"?: boolean;
}

export const NavIcon = ({
  children,
  className,
  "aria-hidden": ariaHidden = true,
}: NavIconProps): React.ReactElement => {
  return (
    <span
      className={cn("inline-flex flex-shrink-0 items-center justify-center w-6 h-6 text-current", className)}
      aria-hidden={ariaHidden}
    >
      {children}
    </span>
  );
};
