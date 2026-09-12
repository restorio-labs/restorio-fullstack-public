/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import {
  buildScopedThemeStyle,
  flattenToCSSVariables,
  generateCSSVariables,
  mergeColorOverrideSlices,
  resolveThemeOverrideForMode,
} from "../../../src/theme/cssVariables";
import { colorTokens } from "../../../src/tokens/colors";
import { ThemeProvider, useTheme } from "../../../src/theme/ThemeProvider";
import type { ThemeOverride } from "../../../src/tokens/types";

describe("generateCSSVariables", () => {
  it("should return empty object when override is empty", () => {
    const override: ThemeOverride = {};
    const result = generateCSSVariables(override);

    expect(result).toEqual({});
  });

  it("should generate CSS variables for colors", () => {
    const override: ThemeOverride = {
      colors: {
        background: {
          primary: "#ffffff",
          // @ts-expect-error - test purposes
          secondary: "#f5f5f5",
        },
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--color-background-primary": "#ffffff",
      "--color-background-secondary": "#f5f5f5",
    });
  });

  it("should generate CSS variables for spacing", () => {
    const override: ThemeOverride = {
      spacing: {
        1: "0.25rem",
        2: "0.5rem",
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--spacing-1": "0.25rem",
      "--spacing-2": "0.5rem",
    });
  });

  it("should generate CSS variables for radius", () => {
    const override: ThemeOverride = {
      radius: {
        // @ts-expect-error - test purposes
        sm: "0.125rem",
        // @ts-expect-error - test purposes
        md: "0.25rem",
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--radius-sm": "0.125rem",
      "--radius-md": "0.25rem",
    });
  });

  it("should generate CSS variables for typography fontFamily", () => {
    const override: ThemeOverride = {
      typography: {
        fontFamily: {
          sans: "Inter, sans-serif",
        },
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--font-family-sans": "Inter, sans-serif",
    });
  });

  it("should derive sans from googleFontUrl and omit googleFontUrl CSS variable", () => {
    const override: ThemeOverride = {
      typography: {
        fontFamily: {
          googleFontUrl: "https://fonts.googleapis.com/css2?family=Comic+Relief",
        },
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--font-family-sans": '"Comic Relief", sans-serif',
    });
  });

  it("should generate CSS variables for typography fontSize", () => {
    const override: ThemeOverride = {
      typography: {
        fontSize: {
          // @ts-expect-error - test purposes
          sm: "0.875rem",
          // @ts-expect-error - test purposes
          base: "1rem",
        },
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--font-size-sm": "0.875rem",
      "--font-size-base": "1rem",
    });
  });

  it("should generate CSS variables for typography fontWeight", () => {
    const override: ThemeOverride = {
      typography: {
        fontWeight: {
          normal: "400",
          bold: "700",
        },
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--font-weight-normal": "400",
      "--font-weight-bold": "700",
    });
  });

  it("should generate CSS variables for shadows", () => {
    const override: ThemeOverride = {
      shadows: {
        // @ts-expect-error - test purposes
        sm: "0 1px 2px rgba(0,0,0,0.1)",
        // @ts-expect-error - test purposes
        md: "0 4px 6px rgba(0,0,0,0.1)",
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--shadow-sm": "0 1px 2px rgba(0,0,0,0.1)",
      "--shadow-md": "0 4px 6px rgba(0,0,0,0.1)",
    });
  });

  it("should generate CSS variables for zIndex", () => {
    const override: ThemeOverride = {
      zIndex: {
        // @ts-expect-error - test purposes
        modal: "1000",
        // @ts-expect-error - test purposes
        tooltip: "2000",
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--z-index-modal": "1000",
      "--z-index-tooltip": "2000",
    });
  });

  it("should handle camelCase keys by converting to kebab-case", () => {
    const override: ThemeOverride = {
      colors: {
        interactive: {
          primaryHover: "#0052a3",
        },
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--color-interactive-primary-hover": "#0052a3",
    });
  });

  it("should handle nested objects", () => {
    const override: ThemeOverride = {
      colors: {
        status: {
          error: {
            background: "#f8d7da",
            border: "#f5c6cb",
            text: "#721c24",
          },
        },
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--color-status-error-background": "#f8d7da",
      "--color-status-error-border": "#f5c6cb",
      "--color-status-error-text": "#721c24",
    });
  });

  it("should handle multiple override types together", () => {
    const override: ThemeOverride = {
      colors: {
        background: {
          primary: "#ffffff",
        },
      },
      spacing: {
        1: "0.25rem",
      },
      radius: {
        // @ts-expect-error - test purposes
        sm: "0.125rem",
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--color-background-primary": "#ffffff",
      "--spacing-1": "0.25rem",
      "--radius-sm": "0.125rem",
    });
  });

  it("should ignore non-string values in nested objects", () => {
    const override = {
      colors: {
        background: {
          primary: "#ffffff",
          nested: {
            deep: { value: "#000000" },
          },
        },
      },
    };

    // @ts-expect-error - test purposes
    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--color-background-primary": "#ffffff",
      "--color-background-nested-deep-value": "#000000",
    });
  });

  it("should handle all typography fields together", () => {
    const override: ThemeOverride = {
      typography: {
        fontFamily: {
          sans: "Inter, sans-serif",
        },
        fontSize: {
          // @ts-expect-error - test purposes
          base: "1rem",
        },
        fontWeight: {
          bold: "700",
        },
      },
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--font-family-sans": "Inter, sans-serif",
      "--font-size-base": "1rem",
      "--font-weight-bold": "700",
    });
  });

  it("should handle empty typography object", () => {
    const override: ThemeOverride = {
      typography: {},
    };

    const result = generateCSSVariables(override);

    expect(result).toEqual({});
  });

  it("should skip non-object and array values", () => {
    const override = {
      colors: {
        background: {
          primary: "#ffffff",
          invalid: 123,
          arrayValue: ["value"],
        },
      },
    };

    // @ts-expect-error - test purposes
    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--color-background-primary": "#ffffff",
    });
  });

  it("should handle deeply nested objects with camelCase", () => {
    const override = {
      colors: {
        interactive: {
          primaryHover: "#test",
          secondaryActive: "#test2",
        },
      },
    };

    // @ts-expect-error - test purposes
    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--color-interactive-primary-hover": "#test",
      "--color-interactive-secondary-active": "#test2",
    });
  });

  it("should handle prefix-less keys (no prefix path)", () => {
    const override = {
      colors: {
        primary: "#ffffff",
      },
    };

    // @ts-expect-error - test purposes
    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--color-primary": "#ffffff",
    });
  });

  it("should skip null values", () => {
    const override = {
      colors: {
        background: {
          primary: "#ffffff",
          nullValue: null,
        },
      },
    };

    // @ts-expect-error - test purposes
    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--color-background-primary": "#ffffff",
    });
  });

  it("should handle top-level keys without prefix in nested recursion", () => {
    const override = {
      colors: {
        primary: "#ffffff",
        nested: {
          deepValue: "#000000",
        },
      },
    };

    // @ts-expect-error - test purposes
    const result = generateCSSVariables(override);

    expect(result).toEqual({
      "--color-primary": "#ffffff",
      "--color-nested-deep-value": "#000000",
    });
  });
});

describe("buildScopedThemeStyle", () => {
  it("merges base light tokens with color override", () => {
    const result = buildScopedThemeStyle("light", {
      colors: { background: { primary: "#aabbcc" } },
    });

    expect(result["--color-background-primary"]).toBe("#aabbcc");
    expect(result["--color-text-primary"]).toBe(colorTokens.light.text.primary);
  });

  it("returns base dark tokens when override is null", () => {
    const result = buildScopedThemeStyle("dark", null);

    expect(result["--color-background-primary"]).toBe(colorTokens.dark.background.primary);
  });

  it("uses colorsDark in dark mode when resolving scoped style", () => {
    const result = buildScopedThemeStyle("dark", {
      colorsLight: { background: { primary: "#ffffff" } },
      colorsDark: { background: { primary: "#112233" } },
    });

    expect(result["--color-background-primary"]).toBe("#112233");
  });

  it("uses colorsLight in light mode when resolving scoped style", () => {
    const result = buildScopedThemeStyle("light", {
      colorsDark: { background: { primary: "#112233" } },
      colorsLight: { background: { primary: "#eef0ff" } },
    });

    expect(result["--color-background-primary"]).toBe("#eef0ff");
  });
});

describe("mergeColorOverrideSlices", () => {
  it("merges legacy and mode-specific shallow category maps", () => {
    const result = mergeColorOverrideSlices(
      { background: { primary: "#aaa", secondary: "#bbb" } },
      { background: { primary: "#ccc" } },
    );

    expect(result?.background?.primary).toBe("#ccc");
    expect(result?.background?.secondary).toBe("#bbb");
  });

  it("deep-merges status groups such as promoted", () => {
    const result = mergeColorOverrideSlices(
      { status: { promoted: { background: "#aaa", text: "#bbb" } } },
      { status: { promoted: { text: "#ccc" } } },
    );

    expect(result?.status?.promoted?.background).toBe("#aaa");
    expect(result?.status?.promoted?.text).toBe("#ccc");
  });
});

describe("resolveThemeOverrideForMode", () => {
  it("combines legacy colors with mode slice for light", () => {
    const result = resolveThemeOverrideForMode(
      {
        colors: { interactive: { primary: "#111" } },
        colorsLight: { background: { primary: "#fff" } },
        colorsDark: { background: { primary: "#000" } },
      },
      "light",
    );

    expect(result?.colors?.background?.primary).toBe("#fff");
    expect(result?.colors?.interactive?.primary).toBe("#111");
  });

  it("combines legacy colors with mode slice for dark", () => {
    const result = resolveThemeOverrideForMode(
      {
        colors: { interactive: { primary: "#111" } },
        colorsLight: { background: { primary: "#fff" } },
        colorsDark: { background: { primary: "#000" } },
      },
      "dark",
    );

    expect(result?.colors?.background?.primary).toBe("#000");
    expect(result?.colors?.interactive?.primary).toBe("#111");
  });
});

describe("cssVariables Branch Coverage", () => {
  it("should handle null or empty overrides (Lines 9/16)", () => {
    // 1. Test with absolutely no color object
    // @ts-expect-error - test purposes
    const emptyOverride: ThemeOverride = { someOtherProp: true };
    const { result: resultEmpty } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider initialOverride={emptyOverride}>{children}</ThemeProvider>,
    });

    // 2. Test with null override (already partially covered, but ensure it's explicitly hit)
    const { result: resultNull } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        // @ts-expect-error - test purposes
        <ThemeProvider initialOverride={null}>{children}</ThemeProvider>
      ),
    });

    expect(resultNull.current.override).toBeNull();
    expect(resultEmpty.current.colors).toBeDefined();
  });

  it("should cover flattenToCSSVariables without prefix (Line 9/16 branches)", () => {
    const input = { "test-var": "value", nested: { item: "val" } };
    const result = flattenToCSSVariables(input);

    expect(result["--test-var"]).toBe("value");
    expect(result["--nested-item"]).toBe("val");
  });

  it("should handle null and array values in recursion (Line 15 branches)", () => {
    const input = {
      valid: "ok",
      invalidNull: null,
      invalidArray: [1, 2],
    };
    // @ts-expect-error - test purposes
    const result = flattenToCSSVariables(input as unknown, "test");

    expect(result["--test-valid"]).toBe("ok");
    expect(result["--test-invalid-null"]).toBeUndefined();
    expect(result["--test-invalid-array"]).toBeUndefined();
  });
});
