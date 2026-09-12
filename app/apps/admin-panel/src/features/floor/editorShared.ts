import type { FloorCanvas as FloorCanvasType } from "@restorio/types";
import type { DragResizeMode, useTheme } from "@restorio/ui";

export const GRID_CELL = 10;
export const MIN_CANVAS_WIDTH = 1000;
export const MIN_CANVAS_HEIGHT = 800;
export const HANDLE_SIZE = 12;
export const RESIZE_HANDLES: { mode: DragResizeMode; left: string; top: string; cursor: string }[] = [
  { mode: "resize-nw", left: "0", top: "0", cursor: "nwse-resize" },
  { mode: "resize-n", left: "50%", top: "0", cursor: "n-resize" },
  { mode: "resize-ne", left: "100%", top: "0", cursor: "nesw-resize" },
  { mode: "resize-e", left: "100%", top: "50%", cursor: "e-resize" },
  { mode: "resize-se", left: "100%", top: "100%", cursor: "nwse-resize" },
  { mode: "resize-s", left: "50%", top: "100%", cursor: "s-resize" },
  { mode: "resize-sw", left: "0", top: "100%", cursor: "nesw-resize" },
  { mode: "resize-w", left: "0", top: "50%", cursor: "w-resize" },
];

type ThemeColors = ReturnType<typeof useTheme>["colors"];

export const ZONE_COLOR_SELECTORS: ((colors: ThemeColors) => string)[] = [
  (theme): string => theme.status.success.background,
  (theme): string => theme.status.info.background,
  (theme): string => theme.status.warning.background,
  (theme): string => theme.status.error.background,
  (theme): string => theme.status.success.border,
  (theme): string => theme.status.info.border,
  (theme): string => theme.status.warning.border,
  (theme): string => theme.status.error.border,
  (theme): string => theme.interactive.primary,
  (theme): string => theme.interactive.primaryHover,
  (theme): string => theme.interactive.primaryActive,
  (theme): string => theme.interactive.secondary,
  (theme): string => theme.interactive.secondaryHover,
  (theme): string => theme.interactive.secondaryActive,
  (theme): string => theme.interactive.success,
  (theme): string => theme.interactive.successHover,
  (theme): string => theme.interactive.danger,
  (theme): string => theme.interactive.dangerHover,
  (theme): string => theme.background.secondary,
  (theme): string => theme.background.tertiary,
];

export const ensureMinimumCanvasSize = (layout: FloorCanvasType): FloorCanvasType => ({
  ...layout,
  width: Math.max(layout.width, MIN_CANVAS_WIDTH),
  height: Math.max(layout.height, MIN_CANVAS_HEIGHT),
});

export const clampElementBounds = (
  bounds: { x: number; y: number; w: number; h: number; rotation?: number },
  layout: FloorCanvasType,
): { x: number; y: number; w: number; h: number; rotation?: number } => {
  const w = Math.max(GRID_CELL, bounds.w);
  const h = Math.max(GRID_CELL, bounds.h);
  const maxW = Math.min(w, layout.width);
  const maxH = Math.min(h, layout.height);
  const x = Math.max(0, Math.min(bounds.x, layout.width - maxW));
  const y = Math.max(0, Math.min(bounds.y, layout.height - maxH));

  return { ...bounds, x, y, w: maxW, h: maxH, rotation: bounds.rotation };
};

export const isTextEditingTarget = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null;

  if (!element) {
    return false;
  }

  const { tagName } = element;

  return element.isContentEditable || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
};

export const getMaxZIndex = (elements: FloorCanvasType["elements"]): number =>
  elements.reduce((max, el) => Math.max(max, Number(el.zIndex ?? 0)), 0);

export const getMinZIndex = (elements: FloorCanvasType["elements"]): number =>
  elements.reduce((min, el) => Math.min(min, Number(el.zIndex ?? 0)), 0);
