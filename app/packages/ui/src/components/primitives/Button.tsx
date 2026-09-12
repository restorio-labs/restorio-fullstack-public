import { forwardRef, type ReactElement } from "react";

import { cn } from "../../utils";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline" | "teal" | "warm";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-interactive-primary text-interactive-primaryForeground hover:bg-interactive-primaryHover active:bg-interactive-primaryHover active:brightness-[0.92] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus [&_svg]:text-interactive-primaryForeground",
  secondary:
    "bg-interactive-secondary text-interactive-secondaryForeground hover:bg-interactive-secondaryHover active:bg-interactive-secondaryActive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
  danger:
    "bg-interactive-danger text-text-inverse hover:bg-interactive-dangerHover active:bg-interactive-dangerHover active:brightness-[0.92] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-interactive-danger-active, #b81e28)] [&_svg]:text-interactive-dangerIcon",
  ghost:
    "bg-transparent text-text-primary hover:bg-surface-secondary active:bg-surface-secondary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
  outline:
    "border border-border-default bg-transparent text-text-primary hover:bg-surface-secondary/60 active:bg-surface-secondary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
  teal: "bg-interactive-accentTeal text-interactive-accentTealForeground hover:bg-interactive-accentTealHover active:bg-interactive-accentTealActive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus [&_svg]:text-interactive-accentTealIcon",
  warm: "bg-interactive-accentWarm text-interactive-accentWarmForeground hover:bg-interactive-accentWarmHover active:bg-interactive-accentWarmActive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus [&_svg]:text-interactive-accentWarmIcon",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-button",
  md: "px-4 py-2 text-base rounded-button",
  lg: "px-6 py-3 text-lg rounded-button",
  icon: "h-8 w-8 rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", fullWidth = false, className, disabled, children, ...props },
    ref,
  ): ReactElement => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
