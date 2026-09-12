import type { ReactElement, ReactNode } from "react";

import { cn } from "../utils";

export type ContentContainerMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface ContentContainerProps {
  children: ReactNode;
  maxWidth?: ContentContainerMaxWidth;
  padding?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const maxWidthStyles: Record<ContentContainerMaxWidth, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
};

export const ContentContainer = ({
  children,
  maxWidth = "xl",
  padding = true,
  fullWidth = false,
  className,
  style,
}: ContentContainerProps): ReactElement => {
  return (
    <div
      className={cn(
        "w-full mx-auto",
        !fullWidth && maxWidthStyles[maxWidth],
        padding && "px-4 sm:px-6 lg:px-8",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
};
