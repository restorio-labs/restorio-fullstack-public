import { type ReactNode } from "react";

import { usePrefersReducedMotion } from "../../hooks";
import { ScrollArea } from "../../layouts/ScrollArea";
import { cn } from "../../utils";

import { NavContainer } from "./NavContainer";

export interface SidebarProps {
  children: ReactNode;
  "aria-label": string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  variant?: "persistent" | "overlay";
}

export const Sidebar = ({
  children,
  "aria-label": ariaLabel,
  open = true,
  onOpenChange,
  className,
  variant = "persistent",
}: SidebarProps): React.ReactElement => {
  const reducedMotion = usePrefersReducedMotion();

  const isOverlay = variant === "overlay";

  const sidebarContent = (
    <NavContainer
      orientation="vertical"
      aria-label={ariaLabel}
      className={cn("flex-shrink-0 w-64 flex-1 min-h-0 flex flex-col", className)}
    >
      <ScrollArea orientation="vertical" className="flex-1 min-h-0 py-2">
        {children}
      </ScrollArea>
    </NavContainer>
  );

  if (isOverlay) {
    return (
      <>
        {open && (
          <div
            className="fixed inset-0 z-dropdown bg-surface-overlay"
            aria-hidden="true"
            onClick={() => onOpenChange?.(false)}
          />
        )}
        <aside
          className={cn(
            "fixed top-0 left-0 bottom-0 w-64 z-sticky flex flex-col border-e border-border-default bg-surface-secondary",
            "transition-[transform] duration-normal ease-out",
            reducedMotion && "transition-none",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label={ariaLabel}
          aria-hidden={!open}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return <>{sidebarContent}</>;
};
