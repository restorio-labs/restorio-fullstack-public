import { type ReactNode, useState } from "react";

import { usePrefersReducedMotion } from "../../hooks";
import { cn } from "../../utils";
import { Icon } from "../primitives/Icon";

export type TopbarContentMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

const contentMaxWidthStyles: Record<TopbarContentMaxWidth, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

export interface TopbarProps {
  brandSlot: ReactNode;
  children: ReactNode;
  ctaSlot?: ReactNode;
  "aria-label"?: string;
  sticky?: boolean;
  className?: string;
  contentMaxWidth?: TopbarContentMaxWidth;
  mobileMenuAriaLabel?: string;
  mobileMenuOpen?: boolean;
  onMobileMenuOpenChange?: (open: boolean) => void;
}

const menuIcon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />;

const closeIcon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />;

export const Topbar = ({
  brandSlot,
  children,
  ctaSlot,
  "aria-label": ariaLabel = "Main navigation",
  sticky = false,
  className,
  contentMaxWidth = "full",
  mobileMenuAriaLabel = "Open menu",
  mobileMenuOpen: controlledOpen,
  onMobileMenuOpenChange,
}: TopbarProps): React.ReactElement => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const menuOpen = isControlled ? controlledOpen : internalOpen;
  const setMenuOpen = (open: boolean): void => {
    if (!isControlled) {
      setInternalOpen(open);
    }
    onMobileMenuOpenChange?.(open);
  };
  const reducedMotion = usePrefersReducedMotion();
  const hasContentWidth = contentMaxWidth !== "full";

  return (
    <header
      className={cn(
        "flex flex-col border-b border-border-default bg-surface-primary/95 text-text-primary backdrop-blur-md",
        sticky && "sticky top-0 z-sticky",
        className,
      )}
      role="banner"
    >
      <div
        className={cn(
          "flex h-16 w-full items-center justify-between gap-6",
          hasContentWidth ? "mx-auto px-4 sm:px-6 lg:px-8" : "px-4 sm:px-6",
          hasContentWidth && contentMaxWidthStyles[contentMaxWidth],
        )}
      >
        <div className="flex min-w-0 flex-shrink-0 items-center">{brandSlot}</div>

        <nav
          role="navigation"
          aria-label={ariaLabel}
          className="hidden md:flex md:flex-1 md:items-center md:justify-end md:gap-8"
        >
          {children}
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden md:block">{ctaSlot}</div>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : mobileMenuAriaLabel}
            aria-controls="topbar-mobile-menu"
            className={cn(
              "inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-text-primary",
              "hover:bg-surface-tertiary focus-visible-ring outline-none transition-colors duration-150",
              "md:hidden",
            )}
          >
            <Icon size="xl" aria-hidden>
              {menuOpen ? closeIcon : menuIcon}
            </Icon>
          </button>
          <div className="md:hidden">{ctaSlot}</div>
        </div>
      </div>

      <div
        id="topbar-mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-hidden={!menuOpen}
        className={cn(
          "absolute left-0 right-0 top-16 z-dropdown border-b border-t border-border-default bg-surface-primary shadow-lg",
          "md:hidden",
          "overflow-hidden transition-all duration-200 ease-out",
          reducedMotion && "transition-none",
          menuOpen ? "max-h-[calc(100vh-4rem)] opacity-100 visible" : "max-h-0 opacity-0 invisible",
        )}
      >
        <nav
          role="navigation"
          aria-label={ariaLabel}
          className="flex flex-col py-4 [&_a]:min-h-14 [&_a]:flex [&_a]:items-center"
        >
          <div className="flex flex-col gap-3 px-20">{children}</div>
        </nav>
      </div>
    </header>
  );
};
