import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider, createTranslator, useI18n } from "../../../src/providers/I18nProvider";

describe("I18nProvider", () => {
  it("createTranslator resolves nested messages with interpolation and fallback", () => {
    const t = createTranslator(
      {
        greeting: "Hello {{name}}",
      },
      {
        common: { title: "Fallback title" },
      },
    );

    expect(t("greeting", { name: "Alex" })).toBe("Hello Alex");
    expect(t("common.title")).toBe("Fallback title");
    expect(t("missing.key")).toBe("missing.key");
  });

  it("provides locale, translation and setLocale", async () => {
    const user = userEvent.setup();
    const setLocale = vi.fn();

    const Consumer = () => {
      const { locale, t, setLocale: setLocaleContext } = useI18n();

      return (
        <>
          <span>{locale}</span>
          <span>{t("home.title")}</span>
          <button type="button" onClick={() => setLocaleContext("pl")}>
            set-pl
          </button>
          <button type="button" onClick={() => setLocaleContext("   ")}>
            set-empty
          </button>
        </>
      );
    };

    render(
      <I18nProvider locale="en" messages={{ home: { title: "Home" } }} setLocale={setLocale}>
        <Consumer />
      </I18nProvider>,
    );

    expect(screen.getByText("en")).toBeDefined();
    expect(screen.getByText("Home")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "set-pl" }));
    await user.click(screen.getByRole("button", { name: "set-empty" }));

    expect(setLocale).toHaveBeenCalledTimes(1);
    expect(setLocale).toHaveBeenCalledWith("pl");
  });

  it("useI18n throws outside provider", () => {
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      expect(() => renderHook(() => useI18n())).toThrow("I18nProvider is missing");
    } finally {
      stderrWrite.mockRestore();
      consoleError.mockRestore();
    }
  });
});
