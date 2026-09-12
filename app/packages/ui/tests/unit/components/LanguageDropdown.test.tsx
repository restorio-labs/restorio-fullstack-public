import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LanguageDropdown } from "../../../src/components/LanguageDropdown";

const options = [
  { value: "en", label: "English" },
  { value: "pl", label: "Polski" },
  { value: "de", label: "Deutsch", disabled: true },
];

describe("LanguageDropdown", () => {
  it("renders current label and supports aria-labelledby", () => {
    render(
      <>
        <span id="lang-label">Language</span>
        <LanguageDropdown value="en" options={options} onSelect={vi.fn()} ariaLabelledBy="lang-label" />
      </>,
    );

    const trigger = screen.getByText("English", { selector: "button" });

    expect(trigger.textContent).toContain("English");
    expect(trigger.getAttribute("aria-labelledby")).toBe("lang-label");
    expect(trigger.getAttribute("aria-label")).toBeNull();
  });

  it("falls back to raw value when option is missing", () => {
    render(<LanguageDropdown value="es" options={options} onSelect={vi.fn()} ariaLabel="language" />);

    expect(screen.getByRole("button", { name: "language" }).textContent).toContain("es");
  });

  it("selects enabled option and keeps disabled option non-interactive", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(<LanguageDropdown value="en" options={options} onSelect={onSelect} ariaLabel="language" />);

    await user.click(screen.getByText("English"));

    await user.click(screen.getByRole("button", { name: "Polski" }));
    expect(onSelect).toHaveBeenCalledWith("pl");

    await user.click(screen.getByText("English"));
    const disabledOption = screen.getByRole("button", { name: "Deutsch" });
    expect(disabledOption.getAttribute("disabled")).not.toBeNull();

    await user.click(disabledOption);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
