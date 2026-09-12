import type { FloorCanvas, FloorElement, FloorLayoutEditorState } from "@restorio/types";
import { describe, expect, it, vi } from "vitest";

import {
  cloneFloorElement,
  createElementFromToAdd,
  layoutHistoryReducer,
} from "../../../../src/features/floor/floorLayoutState";

const createLayout = (elements: FloorElement[]): FloorCanvas => ({
  id: "layout-1",
  tenantId: "tenant-1",
  name: "Main floor",
  width: 1200,
  height: 900,
  elements,
  version: 1,
});

const createState = (layout: FloorCanvas): FloorLayoutEditorState => ({
  layout,
  history: [layout],
  historyIndex: 0,
});

describe("floorLayoutState", () => {
  it("clones element with a fresh id", () => {
    const source: FloorElement = {
      id: "table-original",
      type: "table",
      tableNumber: 10,
      seats: 4,
      label: "Window",
      x: 10,
      y: 20,
      w: 80,
      h: 80,
    };

    const clone = cloneFloorElement(source);

    expect(clone.id).not.toBe(source.id);
    expect(clone.type).toBe("table");
    expect(clone.tableNumber).toBe(10);
    expect(clone.seats).toBe(4);
  });

  it("creates expected defaults for different element types", () => {
    const bar = createElementFromToAdd({ type: "bar" });
    const zone = createElementFromToAdd({ type: "zone", name: "Patio", color: "#123456" });
    const entrance = createElementFromToAdd({ type: "entrance" });

    expect(bar.type).toBe("bar");
    expect(bar.w).toBe(120);
    expect(bar.h).toBe(60);
    expect(zone.type).toBe("zone");
    expect(zone.w).toBe(200);
    expect(zone.h).toBe(120);
    expect(entrance.type).toBe("entrance");
    expect(entrance.label).toBe("Entrance");
  });

  it("updates an element without appending history when recordHistory is false", () => {
    const layout = createLayout([
      { id: "table-1", type: "table", tableNumber: 1, seats: 2, x: 0, y: 0, w: 80, h: 80, label: "A" },
    ]);
    const state = createState(layout);

    const next = layoutHistoryReducer(state, {
      type: "UPDATE_ELEMENT",
      payload: {
        id: "table-1",
        tableLabel: "VIP",
        bounds: { x: 15, y: 25, w: 90, h: 95 },
        recordHistory: false,
      },
    });

    expect(next.history).toHaveLength(1);
    expect(next.historyIndex).toBe(0);
    expect(next.layout.elements[0]).toMatchObject({
      id: "table-1",
      label: "VIP",
      x: 15,
      y: 25,
      w: 90,
      h: 95,
    });
  });

  it("adds and removes elements while maintaining table numbering", () => {
    const layout = createLayout([
      { id: "table-1", type: "table", tableNumber: 1, seats: 2, x: 0, y: 0, w: 80, h: 80, zIndex: 3 },
      { id: "table-2", type: "table", tableNumber: 3, seats: 2, x: 100, y: 0, w: 80, h: 80, zIndex: 4 },
    ]);
    const state = createState(layout);

    const added = layoutHistoryReducer(state, {
      type: "ADD_ELEMENT",
      payload: {
        element: { id: "bar-1", type: "bar", x: 0, y: 0, w: 0, h: 0 },
        x: 30,
        y: 40,
      },
    });

    const addedElement = added.layout.elements.find((element) => element.id === "bar-1");
    expect(addedElement).toMatchObject({ x: 30, y: 40, w: 80, h: 80, zIndex: 5 });

    const removed = layoutHistoryReducer(added, {
      type: "REMOVE_ELEMENT",
      payload: { id: "table-1" },
    });

    const remainingTable = removed.layout.elements.find((element) => element.id === "table-2");
    expect(remainingTable?.type).toBe("table");
    if (remainingTable?.type === "table") {
      expect(remainingTable.tableNumber).toBe(1);
    }
  });

  it("supports commit, undo and redo state transitions", () => {
    const originalLayout = createLayout([{ id: "wall-1", type: "wall", x: 0, y: 0, w: 60, h: 20 }]);
    const changedLayout = createLayout([{ id: "wall-1", type: "wall", x: 20, y: 0, w: 60, h: 20 }]);
    const dirtyState: FloorLayoutEditorState = {
      layout: changedLayout,
      history: [originalLayout],
      historyIndex: 0,
    };

    const committed = layoutHistoryReducer(dirtyState, { type: "COMMIT_LAYOUT" });
    expect(committed.history).toHaveLength(2);
    expect(committed.historyIndex).toBe(1);

    const undone = layoutHistoryReducer(committed, { type: "UNDO" });
    expect(undone.layout.elements[0].x).toBe(0);
    expect(undone.historyIndex).toBe(0);

    const redone = layoutHistoryReducer(undone, { type: "REDO" });
    expect(redone.layout.elements[0].x).toBe(20);
    expect(redone.historyIndex).toBe(1);
  });

  it("returns unchanged state when history boundaries are reached", () => {
    const layout = createLayout([{ id: "wall-1", type: "wall", x: 0, y: 0, w: 60, h: 20 }]);
    const state = createState(layout);

    expect(layoutHistoryReducer(state, { type: "UNDO" })).toBe(state);
    expect(layoutHistoryReducer(state, { type: "REDO" })).toBe(state);
    expect(layoutHistoryReducer(state, { type: "COMMIT_LAYOUT" })).toBe(state);
  });

  it("caps history at fifty entries", () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);

    const layout = createLayout([{ id: "wall-1", type: "wall", x: 0, y: 0, w: 60, h: 20 }]);
    let state = createState(layout);

    for (let index = 0; index < 55; index += 1) {
      state = layoutHistoryReducer(state, {
        type: "ADD_ELEMENT",
        payload: {
          element: createElementFromToAdd({ type: "table", seats: 2, tableNumber: index + 1 }),
          x: index * 10,
          y: 0,
        },
      });
    }

    expect(state.history).toHaveLength(50);
    expect(state.historyIndex).toBe(49);

    vi.restoreAllMocks();
  });
});
