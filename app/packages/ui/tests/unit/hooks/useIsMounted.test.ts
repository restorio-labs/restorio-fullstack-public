import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { useIsMounted } from "../../../src/hooks/useIsMounted";

describe("useIsMounted", () => {
  it("should return true after mount", async () => {
    const { result } = renderHook(() => useIsMounted());

    await waitFor(
      () => {
        expect(result.current).toBe(true);
      },
      { timeout: 100 },
    );
  });
});
