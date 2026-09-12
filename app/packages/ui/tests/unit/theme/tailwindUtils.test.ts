import { describe, expect, it } from "vitest";

import {
  createTailwindConfig,
  createTailwindThemeConfig,
  flattenColorVars,
  getTypographyFontSize,
} from "../../../src/theme/tailwindUtils";
import { typographyTokens } from "../../../src/tokens/typography";

describe("flattenColorVars", () => {
  it("keeps token keys but kebab-cases CSS variable names", () => {
    const input = {
      interactive: {
        primary: "#0066cc",
        primaryHover: "#0052a3",
        primaryActive: "#004080",
      },
    };

    const result = flattenColorVars(input);

    expect(result).toEqual({
      "interactive-primary": "var(--color-interactive-primary)",
      "interactive-primaryHover": "var(--color-interactive-primary-hover)",
      "interactive-primaryActive": "var(--color-interactive-primary-active)",
    });
  });

  it("kebab-cases nested camelCase variable segments", () => {
    const input = {
      status: {
        error: {
          borderStrong: "#f00",
        },
      },
    };

    const result = flattenColorVars(input);

    expect(result["status-error-borderStrong"]).toBe("var(--color-status-error-border-strong)");
  });

  it("ignores null values", () => {
    const input = {
      interactive: {
        primary: "#0066cc",
        primaryHover: null,
      },
    };

    const result = flattenColorVars(input);

    expect(result["interactive-primary"]).toBe("var(--color-interactive-primary)");
    expect(result["interactive-primaryHover"]).toBeUndefined();
  });
});

describe("getTypographyFontSize", () => {
  it("clones lineHeight objects for tuple font sizes", () => {
    const result = getTypographyFontSize();
    const base = result.base as [string, { lineHeight: string }];
    const original = typographyTokens.fontSize.base;

    expect(base[0]).toBe(original[0]);
    expect(base[1]).toEqual(original[1]);
    expect(base[1]).not.toBe(original[1]);
  });

  it("returns raw value when font size token is not a tuple", () => {
    const fontSize = typographyTokens.fontSize as Record<string, unknown>;

    fontSize.custom = "1.125rem";

    try {
      const result = getTypographyFontSize();

      expect(result.custom).toBe("1.125rem");
    } finally {
      delete fontSize.custom;
    }
  });
});

describe("createTailwindThemeConfig", () => {
  it("maps interactive hover token to kebab-case CSS variable", () => {
    const theme = createTailwindThemeConfig();
    const colors = theme?.extend?.colors as Record<string, string>;

    expect(colors["interactive-primaryHover"]).toBe("var(--color-interactive-primary-hover)");
  });
});

describe("createTailwindConfig", () => {
  it("uses provided content as-is when uiPackagePath is not set", () => {
    const content = ["./src/**/*.{ts,tsx}"];
    const config = createTailwindConfig({ content });

    expect(config.content).toEqual(content);
    expect(config.plugins).toHaveLength(1);
  });

  it("appends ui package src glob when uiPackagePath is set", () => {
    const content = ["./apps/web/**/*.{ts,tsx}"];
    const config = createTailwindConfig({
      content,
      uiPackagePath: "../../packages/ui",
    });

    expect(config.content).toEqual([...content, "../../packages/ui/src/**/*.{ts,tsx}"]);
  });
});
