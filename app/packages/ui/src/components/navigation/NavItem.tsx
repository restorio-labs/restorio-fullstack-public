import { createElement, forwardRef, type ElementType, type ReactNode } from "react";

import { cn } from "../../utils";

export type NavItemVariant = "default" | "link";

export interface NavItemProps {
  href?: string;
  active?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  as?: ElementType;
  role?: "menuitem";
  touchTarget?: boolean;
  variant?: NavItemVariant;
  "aria-current"?: "page" | "step" | "location" | "date" | "time" | true | false;
  "aria-label"?: string;
  [key: string]: unknown;
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-fast rounded-button focus-visible-ring outline-none border border-transparent";

const stateStyles = {
  default: "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary active:bg-surface-tertiary text-left",
  active: "text-interactive-primary bg-surface-secondary",
  disabled: "text-text-disabled cursor-not-allowed pointer-events-none",
};

const linkVariantStyles = {
  default: "text-text-secondary hover:text-interactive-primary",
  active: "text-interactive-primary",
  disabled: "text-text-disabled cursor-not-allowed pointer-events-none",
};

export const NavItem = forwardRef<HTMLAnchorElement | HTMLButtonElement, NavItemProps>(
  (
    {
      href,
      active = false,
      disabled = false,
      icon,
      children,
      className,
      onClick,
      as: Component,
      role,
      touchTarget = false,
      variant = "default",
      "aria-current": ariaCurrent,
      "aria-label": ariaLabel,
      ...rest
    },
    ref,
  ): React.ReactElement => {
    const resolvedComponent = (Component ?? (href != null ? "a" : "button")) as ElementType;
    const isAnchor = resolvedComponent === "a" || href != null;
    const isLinkVariant = (variant as NavItemVariant | undefined) === "link";

    const combinedClassName = cn(
      baseStyles,
      (touchTarget as boolean) && "min-w-[48px] min-h-[48px]",
      !(touchTarget as boolean) && "w-full",
      (touchTarget as boolean) ? "py-2 px-2" : "text-left px-3 py-2",
      isLinkVariant ? "bg-transparent border-0 rounded-none hover:bg-transparent active:bg-transparent" : undefined,
      disabled
        ? isLinkVariant
          ? linkVariantStyles.disabled
          : stateStyles.disabled
        : active
          ? isLinkVariant
            ? linkVariantStyles.active
            : stateStyles.active
          : isLinkVariant
            ? linkVariantStyles.default
            : stateStyles.default,
      typeof className === "string" ? className : "",
    );

    const content: ReactNode =
      icon != null ? (
        <>
          {icon}
          {children != null ? <span className="truncate">{children as ReactNode}</span> : null}
        </>
      ) : (
        ((children ?? null) as ReactNode)
      );

    const sharedProps = {
      ref: ref as React.Ref<HTMLAnchorElement & HTMLButtonElement>,
      ...(role != null ? { role } : {}),
      className: combinedClassName,
      "aria-current": active ? ("page" as const) : ariaCurrent,
      "aria-disabled": disabled || undefined,
      ...(ariaLabel != null ? { "aria-label": ariaLabel } : {}),
      ...(isAnchor && href != null ? { href } : { type: "button" as const }),
      ...(!disabled && onClick && !isAnchor ? { onClick } : {}),
      ...rest,
    };

    return createElement(
      resolvedComponent,
      { ...sharedProps, href: isAnchor ? href : undefined },
      content as ReactNode,
    );
  },
);

NavItem.displayName = "NavItem";
