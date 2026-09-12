import type { CanvasBounds } from "@restorio/types";
import type { ReactElement } from "react";

import { cn } from "../../utils";
import { CanvasElement } from "../CanvasElement";

export interface FloorWallProps {
  bounds: CanvasBounds;
  "aria-label"?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const FloorWall = ({ bounds, "aria-label": ariaLabel, onPointerDown }: FloorWallProps): ReactElement => {
  return (
    <CanvasElement bounds={bounds} aria-label={ariaLabel ?? "Wall"} role="img" onPointerDown={onPointerDown}>
      <div
        className={cn(
          "h-full w-full rounded-sm bg-background-tertiary border border-border-strong",
          "focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-border-focus",
        )}
      />
    </CanvasElement>
  );
};
