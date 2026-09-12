import { describe, expect, it } from "vitest";

import { applyResizeEdgeLocks } from "../../../src/canvas/hooks/useDragResize";

const canvas = { width: 500, height: 400 };

describe("applyResizeEdgeLocks", () => {
  it("blocks west expansion at left edge but allows shrinking inward", () => {
    const bounds = { x: 0, y: 100, w: 80, h: 60 };

    expect(applyResizeEdgeLocks("resize-w", -10, 0, bounds, canvas)).toEqual({ dx: 0, dy: 0 });
    expect(applyResizeEdgeLocks("resize-w", 10, 0, bounds, canvas)).toEqual({ dx: 10, dy: 0 });
  });

  it("blocks east expansion at right edge but allows shrinking inward", () => {
    const bounds = { x: 420, y: 100, w: 80, h: 60 };

    expect(applyResizeEdgeLocks("resize-e", 10, 0, bounds, canvas)).toEqual({ dx: 0, dy: 0 });
    expect(applyResizeEdgeLocks("resize-e", -10, 0, bounds, canvas)).toEqual({ dx: -10, dy: 0 });
  });

  it("allows horizontal shrink when flush against both left and right", () => {
    const bounds = { x: 0, y: 100, w: 500, h: 60 };

    expect(applyResizeEdgeLocks("resize-w", 10, 0, bounds, canvas)).toEqual({ dx: 10, dy: 0 });
    expect(applyResizeEdgeLocks("resize-e", -10, 0, bounds, canvas)).toEqual({ dx: -10, dy: 0 });
    expect(applyResizeEdgeLocks("resize-w", -10, 0, bounds, canvas)).toEqual({ dx: 0, dy: 0 });
    expect(applyResizeEdgeLocks("resize-e", 10, 0, bounds, canvas)).toEqual({ dx: 0, dy: 0 });
  });

  it("blocks north expansion at top edge but allows shrinking", () => {
    const bounds = { x: 100, y: 0, w: 80, h: 60 };

    expect(applyResizeEdgeLocks("resize-n", 0, -10, bounds, canvas)).toEqual({ dx: 0, dy: 0 });
    expect(applyResizeEdgeLocks("resize-n", 0, 10, bounds, canvas)).toEqual({ dx: 0, dy: 10 });
  });

  it("blocks south expansion at bottom edge but allows shrinking", () => {
    const bounds = { x: 100, y: 340, w: 80, h: 60 };

    expect(applyResizeEdgeLocks("resize-s", 0, 10, bounds, canvas)).toEqual({ dx: 0, dy: 0 });
    expect(applyResizeEdgeLocks("resize-s", 0, -10, bounds, canvas)).toEqual({ dx: 0, dy: -10 });
  });
});
