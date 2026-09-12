import type { ReactNode, ReactElement } from "react";

import { cn } from "../../../utils";

export type ToastPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";

export interface ToastContainerProps {
  children: ReactNode;
  position?: ToastPosition;
  className?: string;
  ariaLabel?: string;
}

const positionStyles: Record<ToastPosition, string> = {
  "top-left": "top-4 start-4",
  "top-right": "top-4 end-4",
  "bottom-left": "bottom-4 start-4",
  "bottom-right": "bottom-4 end-4",
  "top-center": "top-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2",
  "bottom-center": "bottom-4 start-1/2 -translate-x-1/2 rtl:translate-x-1/2",
};

export const ToastContainer = ({
  children,
  position = "top-right",
  className,
  ariaLabel = "Notifications",
}: ToastContainerProps): ReactElement => {
  return (
    <div
      className={cn("fixed z-toast flex flex-col gap-2", positionStyles[position], className)}
      role="region"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      {children}
    </div>
  );
};
