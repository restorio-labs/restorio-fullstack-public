import { type ReactNode } from "react";

import { ScrollArea } from "../../layouts/ScrollArea";
import { cn } from "../../utils";

import { NavContainer } from "./NavContainer";

export type NavRailOrientation = "vertical" | "horizontal";

export interface NavRailProps {
  children: ReactNode;
  orientation?: NavRailOrientation;
  "aria-label": string;
  className?: string;
}

export const NavRail = ({
  children,
  orientation = "vertical",
  "aria-label": ariaLabel,
  className,
}: NavRailProps): React.ReactElement => {
  return (
    <NavContainer
      orientation={orientation}
      aria-label={ariaLabel}
      className={cn(
        "flex-shrink-0 py-2",
        orientation === "vertical" && "w-[72px] flex-col items-stretch gap-1",
        orientation === "horizontal" && "h-[72px] flex-row items-center justify-center gap-1 px-2",
        className,
      )}
    >
      <ScrollArea
        orientation={orientation}
        hideScrollbar
        className={cn(
          "flex flex-1 min-h-0",
          orientation === "vertical" && "flex-col items-center",
          orientation === "horizontal" && "flex-row items-center justify-center",
        )}
      >
        <nav
          role="navigation"
          aria-label={ariaLabel}
          className={cn(
            "flex gap-1",
            orientation === "vertical" && "flex-col items-center w-full",
            orientation === "horizontal" && "flex-row items-center",
          )}
        >
          {children}
        </nav>
      </ScrollArea>
    </NavContainer>
  );
};
