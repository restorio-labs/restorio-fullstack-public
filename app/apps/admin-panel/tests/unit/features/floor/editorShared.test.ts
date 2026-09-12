import type { FloorCanvas } from "@restorio/types";
import { describe, expect, it } from "vitest";

import {
  GRID_CELL,
  MIN_CANVAS_HEIGHT,
  MIN_CANVAS_WIDTH,
  clampElementBounds,
  ensureMinimumCanvasSize,
  getMaxZIndex,
  getMinZIndex,
  isTextEditingTarget,
} from "../../../../src/features/floor/editorShared";

const createLayout = (overrides?: Partial<FloorCanvas>): FloorCanvas => ({
  id: "layout-1",
  tenantId: "tenant-1",
  name: "Main floor",
  width: 1200,
  height: 900,
  elements: [],
  version: 1,
  ...overrides,
});

describe("editorShared", () => {
  it("enforces minimum canvas dimensions", () => {
    const resized = ensureMinimumCanvasSize(
      createLayout({
        width: 100,
        height: 200,
      }),
    );

    expect(resized.width).toBe(MIN_CANVAS_WIDTH);
    expect(resized.height).toBe(MIN_CANVAS_HEIGHT);
  });

  it("clamps size and position into canvas bounds", () => {
    const layout = createLayout({ width: 300, height: 220 });

    const clamped = clampElementBounds(
      {
        x: -40,
        y: 999,
        w: 10,
        h: 600,
      },
      layout,
    );

    expect(clamped).toEqual({
      x: 0,
      y: 0,
      w: GRID_CELL,
      h: 220,
    });
  });

  it("keeps size when position is past canvas edge (e.g. pointer outside while dragging)", () => {
    const layout = createLayout({ width: 1000, height: 800 });

    const clamped = clampElementBounds(
      {
        x: 1400,
        y: -100,
        w: 120,
        h: 80,
      },
      layout,
    );

    expect(clamped).toEqual({
      x: 880,
      y: 0,
      w: 120,
      h: 80,
    });
  });

  it("detects text editing targets and non-editable targets", () => {
    const input = document.createElement("input");
    const textArea = document.createElement("textarea");
    const plainDiv = document.createElement("div");

    expect(isTextEditingTarget(input)).toBe(true);
    expect(isTextEditingTarget(textArea)).toBe(true);
    expect(isTextEditingTarget(plainDiv)).toBe(false);
    expect(isTextEditingTarget(null)).toBe(false);
  });

  it("returns max and min z-index values from elements", () => {
    const elements: FloorCanvas["elements"] = [
      { id: "table-1", type: "table", tableNumber: 1, seats: 2, x: 0, y: 0, w: 80, h: 80, zIndex: 3 },
      { id: "bar-1", type: "bar", x: 0, y: 0, w: 120, h: 60, zIndex: -2 },
      { id: "wall-1", type: "wall", x: 0, y: 0, w: 60, h: 20 },
    ];

    expect(getMaxZIndex(elements)).toBe(3);
    expect(getMinZIndex(elements)).toBe(-2);
  });
});
