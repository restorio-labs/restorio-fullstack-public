import { describe, expect, it } from "vitest";

import {
  buildSansFontFamilyFromGoogleFontUrl,
  parseGoogleFontFamiliesFromStylesheetUrl,
  resolveGoogleFontStylesheetHref,
} from "../../../src/theme/googleFonts";
import type { ThemeOverride } from "../../../src/tokens/types";

describe("parseGoogleFontFamiliesFromStylesheetUrl", () => {
  it("parses a single Google Fonts css2 family", () => {
    expect(
      parseGoogleFontFamiliesFromStylesheetUrl("https://fonts.googleapis.com/css2?family=Comic+Relief"),
    ).toEqual(["Comic Relief"]);
  });

  it("parses multiple families and strips weight axis", () => {
    expect(
      parseGoogleFontFamiliesFromStylesheetUrl(
        "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans",
      ),
    ).toEqual(["Roboto", "Open Sans"]);
  });

  it("returns an empty array for invalid URLs", () => {
    expect(parseGoogleFontFamiliesFromStylesheetUrl("https://example.com/font.css")).toEqual([]);
  });
});

describe("buildSansFontFamilyFromGoogleFontUrl", () => {
  it("builds a CSS font-family stack with quoted multi-word names", () => {
    expect(buildSansFontFamilyFromGoogleFontUrl("https://fonts.googleapis.com/css2?family=Comic+Relief")).toBe(
      '"Comic Relief", sans-serif',
    );
  });
});

describe("resolveGoogleFontStylesheetHref", () => {
  it("reads googleFontUrl from theme override typography", () => {
    const override: ThemeOverride = {
      typography: {
        fontFamily: {
          googleFontUrl: "https://fonts.googleapis.com/css2?family=Comic+Relief",
        },
      },
    };

    expect(resolveGoogleFontStylesheetHref(override)).toBe("https://fonts.googleapis.com/css2?family=Comic+Relief");
  });
});
