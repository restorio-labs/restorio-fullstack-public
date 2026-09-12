import { type ReactNode, useState } from "react";

import { usePrefersReducedMotion } from "../../hooks";
import { cn } from "../../utils";
import { Icon } from "../primitives/Icon";

export interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  "aria-label"?: string;
  className?: string;
}

const chevronDown = <path d="M6 9l6 6 6-6" />;

const chevronRight = <path d="M9 6l6 6-6 6" />;

export const SidebarSection = ({
  title,
  children,
  defaultCollapsed = false,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  "aria-label": ariaLabel,
  className,
}: SidebarSectionProps): React.ReactElement => {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isControlled = controlledCollapsed !== undefined;
  const collapsed = isControlled ? controlledCollapsed : internalCollapsed;
  const reducedMotion = usePrefersReducedMotion();

  const handleToggle = (): void => {
    const next = !collapsed;

    if (!isControlled) {
      setInternalCollapsed(next);
    }
    onCollapsedChange?.(next);
  };

  return (
    <section className={cn("flex flex-col", className)} aria-label={ariaLabel ?? title}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={!collapsed}
        aria-controls={`sidebar-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-tertiary hover:bg-surface-tertiary hover:text-text-secondary rounded-button focus-visible-ring outline-none transition-colors duration-fast"
      >
        <Icon size="sm" className="flex-shrink-0 min-h-[1.5rem] min-w-[1.25rem]">
          {collapsed ? chevronRight : chevronDown}
        </Icon>
        <span className="truncate">{title}</span>
      </button>
      <div
        id={`sidebar-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
        role="region"
        aria-hidden={collapsed}
        className={cn(
          "overflow-hidden transition-[height] duration-normal ease-out",
          reducedMotion && "transition-none",
          collapsed ? "h-0" : "h-auto",
        )}
      >
        {children}
      </div>
    </section>
  );
};
