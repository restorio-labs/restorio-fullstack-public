import type { CanvasBounds } from "@restorio/types";
import type { ReactNode } from "react";

import { cn } from "../utils";

export interface CanvasElementProps {
  bounds: CanvasBounds;
  children: ReactNode;
  className?: string;
  "aria-label": string;
  role?: "img" | "button" | "group";
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const CanvasElement = ({
  bounds,
  children,
  className,
  "aria-label": ariaLabel,
  role = "group",
  tabIndex,
  onKeyDown,
  onPointerDown,
}: CanvasElementProps): ReactNode => {
  const { x, y, w, h, rotation = 0 } = bounds;
  const transform = `translate(${x}px, ${y}px) ${rotation ? `rotate(${rotation}deg)` : ""}`;

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      className={cn("absolute left-0 top-0 origin-top-left touch-manipulation", className)}
      onPointerDown={onPointerDown}
      style={{
        transform,
        width: `${w}px`,
        height: `${h}px`,
      }}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
};
