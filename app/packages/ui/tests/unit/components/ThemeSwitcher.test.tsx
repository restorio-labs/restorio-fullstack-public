import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { ThemeSwitcher } from "../../../src/components/ThemeSwitcher";
import { I18nProvider } from "../../../src/providers/I18nProvider";
import { ThemeProvider } from "../../../src/theme/ThemeProvider";

const themeMessages = {
  themeSwitcher: {
    light: "Light",
    dark: "Dark",
    ariaLabel: "Current theme: {{theme}}. Click to cycle theme.",
  },
};

const renderWithProviders = (ui: ReactElement) =>
  render(
    <I18nProvider locale="en" messages={themeMessages}>
      {ui}
    </I18nProvider>,
  );

describe("ThemeSwitcher", () => {
  it("renders with default mode", () => {
    renderWithProviders(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button")).toBeDefined();
  });

  it("toggles between light and dark modes", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <ThemeProvider defaultMode="light">
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button");

    expect(button.getAttribute("aria-label")).toContain("Light");

    await user.click(button);

    expect(button.getAttribute("aria-label")).toContain("Dark");

    await user.click(button);

    expect(button.getAttribute("aria-label")).toContain("Light");
  });

  it("shows label when showLabel is true", () => {
    renderWithProviders(
      <ThemeProvider defaultMode="light">
        <ThemeSwitcher showLabel />
      </ThemeProvider>,
    );

    expect(screen.getByText("Light")).toBeDefined();
  });

  it("hides label when showLabel is false", () => {
    renderWithProviders(
      <ThemeProvider defaultMode="dark">
        <ThemeSwitcher showLabel={false} />
      </ThemeProvider>,
    );

    expect(screen.queryByText("Dark")).toBeNull();
  });

  it("applies custom className", () => {
    renderWithProviders(
      <ThemeProvider>
        <ThemeSwitcher className="custom-class" />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button");

    expect(button.className).toContain("custom-class");
  });
});
