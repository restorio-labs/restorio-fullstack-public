import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBreakpoint, useBreakpointUp } from "../../../src/hooks/useBreakpoint";
import { useMediaQuery } from "../../../src/hooks/useMediaQuery";

vi.mock("../../../src/hooks/useMediaQuery", () => ({
  useMediaQuery: vi.fn(),
}));

const useMediaQueryMock = vi.mocked(useMediaQuery);

describe("useBreakpoint", () => {
  beforeEach(() => {
    useMediaQueryMock.mockReset();
  });

  it("maps each breakpoint to the expected media query", () => {
    useMediaQueryMock.mockReturnValue(true);

    renderHook(() => useBreakpoint("sm"));
    renderHook(() => useBreakpoint("md"));
    renderHook(() => useBreakpoint("lg"));
    renderHook(() => useBreakpoint("xl"));
    renderHook(() => useBreakpoint("2xl"));

    expect(useMediaQueryMock).toHaveBeenNthCalledWith(1, "(min-width: 640px)");
    expect(useMediaQueryMock).toHaveBeenNthCalledWith(2, "(min-width: 768px)");
    expect(useMediaQueryMock).toHaveBeenNthCalledWith(3, "(min-width: 1024px)");
    expect(useMediaQueryMock).toHaveBeenNthCalledWith(4, "(min-width: 1280px)");
    expect(useMediaQueryMock).toHaveBeenNthCalledWith(5, "(min-width: 1536px)");
  });

  it("returns the largest matched breakpoint", () => {
    useMediaQueryMock
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);

    const { result } = renderHook(() => useBreakpointUp());

    expect(result.current).toBe("lg");
  });

  it("returns null when no breakpoints match", () => {
    useMediaQueryMock.mockReturnValue(false);

    const { result } = renderHook(() => useBreakpointUp());

    expect(result.current).toBeNull();
  });
});
