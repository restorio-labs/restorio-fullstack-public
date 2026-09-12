import { describe, expect, it } from "vitest";

import { moveItemById } from "../../../../src/features/menu/moveItemById";

describe("moveItemById", () => {
  it("moves item down by id", () => {
    const list = [
      { id: "a", name: "First" },
      { id: "b", name: "Second" },
    ];
    const result = moveItemById(list, "a", "down");

    expect(result).toEqual([
      { id: "b", name: "Second" },
      { id: "a", name: "First" },
    ]);
  });

  it("returns null when id is missing", () => {
    expect(moveItemById([{ id: "a", name: "x" }], "z", "down")).toBeNull();
  });

  it("returns null when move is out of range", () => {
    expect(moveItemById([{ id: "a", name: "x" }], "a", "down")).toBeNull();
  });
});
