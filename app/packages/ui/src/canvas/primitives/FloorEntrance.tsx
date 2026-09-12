import type { CanvasBounds } from "@restorio/types";
import type { ReactElement } from "react";

import { cn } from "../../utils";
import { CanvasElement } from "../CanvasElement";

export interface FloorEntranceProps {
  bounds: CanvasBounds;
  label?: string;
  "aria-label"?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const FloorEntrance = ({
  bounds,
  label = "Entrance",
  "aria-label": ariaLabel,
  onPointerDown,
}: FloorEntranceProps): ReactElement => {
  const resolvedLabel = ariaLabel ?? `Entrance${label !== "Entrance" ? `: ${label}` : ""}`;

  return (
    <CanvasElement bounds={bounds} aria-label={resolvedLabel} role="img" onPointerDown={onPointerDown}>
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded border-2 border-dashed border-border-strong",
          "bg-surface-primary text-text-secondary",
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
