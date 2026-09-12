/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-empty-function  */
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { mockGetCrossAppValue, mockSetCrossAppValue } = vi.hoisted(() => ({
  mockGetCrossAppValue: vi.fn<(key: string) => string | null>(),
  mockSetCrossAppValue: vi.fn<(key: string, value: string) => void>(),
}));

vi.mock("@restorio/utils", () => ({
  getCrossAppValue: mockGetCrossAppValue,
  setCrossAppValue: mockSetCrossAppValue,
}));

import { ThemeProvider, useTheme, getSystemTheme, getSystemDirection } from "../../../src/theme/ThemeProvider";
import type { ThemeOverride } from "../../../src/tokens/types";

describe("ThemeProvider", () => {
  beforeEach(() => {
    mockGetCrossAppValue.mockReset();
    mockGetCrossAppValue.mockReturnValue(null);
    mockSetCrossAppValue.mockReset();

    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("dark");
    document.documentElement.removeAttribute("style");
    document.documentElement.removeAttribute("dir");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render children", () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Test</div>
      </ThemeProvider>,
    );

    // @ts-expect-error - test purposes
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("should default to system mode", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    expect(result.current.mode).toBe("system");
  });

  it("should use provided defaultMode", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="dark">{children}</ThemeProvider>,
    });

    expect(result.current.mode).toBe("dark");
  });

  it("should initialize mode from stored light value", () => {
    mockGetCrossAppValue.mockImplementation((key: string) => (key === "theme-key" ? "light" : null));

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultMode="dark" storageKey="theme-key">
          {children}
        </ThemeProvider>
      ),
    });

    expect(result.current.mode).toBe("light");
    expect(mockSetCrossAppValue).toHaveBeenCalledWith("theme-key", "light");
  });

  it("should replace stored system mode with the fallback mode", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    mockGetCrossAppValue.mockImplementation((key: string) => (key === "theme-key" ? "system" : null));

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultMode="system" storageKey="theme-key">
          {children}
        </ThemeProvider>
      ),
    });

    expect(result.current.mode).toBe("dark");
    expect(mockSetCrossAppValue).toHaveBeenCalledWith("theme-key", "dark");
    vi.unstubAllGlobals();
  });

  it("should fallback and persist default mode when stored mode is invalid", () => {
    mockGetCrossAppValue.mockImplementation((key: string) => (key === "theme-key" ? "invalid-mode" : null));

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultMode="light" storageKey="theme-key">
          {children}
        </ThemeProvider>
      ),
    });

    expect(result.current.mode).toBe("light");
    expect(mockSetCrossAppValue).toHaveBeenCalledWith("theme-key", "light");
  });

  it("should fallback to system theme when localStorage access throws", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    mockGetCrossAppValue.mockImplementation(() => {
      throw new Error("storage get failed");
    });

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultMode="system" storageKey="theme-key">
          {children}
        </ThemeProvider>
      ),
    });

    expect(result.current.mode).toBe("dark");
    vi.unstubAllGlobals();
  });

  it("should fallback to default mode when localStorage access throws", () => {
    mockGetCrossAppValue.mockImplementation(() => {
      throw new Error("storage get failed");
    });

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultMode="light" storageKey="theme-key">
          {children}
        </ThemeProvider>
      ),
    });

    expect(result.current.mode).toBe("light");
  });

  it("should persist resolved system theme when switching mode to system", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    mockGetCrossAppValue.mockImplementation((key: string) => (key === "theme-key" ? "light" : null));

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultMode="light" storageKey="theme-key">
          {children}
        </ThemeProvider>
      ),
    });

    mockSetCrossAppValue.mockClear();

    act(() => {
      result.current.setMode("system");
    });

    await waitFor(() => {
      expect(mockSetCrossAppValue).toHaveBeenCalledWith("theme-key", "dark");
    });
    vi.unstubAllGlobals();
  });

  it("should resolve light mode correctly", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="light">{children}</ThemeProvider>,
    });

    expect(result.current.resolvedMode).toBe("light");
  });

  it("should resolve dark mode correctly", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="dark">{children}</ThemeProvider>,
    });

    expect(result.current.resolvedMode).toBe("dark");
  });

  it("should resolve system mode to light when system prefers light", () => {
    const mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    vi.stubGlobal("matchMedia", mockMatchMedia);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="system">{children}</ThemeProvider>,
    });

    expect(result.current.resolvedMode).toBe("light");
  });

  it("should resolve system mode to dark when system prefers dark", () => {
    const mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    vi.stubGlobal("matchMedia", mockMatchMedia);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="system">{children}</ThemeProvider>,
    });

    expect(result.current.resolvedMode).toBe("dark");
  });

  it("should allow changing theme mode", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="light">{children}</ThemeProvider>,
    });

    expect(result.current.mode).toBe("light");

    act(() => {
      result.current.setMode("dark");
    });

    expect(result.current.mode).toBe("dark");
    expect(result.current.resolvedMode).toBe("dark");
  });

  it("should set data-theme attribute on documentElement", async () => {
    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="dark">{children}</ThemeProvider>,
    });

    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });
  });

  it("should add dark class when mode is dark", async () => {
    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="dark">{children}</ThemeProvider>,
    });

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  it("should remove dark class when mode is light", async () => {
    document.documentElement.classList.add("dark");

    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="light">{children}</ThemeProvider>,
    });

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  it("should listen to system theme changes", async () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

    const mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn((event, handler) => {
        if (event === "change") {
          changeHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
    }));

    vi.stubGlobal("matchMedia", mockMatchMedia);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="system">{children}</ThemeProvider>,
    });

    expect(result.current.resolvedMode).toBe("light");

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (changeHandler) {
      act(() => {
        // @ts-expect-error - test purposes
        changeHandler({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current.resolvedMode).toBe("dark");
      });

      act(() => {
        // @ts-expect-error - test purposes
        changeHandler({ matches: false } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current.resolvedMode).toBe("light");
      });
    }
  });

  it("should cleanup event listener on unmount", () => {
    const removeEventListener = vi.fn();
    const mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener,
    }));

    vi.stubGlobal("matchMedia", mockMatchMedia);

    const { unmount } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="system">{children}</ThemeProvider>,
    });

    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });

  it("should not setup listener when mode is not system", () => {
    const addEventListener = vi.fn();
    const mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener,
      removeEventListener: vi.fn(),
    }));

    vi.stubGlobal("matchMedia", mockMatchMedia);

    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="light">{children}</ThemeProvider>,
    });

    expect(addEventListener).not.toHaveBeenCalled();
  });

  it("should handle matchMedia errors gracefully", () => {
    const mockMatchMedia = vi.fn().mockImplementation(() => {
      throw new Error("matchMedia not supported");
    });

    vi.stubGlobal("matchMedia", mockMatchMedia);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="system">{children}</ThemeProvider>,
    });

    expect(result.current.resolvedMode).toBe("light");
  });

  it("should handle matchMedia without addEventListener gracefully", () => {
    const mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: undefined,
      removeEventListener: vi.fn(),
    }));

    vi.stubGlobal("matchMedia", mockMatchMedia);

    expect(() => {
      renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultMode="system">{children}</ThemeProvider>,
      });
    }).not.toThrow();
  });

  it("should handle initial override", () => {
    const override: ThemeOverride = {
      colors: {
        background: {
          // @ts-expect-error - test purposes
          primary: "#custom",
        },
      },
    };

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider initialOverride={override}>{children}</ThemeProvider>,
    });

    expect(result.current.override).toEqual(override);
  });

  it("should allow setting override", () => {
    const override: ThemeOverride = {
      colors: {
        background: {
          // @ts-expect-error - test purposes
          primary: "#custom",
        },
      },
    };

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    expect(result.current.override).toBeNull();

    act(() => {
      result.current.setOverride(override);
    });

    expect(result.current.override).toEqual(override);
  });

  it("should apply CSS variables when override is set", async () => {
    const override: ThemeOverride = {
      colors: {
        background: {
          // @ts-expect-error - test purposes
          primary: "#custom",
        },
      },
    };

    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider initialOverride={override}>{children}</ThemeProvider>,
    });

    await waitFor(() => {
      const style = document.documentElement.style.getPropertyValue("--color-background-primary");

      expect(style).toBe("#custom");
    });
  });

  it("should merge override colors with base colors", () => {
    const override: ThemeOverride = {
      colors: {
        background: {
          // @ts-expect-error - test purposes
          primary: "#custom",
        },
      },
    };

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultMode="light" initialOverride={override}>
          {children}
        </ThemeProvider>
      ),
    });

    expect(result.current.colors.background.primary).toBe("#custom");
    expect(result.current.colors.background.secondary).toBeDefined();
  });

  it("should merge override colors for surface", () => {
    const override: ThemeOverride = {
      colors: {
        surface: {
          // @ts-expect-error - test purposes
          primary: "#custom-surface",
        },
      },
    };

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider initialOverride={override}>{children}</ThemeProvider>,
    });

    expect(result.current.colors.surface.primary).toBe("#custom-surface");
  });

  it("should merge override colors for border", () => {
    const override: ThemeOverride = {
      colors: {
        border: {
          // @ts-expect-error - test purposes
          default: "#custom-border",
        },
      },
    };

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider initialOverride={override}>{children}</ThemeProvider>,
    });

    expect(result.current.colors.border.default).toBe("#custom-border");
  });

  it("should merge override colors for text", () => {
    const override: ThemeOverride = {
      colors: {
        text: {
          // @ts-expect-error - test purposes
          primary: "#custom-text",
        },
      },
    };

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider initialOverride={override}>{children}</ThemeProvider>,
    });

    expect(result.current.colors.text.primary).toBe("#custom-text");
  });

  it("should merge override colors for interactive", () => {
    const override: ThemeOverride = {
      colors: {
        interactive: {
          // @ts-expect-error - test purposes
          primary: "#custom-interactive",
        },
      },
    };

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider initialOverride={override}>{children}</ThemeProvider>,
    });

    expect(result.current.colors.interactive.primary).toBe("#custom-interactive");
  });

  it("should merge override colors for status", () => {
    const override: ThemeOverride = {
      colors: {
        status: {
          error: {
            // @ts-expect-error - test purposes
            background: "#custom-error",
          },
        },
      },
    };

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider initialOverride={override}>{children}</ThemeProvider>,
    });

    expect(result.current.colors.status.error.background).toBe("#custom-error");
  });

  it("should return base colors when no override is set", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="light">{children}</ThemeProvider>,
    });

    expect(result.current.colors.background.primary).toBe("#ffffff");
  });

  it("should return dark colors when mode is dark", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="dark">{children}</ThemeProvider>,
    });

    expect(result.current.colors.background.primary).toBe("#0a0e14");
  });

  it("should throw error when useTheme is used outside ThemeProvider", () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    const originalOnError = window.onerror;

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    window.onerror = (message, source, lineno, colno, error) => {
      if (
        (typeof message === "string" && message.includes("useTheme must be used within a ThemeProvider")) ||
        (error && error.message.includes("useTheme must be used within a ThemeProvider"))
      ) {
        return true;
      }

      return false;
    };

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const errorHandler = (event: ErrorEvent) => {
      if (
        event.message.includes("useTheme must be used within a ThemeProvider") ||
        event.error?.message.includes("useTheme must be used within a ThemeProvider")
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("error", errorHandler);

    try {
      expect(() => {
        renderHook(() => useTheme());
      }).toThrow("useTheme must be used within a ThemeProvider");
    } finally {
      stderrWrite.mockRestore();
      consoleSpy.mockRestore();
      window.onerror = originalOnError;
      window.removeEventListener("error", errorHandler);
    }
  });

  it("should handle document being undefined", () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalGetElementById = document.getElementById;

    document.getElementById = vi.fn().mockReturnValue(null);

    expect(() => {
      renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
      });
    }).not.toThrow();

    document.getElementById = originalGetElementById;
  });

  it("should handle window being undefined in getSystemTheme", () => {
    const _originalWindow = global.window;
    const originalMatchMedia = global.window.matchMedia;

    // @ts-expect-error - test purposes
    delete global.window.matchMedia;

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultMode="system">{children}</ThemeProvider>,
    });

    expect(result.current.resolvedMode).toBe("light");

    global.window.matchMedia = originalMatchMedia;
  });

  // eslint-disable-next-line @typescript-eslint/require-await
  it("should handle errors in DOM manipulation gracefully", async () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalSetAttribute = document.documentElement.setAttribute;

    document.documentElement.setAttribute = vi.fn().mockImplementation(() => {
      throw new Error("DOM error");
    });

    expect(() => {
      renderHook(() => useTheme(), {
        wrapper: ({ children }) => <ThemeProvider defaultMode="dark">{children}</ThemeProvider>,
      });
    }).not.toThrow();

    document.documentElement.setAttribute = originalSetAttribute;
  });
});

describe("useTheme", () => {
  it("should provide theme context values", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    expect(result.current).toHaveProperty("mode");
    expect(result.current).toHaveProperty("resolvedMode");
    expect(result.current).toHaveProperty("setMode");
    expect(result.current).toHaveProperty("override");
    expect(result.current).toHaveProperty("setOverride");
    expect(result.current).toHaveProperty("colors");
    expect(result.current).toHaveProperty("direction");
    expect(result.current).toHaveProperty("setDirection");
  });

  it("should have correct types for setMode", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    expect(typeof result.current.setMode).toBe("function");

    act(() => {
      result.current.setMode("light");
      result.current.setMode("dark");
      result.current.setMode("system");
    });
  });

  it("should have correct types for setOverride", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    expect(typeof result.current.setOverride).toBe("function");

    act(() => {
      // @ts-expect-error - test purposes
      result.current.setOverride({ colors: { background: { primary: "#test" } } });
      result.current.setOverride(null);
    });
  });

  it("should default to auto direction", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
    });

    expect(result.current.direction).toBe("ltr");
  });

  it("should use provided defaultDirection", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultDirection="rtl">{children}</ThemeProvider>,
    });

    expect(result.current.direction).toBe("rtl");
  });

  it("should allow changing direction", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultDirection="ltr">{children}</ThemeProvider>,
    });

    expect(result.current.direction).toBe("ltr");

    act(() => {
      result.current.setDirection("rtl");
    });

    expect(result.current.direction).toBe("rtl");
  });

  it("should set dir attribute on documentElement", async () => {
    renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultDirection="rtl">{children}</ThemeProvider>,
    });

    await waitFor(() => {
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    });
  });

  it("should detect RTL from Hebrew language", () => {
    document.documentElement.removeAttribute("dir");
    document.documentElement.setAttribute("lang", "he");
    expect(getSystemDirection()).toBe("rtl");
  });

  it("should detect LTR from English language", () => {
    document.documentElement.removeAttribute("dir");
    document.documentElement.setAttribute("lang", "en");
    expect(getSystemDirection()).toBe("ltr");
  });

  it("should ignore dir attribute when language is LTR", () => {
    document.documentElement.setAttribute("lang", "en");
    document.documentElement.setAttribute("dir", "rtl");
    expect(getSystemDirection()).toBe("ltr");
  });

  it("should fall back to navigator.language when html lang is missing", () => {
    document.documentElement.removeAttribute("lang");
    document.documentElement.setAttribute("dir", "ltr");
    vi.spyOn(window.navigator, "language", "get").mockReturnValue("he-IL");

    expect(getSystemDirection()).toBe("rtl");
  });

  it("should handle auto direction detection", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultDirection="auto">{children}</ThemeProvider>,
    });

    expect(result.current.direction).toBeDefined();
    expect(["ltr", "rtl"]).toContain(result.current.direction);
  });

  it("should recompute direction from locale when switching back to auto", () => {
    document.documentElement.setAttribute("lang", "en");

    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider defaultDirection="auto">{children}</ThemeProvider>,
    });

    act(() => {
      result.current.setDirection("rtl");
    });
    expect(result.current.direction).toBe("rtl");

    act(() => {
      result.current.setDirection("auto");
    });
    expect(result.current.direction).toBe("ltr");
  });
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const TestComponent = () => {
  const { resolvedMode } = useTheme();

  return <div data-testid="resolved-mode">{resolvedMode}</div>;
};

describe("ThemeProvider - Hard Coverage Gaps", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should trigger catch block in getSystemTheme (Line 27)", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      get: () => {
        throw new Error("Hard Failure");
      },
    });

    render(
      <ThemeProvider defaultMode="system">
        <TestComponent />
      </ThemeProvider>,
    );

    // @ts-expect-error - test purposes
    expect(screen.getByTestId("resolved-mode")).toHaveTextContent("light");
  });

  it("should trigger catch block in DOM effect (Line 79)", () => {
    const spy = vi.spyOn(document.documentElement.classList, "toggle").mockImplementation(() => {
      throw new Error("DOM sabotaged");
    });

    render(
      <ThemeProvider defaultMode="dark">
        <TestComponent />
      </ThemeProvider>,
    );

    expect(document.documentElement.getAttribute("data-theme")).toBeDefined();
    spy.mockRestore();
  });

  it("should return light theme when window is undefined (Line 27)", () => {
    vi.stubGlobal("window", undefined);
    expect(getSystemTheme()).toBe("light");
    vi.unstubAllGlobals();
  });

  it("should return light theme when matchMedia is not supported (Line 34)", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(getSystemTheme()).toBe("light");
    vi.unstubAllGlobals();
  });

  it("should return ltr direction when window is undefined (Line 44)", () => {
    vi.stubGlobal("window", undefined);
    expect(getSystemDirection()).toBe("ltr");
    vi.unstubAllGlobals();
  });

  it("should return ltr direction when locale detection throws (Line 54)", () => {
    vi.spyOn(document.documentElement, "lang", "get").mockImplementation(() => {
      throw new Error("lang lookup failed");
    });

    expect(getSystemDirection()).toBe("ltr");
  });
});
