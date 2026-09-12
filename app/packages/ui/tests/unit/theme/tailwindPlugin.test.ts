import { describe, expect, it, vi } from "vitest";

import { themePlugin } from "../../../src/theme/tailwindPlugin";
import { colorTokens } from "../../../src/tokens/colors";

describe("themePlugin", () => {
  it("registers light and dark CSS color variables with addBase", () => {
    const addBase = vi.fn();

    themePlugin({ addBase } as unknown as Parameters<typeof themePlugin>[0]);

    expect(addBase).toHaveBeenCalledTimes(1);
    const baseStyles = addBase.mock.calls[0][0] as Record<string, Record<string, string>>;

    expect(baseStyles).toHaveProperty(":root");
    expect(baseStyles).toHaveProperty('[data-theme="dark"]');
    expect(baseStyles).toHaveProperty(".dark");
  });

  it("flattens nested tokens and converts camelCase keys to kebab-case vars", () => {
    const addBase = vi.fn();

    themePlugin({ addBase } as unknown as Parameters<typeof themePlugin>[0]);

    const baseStyles = addBase.mock.calls[0][0] as Record<string, Record<string, string>>;
    const lightVars = baseStyles[":root"];
    const darkVars = baseStyles['[data-theme="dark"]'];
    const darkClassVars = baseStyles[".dark"];

    expect(lightVars["--color-interactive-primary-hover"]).toBe(colorTokens.light.interactive.primaryHover);
    expect(darkVars["--color-interactive-primary-hover"]).toBe(colorTokens.dark.interactive.primaryHover);
    expect(lightVars["--color-status-error-border"]).toBe(colorTokens.light.status.error.border);
    expect(darkClassVars).toEqual(darkVars);
  });

  it("ignores array values while flattening token objects", () => {
    const addBase = vi.fn();
    const light = colorTokens.light as Record<string, unknown>;
    const dark = colorTokens.dark as Record<string, unknown>;

    light.arrayToken = ["#111111"];
    dark.arrayToken = ["#222222"];

    try {
      themePlugin({ addBase } as unknown as Parameters<typeof themePlugin>[0]);

      const baseStyles = addBase.mock.calls[0][0] as Record<string, Record<string, string>>;

      expect(baseStyles[":root"]["--color-array-token"]).toBeUndefined();
      expect(baseStyles['[data-theme="dark"]']["--color-array-token"]).toBeUndefined();
    } finally {
      delete light.arrayToken;
      delete dark.arrayToken;
    }
  });
});
