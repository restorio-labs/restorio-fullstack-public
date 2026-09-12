import type { CanvasBounds } from "@restorio/types";
import { useCallback, useRef, useState } from "react";

export type DragResizeMode =
  | "move"
  | "resize-n"
  | "resize-s"
  | "resize-e"
  | "resize-w"
  | "resize-ne"
  | "resize-nw"
  | "resize-se"
  | "resize-sw";

interface DragState {
  id: string;
  mode: DragResizeMode;
  startX: number;
  startY: number;
  startBounds: CanvasBounds;
}

const EDGE_EPS = 1e-6;

export const applyResizeEdgeLocks = (
  mode: DragResizeMode,
  rawDx: number,
  rawDy: number,
  bounds: { x: number; y: number; w: number; h: number },
  canvas: { width: number; height: number },
): { dx: number; dy: number } => {
  const { x, y, w, h } = bounds;
  const atLeft = x <= EDGE_EPS;
  const atRight = x + w >= canvas.width - EDGE_EPS;
  const atTop = y <= EDGE_EPS;
  const atBottom = y + h >= canvas.height - EDGE_EPS;

  const affectsNorth = mode === "resize-n" || mode === "resize-nw" || mode === "resize-ne";
  const affectsSouth = mode === "resize-s" || mode === "resize-sw" || mode === "resize-se";
  const affectsWest = mode === "resize-w" || mode === "resize-nw" || mode === "resize-sw";
  const affectsEast = mode === "resize-e" || mode === "resize-ne" || mode === "resize-se";

  let dx = rawDx;
  let dy = rawDy;

  if (affectsWest && atLeft && dx < 0) {
    dx = 0;
  }

  if (affectsEast && atRight && dx > 0) {
    dx = 0;
  }

  if (affectsNorth && atTop && dy < 0) {
    dy = 0;
  }

  if (affectsSouth && atBottom && dy > 0) {
    dy = 0;
  }

  return { dx, dy };
};

export interface UseDragResizeOptions {
  onBoundsChange?: (id: string, bounds: CanvasBounds) => void;
  snap?: (x: number, y: number) => { x: number; y: number };
  snapSize?: (w: number, h: number) => { w: number; h: number };
  minWidth?: number;
  minHeight?: number;
  canvasBounds?: { width: number; height: number } | null;
}

export interface UseDragResizeReturn {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  isDragging: boolean;
  isResizing: boolean;
  handlePointerDown: (id: string, e: React.PointerEvent, mode: DragResizeMode, currentBounds: CanvasBounds) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: () => void;
}

const defaultSnap = (x: number, y: number): { x: number; y: number } => ({ x, y });

const defaultSnapSize = (w: number, h: number): { w: number; h: number } => ({ w, h });

export const useDragResize = (options: UseDragResizeOptions = {}): UseDragResizeReturn => {
  const {
    onBoundsChange,
    snap = defaultSnap,
    snapSize = defaultSnapSize,
    minWidth = 40,
    minHeight = 40,
    canvasBounds = null,
  } = options;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);

  const handlePointerDown = useCallback(
    (id: string, e: React.PointerEvent, mode: DragResizeMode, currentBounds: CanvasBounds): void => {
      e.preventDefault();
      setSelectedId(id);
      const isMove = mode === "move";

      setIsDragging(isMove);
      setIsResizing(!isMove);

      const newState: DragState = {
        id,
        mode,
        startX: e.clientX,
        startY: e.clientY,
        startBounds: currentBounds,
      };

      dragStateRef.current = newState;
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent): void => {
      const state: DragState | null = dragStateRef.current;

      if (!state) {
        return;
      }

      const rawDx = e.clientX - state.startX;
      const rawDy = e.clientY - state.startY;
      const { id } = state;
      const { mode } = state;
      const { startBounds } = state;

      const { dx, dy } =
        canvasBounds && mode !== "move"
          ? applyResizeEdgeLocks(mode, rawDx, rawDy, startBounds, canvasBounds)
          : { dx: rawDx, dy: rawDy };

      if (mode === "move") {
        const snapped = snap(startBounds.x + dx, startBounds.y + dy);

        onBoundsChange?.(id, { ...startBounds, x: snapped.x, y: snapped.y });

        return;
      }

      const startX = startBounds.x;
      const startY = startBounds.y;
      const startW = startBounds.w;
      const startH = startBounds.h;
      const right = startX + startW;
      const bottom = startY + startH;
      let x = startX;
      let y = startY;
      let w = startW;
      let h = startH;

      switch (mode) {
        case "resize-e":
          w = Math.max(minWidth, startW + dx);

          break;
        case "resize-w":
          w = Math.max(minWidth, startW - dx);
          x = startX + dx;

          break;
        case "resize-s":
          h = Math.max(minHeight, startH + dy);

          break;
        case "resize-n":
          h = Math.max(minHeight, startH - dy);
          y = startY + dy;

          break;
        case "resize-se":
          w = Math.max(minWidth, startW + dx);
          h = Math.max(minHeight, startH + dy);

          break;
        case "resize-sw":
          w = Math.max(minWidth, startW - dx);
          x = startX + dx;
          h = Math.max(minHeight, startH + dy);

          break;
        case "resize-ne":
          w = Math.max(minWidth, startW + dx);
          h = Math.max(minHeight, startH - dy);
          y = startY + dy;

          break;
        case "resize-nw":
          w = Math.max(minWidth, startW - dx);
          x = startX + dx;
          h = Math.max(minHeight, startH - dy);
          y = startY + dy;

          break;
        default:
          return;
      }

      const leftMoves = mode.includes("w");
      const topMoves = mode.includes("n");

      if (leftMoves) {
        const snappedX = snap(x, startY).x;

        x = snappedX;
        w = Math.max(minWidth, right - x);
        x = right - w;
      }

      if (topMoves) {
        const snappedY = snap(startX, y).y;

        y = snappedY;
        h = Math.max(minHeight, bottom - y);
        y = bottom - h;
      }

      const snapped = snapSize(w, h);
      const { rotation } = startBounds;

      onBoundsChange?.(id, {
        x: leftMoves ? right - snapped.w : x,
        y: topMoves ? bottom - snapped.h : y,
        w: snapped.w,
        h: snapped.h,
        rotation,
      });
    },
    [minWidth, minHeight, snap, snapSize, onBoundsChange, canvasBounds],
  );

  const handlePointerUp = useCallback((): void => {
    dragStateRef.current = null;
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  return {
    selectedId,
    setSelectedId,
    isDragging,
    isResizing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
};
