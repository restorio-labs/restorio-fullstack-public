/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { Checkbox } from "../../../../src/components/inputs/Checkbox";

describe("Checkbox", () => {
  it("should render checkbox element", () => {
    render(<Checkbox />);

    expect(screen.getByRole("checkbox")).toBeDefined();
  });

  it("should render with label", () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByText("Accept terms")).toBeDefined();
    expect(screen.getByLabelText("Accept terms")).toBeDefined();
  });

  it("should be unchecked by default", () => {
    render(<Checkbox />);

    // @ts-expect-error - test purposes
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("should be checked when checked prop is true", () => {
    render(<Checkbox checked onChange={vi.fn()} />);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("should toggle when clicked", async () => {
    const user = userEvent.setup();

    render(<Checkbox />);
    const checkbox = screen.getByRole("checkbox");

    await user.click(checkbox);
    // @ts-expect-error - test purposes
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    // @ts-expect-error - test purposes
    expect(checkbox).not.toBeChecked();
  });

  it("should render error message when error prop is provided", () => {
    render(<Checkbox error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeDefined();

    // @ts-expect-error - test purposes
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Checkbox disabled />);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("should forward ref", () => {
    const ref = vi.fn();

    render(<Checkbox ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("should have proper aria attributes for error", () => {
    render(<Checkbox error="Error message" id="test-checkbox" />);
    const checkbox = screen.getByRole("checkbox");

    // @ts-expect-error - test purposes
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    // @ts-expect-error - test purposes
    expect(checkbox).toHaveAttribute("aria-describedby", expect.stringContaining("-error"));
  });
});
