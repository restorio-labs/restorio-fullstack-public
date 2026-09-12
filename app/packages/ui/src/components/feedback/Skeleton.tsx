import type { ReactElement } from "react";

import { cn } from "../../utils";

export type SkeletonVariant = "text" | "circular" | "rectangular";
export type SkeletonAnimation = "pulse" | "wave" | "none";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  animation?: SkeletonAnimation;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: "rounded-sm",
  circular: "rounded-full",
  rectangular: "rounded-md",
};

const animationStyles: Record<SkeletonAnimation, string> = {
  pulse: "animate-pulse",
  wave: "animate-[wave_1.6s_ease-in-out_infinite]",
  none: "",
};

export const Skeleton = ({
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
  className,
  style,
  ...props
}: SkeletonProps): ReactElement => {
  return (
    <div
      className={cn("bg-surface-secondary", variantStyles[variant], animationStyles[animation], className)}
      style={{
        width: width ?? (variant === "circular" ? height : undefined),
        height: height ?? (variant === "text" ? "1em" : undefined),
        ...style,
      }}
      aria-busy="true"
      aria-live="polite"
      {...props}
    />
  );
};
