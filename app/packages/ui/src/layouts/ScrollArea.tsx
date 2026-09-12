import { forwardRef, type ReactNode } from "react";

import { cn } from "../utils";

export type ScrollAreaOrientation = "vertical" | "horizontal" | "both";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  orientation?: ScrollAreaOrientation;
  hideScrollbar?: boolean;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, orientation = "vertical", hideScrollbar = false, className, ...props }, ref) => {
    const orientationStyles: Record<ScrollAreaOrientation, string> = {
      vertical: "overflow-y-auto",
      horizontal: "overflow-x-auto",
      both: "overflow-auto",
    };

    return (
      <div
        ref={ref}
        className={cn(orientationStyles[orientation], hideScrollbar && "scrollbar-hide", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ScrollArea.displayName = "ScrollArea";
