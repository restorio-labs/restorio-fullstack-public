import type { ReactElement, ReactNode } from "react";

import { cn } from "../../../utils";

export interface ToastAnimatedProps {
  exiting: boolean;
  children: ReactNode;
  className?: string;
}

export const ToastAnimated = ({ exiting, children, className }: ToastAnimatedProps): ReactElement => {
  return <div className={cn(exiting ? "toast-motion-out" : "toast-motion-in", className)}>{children}</div>;
};
