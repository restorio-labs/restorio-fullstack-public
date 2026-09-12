import type { CanvasBounds } from "@restorio/types";
import type { ReactElement } from "react";

import { cn } from "../../utils";
import { CanvasElement } from "../CanvasElement";

export interface FloorZoneProps {
  bounds: CanvasBounds;
  name: string;
  color?: string;
  "aria-label"?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const FloorZone = ({
  bounds,
  name,
  color,
  "aria-label": ariaLabel,
  onPointerDown,
}: FloorZoneProps): ReactElement => {
  const label = ariaLabel ?? `Zone: ${name}`;

  return (
    <CanvasElement bounds={bounds} aria-label={label} role="img" onPointerDown={onPointerDown}>
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded border border-border-muted",
          "text-text-tertiary",
          "focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-border-focus",
          !color && "bg-surface-tertiary/50",
        )}
        style={color ? { backgroundColor: color } : undefined}
      >
        <span className="text-xs md:text-sm lg:text-base font-medium" aria-hidden="true">
          {name}
        </span>
      </div>
    </CanvasElement>
  );
};
