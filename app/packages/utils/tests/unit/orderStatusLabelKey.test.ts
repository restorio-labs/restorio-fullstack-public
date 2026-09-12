import { describe, expect, it } from "vitest";

import { getOrderStatusLabelKey } from "../../src/orderStatusLabelKey";

describe("getOrderStatusLabelKey", () => {
  it("maps known statuses to i18n keys", () => {
    expect(getOrderStatusLabelKey("ready_to_serve")).toBe("orders.status.readyToServe");
    expect(getOrderStatusLabelKey("new")).toBe("orders.status.new");
  });

  it("returns unknown key for unrecognized status", () => {
    expect(getOrderStatusLabelKey("custom")).toBe("orders.status.unknown");
  });
});
