/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { renderHook, act } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useMediaQuery } from "../../../src/hooks/useMediaQuery";

describe("useMediaQuery", () => {
  let matchMedia: any;

  beforeEach(() => {
    // Default mock: captures the event handler so we can trigger it later
    matchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMedia,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should return false initially when query does not match", () => {
    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));

    expect(result.current).toBe(false);
  });

  it("should return true when query matches", () => {
    matchMedia.mockImplementation((query: string) => ({
      matches: true, // Force match
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));

    expect(result.current).toBe(true);
  });

  it("should update state when media query change event fires", () => {
    let changeHandler: (e: Partial<MediaQueryListEvent>) => void = () => {};

    matchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));

    expect(result.current).toBe(false);

    // Simulate the event firing
    act(() => {
      changeHandler({ matches: true });
    });

    expect(result.current).toBe(true);

    // Simulate changing back
    act(() => {
      changeHandler({ matches: false });
    });

    expect(result.current).toBe(false);
  });

  it("should return false in SSR environment (no window)", () => {
    const originalWindow = global.window;

    vi.stubGlobal("window", undefined);

    try {
      const TestComponent: React.FC = () => {
        const matches = useMediaQuery("(max-width: 768px)");

        return createElement("div", null, matches.toString());
      };

      // 2. Render using createElement instead of <TestComponent />
      const html = renderToString(createElement(TestComponent));

      expect(html).toContain("false");
    } finally {
      vi.stubGlobal("window", originalWindow);
    }
  });

  it("should remove event listener on unmount", () => {
    const removeEventListenerMock = vi.fn();

    matchMedia.mockReturnValue({
      matches: false,
      media: "query",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerMock,
      dispatchEvent: vi.fn(),
    });

    const { unmount } = renderHook(() => useMediaQuery("(max-width: 768px)"));

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("should handle errors gracefully", () => {
    const originalMatchMedia = window.matchMedia;

    // Simulate error during initialization
    window.matchMedia = (): MediaQueryList => {
      throw new Error("matchMedia error");
    };

    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));

    expect(result.current).toBe(false);

    window.matchMedia = originalMatchMedia;
  });
});
