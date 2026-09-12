import { useCallback } from "react";

interface UseSnapToGridReturn {
  snap: (x: number, y: number) => { x: number; y: number };
  snapPoint: (x: number, y: number) => { x: number; y: number };
  snapSize: (w: number, h: number) => { w: number; h: number };
}

export const useSnapToGrid = (cellSize: number): UseSnapToGridReturn => {
  const snap = useCallback(
    (value: number): number => {
      return Math.round(value / cellSize) * cellSize;
    },
    [cellSize],
  );

  const snapPoint = useCallback(
    (x: number, y: number): { x: number; y: number } => ({
      x: snap(x),
      y: snap(y),
    }),
    [snap],
  );

  const snapSize = useCallback(
    (w: number, h: number): { w: number; h: number } => ({
      w: Math.max(cellSize, snap(w)),
      h: Math.max(cellSize, snap(h)),
    }),
    [snap, cellSize],
  );

  return { snap: snapPoint, snapPoint, snapSize };
};
