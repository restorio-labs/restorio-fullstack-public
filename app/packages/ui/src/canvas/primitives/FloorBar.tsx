import type { CanvasBounds } from "@restorio/types";
import type { ReactElement } from "react";

import { cn } from "../../utils";
import { CanvasElement } from "../CanvasElement";

export interface FloorBarProps {
  bounds: CanvasBounds;
  label?: string;
  "aria-label"?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const FloorBar = ({
  bounds,
  label = "Bar",
  "aria-label": ariaLabel,
  onPointerDown,
}: FloorBarProps): ReactElement => {
  const resolvedLabel = ariaLabel ?? `Bar${label !== "Bar" ? `: ${label}` : ""}`;

  return (
    <CanvasElement bounds={bounds} aria-label={resolvedLabel} role="img" onPointerDown={onPointerDown}>
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded border-2 border-border-strong",
          "bg-surface-secondary text-text-secondary",
          "focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-border-focus",
        )}
      >
        <span className="text-xs md:text-sm lg:text-base font-medium" aria-hidden="true">
          {label}
        </span>
      </div>
    </CanvasElement>
  );
};
