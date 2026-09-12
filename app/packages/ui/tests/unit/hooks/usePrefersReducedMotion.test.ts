import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { usePrefersReducedMotion } from "../../../src/hooks/usePrefersReducedMotion";

describe("usePrefersReducedMotion", () => {
  let matchMedia: (query: string) => MediaQueryList;

  beforeEach(() => {
    matchMedia = vi.fn((query: string) => {
      const matches = query === "(prefers-reduced-motion: reduce)";

      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as MediaQueryList;
    });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMedia,
    });
  });

  it("should return true when prefers-reduced-motion matches", () => {
    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(true);
  });

  it("should return false when prefers-reduced-motion does not match", () => {
    matchMedia = vi.fn((query: string) => {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as MediaQueryList;
    });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMedia,
    });

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(result.current).toBe(false);
  });
});
