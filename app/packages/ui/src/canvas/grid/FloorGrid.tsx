import type { ReactElement } from "react";

import { cn } from "../../utils";

export interface FloorGridProps {
  width: number;
  height: number;
  cellSize: number;
  showGrid: boolean;
  className?: string;
}

export const FloorGrid = ({ width, height, cellSize, showGrid, className }: FloorGridProps): ReactElement => {
  if (!showGrid) {
    return (
      <div
        className={cn("pointer-events-none absolute inset-0 box-border border border-border-default", className)}
        style={{ width, height }}
        aria-hidden="true"
      />
    );
  }

  const axisSteps = (total: number): number[] => {
    const steps: number[] = [];
    let p = 0;

    while (p < total) {
      steps.push(p);
      p += cellSize;
    }

    if (steps[steps.length - 1] !== total) {
      steps.push(total);
    }

    return steps;
  };

  const innerW = Math.max(0, width - 1);
  const innerH = Math.max(0, height - 1);
  const xs = axisSteps(innerW);
  const ys = axisSteps(innerH);

  return (
    <div
      className={cn("absolute left-0 top-0 overflow-hidden", className)}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      aria-hidden="true"
    >
      <svg
        width={width}
        height={height}
        className="pointer-events-none block"
        aria-hidden="true"
        shapeRendering="crispEdges"
      >
        <g transform="translate(0.5, 0.5)">
          {xs.map((x) => (
            <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={innerH} stroke="var(--color-border-muted)" strokeWidth="1" />
          ))}
          {ys.map((y) => (
            <line key={`h-${y}`} x1={0} y1={y} x2={innerW} y2={y} stroke="var(--color-border-muted)" strokeWidth="1" />
          ))}
        </g>
      </svg>
    </div>
  );
};
