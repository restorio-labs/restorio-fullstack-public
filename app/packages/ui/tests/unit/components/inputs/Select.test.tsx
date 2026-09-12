/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { Select } from "../../../../src/components/inputs/Select";

const options = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3", disabled: true },
];

describe("Select", () => {
  it("should render select element", () => {
    render(<Select options={options} />);
    expect(screen.getByRole("combobox")).toBeDefined();
  });

  it("should render with label", () => {
    render(<Select label="Choose option" options={options} />);
    expect(screen.getByText("Choose option")).toBeDefined();
    expect(screen.getByLabelText("Choose option")).toBeDefined();
  });

  it("should render all options", () => {
    render(<Select options={options} />);
    expect(screen.getByText("Option 1")).toBeDefined();
    expect(screen.getByText("Option 2")).toBeDefined();
    expect(screen.getByText("Option 3")).toBeDefined();
  });

  it("should render placeholder when provided", () => {
    render(<Select options={options} placeholder="Select an option" />);
    expect(screen.getByText("Select an option")).toBeDefined();
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Select options={options} disabled />);

    const selectElement = screen.getByRole("combobox");

    // @ts-expect-error - test purposes
    expect(selectElement).toBeDisabled();
  });

  it("should render error message when error prop is provided", () => {
    render(<Select options={options} error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeDefined();
    // @ts-expect-error - test purposes
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
  });

  it("should render helper text when provided", () => {
    render(<Select options={options} helperText="Select an option from the list" />);
    expect(screen.getByText("Select an option from the list")).toBeDefined();
  });

  it("should handle selection change", async () => {
    const user = userEvent.setup();

    render(<Select options={options} />);
    const select = screen.getByRole("combobox");

    await user.selectOptions(select, "option1");
    // @ts-expect-error - test purposes
    expect(select).toHaveValue("option1");
  });

  it("should forward ref", () => {
    const ref = vi.fn();

    render(<Select options={options} ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("should have proper aria attributes for error", () => {
    render(<Select options={options} error="Error message" id="test-select" />);
    const select = screen.getByRole("combobox");

    // @ts-expect-error - test purposes
    expect(select).toHaveAttribute("aria-invalid", "true");
    // @ts-expect-error - test purposes
    expect(select).toHaveAttribute("aria-describedby", expect.stringContaining("-error"));
  });
});
