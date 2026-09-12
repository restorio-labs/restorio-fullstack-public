import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/storage", () => ({
  getCrossAppValue: vi.fn(),
  setCrossAppValue: vi.fn(),
}));

import { getCrossAppValue } from "../../src/storage";
import { resolveLocale } from "../../src/i18n/resolveLocale";

describe("resolveLocale", () => {
  const supportedLocales = ["en", "pl", "de"];
  const defaultLocale = "en";

  beforeEach(() => {
    vi.mocked(getCrossAppValue).mockReturnValue(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns defaultLocale when window is undefined", () => {
    const win = globalThis.window;

    (globalThis as { window?: undefined }).window = undefined;

    expect(
      resolveLocale({
        supportedLocales,
        defaultLocale,
      }),
    ).toBe(defaultLocale);

    (globalThis as { window: unknown }).window = win;
  });

  it("returns stored locale when storageKey is provided and value is supported", () => {
    vi.mocked(getCrossAppValue).mockReturnValue("pl");
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", { documentElement: { lang: "" } });
    vi.stubGlobal("navigator", { language: "en" });

    expect(
      resolveLocale({
        supportedLocales,
        defaultLocale,
        storageKey: "lang",
      }),
    ).toBe("pl");
  });

  it("uses document.documentElement.lang when supported", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", { documentElement: { lang: "de" } });
    vi.stubGlobal("navigator", { language: "en" });

    expect(
      resolveLocale({
        supportedLocales,
        defaultLocale,
      }),
    ).toBe("de");
  });

  it("uses navigator.language when document lang is empty", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", { documentElement: { lang: "" } });
    vi.stubGlobal("navigator", { language: "pl" });

    expect(
      resolveLocale({
        supportedLocales,
        defaultLocale,
      }),
    ).toBe("pl");
  });

  it("returns defaultLocale when no candidate is supported", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", { documentElement: { lang: "fr" } });
    vi.stubGlobal("navigator", { language: "ja" });

    expect(
      resolveLocale({
        supportedLocales,
        defaultLocale,
      }),
    ).toBe(defaultLocale);
  });

  it("normalizes locale to language part lowercase", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("document", { documentElement: { lang: "pl-PL" } });
    vi.stubGlobal("navigator", { language: "en" });

    expect(
      resolveLocale({
        supportedLocales,
        defaultLocale,
      }),
    ).toBe("pl");
  });
});
