import { describe, expect, it, vi } from "vitest";

import { createToastId } from "../../../../src/components/overlays/Toast/createToastId";

describe("createToastId", () => {
  it("uses crypto.randomUUID when available", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-123" } as Crypto);

    expect(createToastId()).toBe("uuid-123");

    vi.unstubAllGlobals();
  });

  it("falls back to date + random format when crypto is unavailable", () => {
    vi.stubGlobal("crypto", undefined);
    vi.spyOn(Date, "now").mockReturnValue(42);
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const id = createToastId();

    expect(id).toContain("toast-42-");

    vi.unstubAllGlobals();
  });
});
