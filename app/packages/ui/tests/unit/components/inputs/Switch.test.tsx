/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { Switch } from "../../../../src/components/inputs/Switch";

describe("Switch", () => {
  it("should render switch element", () => {
    render(<Switch />);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("should render with label", () => {
    render(<Switch label="Enable notifications" />);
    // @ts-expect-error - test purposes
    expect(screen.getByText("Enable notifications")).toBeInTheDocument();
    // @ts-expect-error - test purposes
    expect(screen.getByLabelText("Enable notifications")).toBeInTheDocument();
  });

  it("should be unchecked by default", () => {
    render(<Switch />);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("should be checked when checked prop is true", () => {
    render(<Switch checked onChange={vi.fn()} />);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("should toggle when clicked", async () => {
    const user = userEvent.setup();

    render(<Switch />);
    const switchElement = screen.getByRole("switch");

    await user.click(switchElement);
    // @ts-expect-error - test purposes
    expect(switchElement).toBeChecked();

    await user.click(switchElement);
    // @ts-expect-error - test purposes
    expect(switchElement).not.toBeChecked();
  });

  it("should render error message when error prop is provided", () => {
    render(<Switch error="This field is required" />);
    // @ts-expect-error - test purposes
    expect(screen.getByText("This field is required")).toBeInTheDocument();
    // @ts-expect-error - test purposes
    expect(screen.getByRole("switch")).toHaveAttribute("aria-invalid", "true");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Switch disabled />);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("should forward ref", () => {
    const ref = vi.fn();

    render(<Switch ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("should have proper aria attributes for error", () => {
    render(<Switch error="Error message" id="test-switch" />);
    const switchElement = screen.getByRole("switch");

    // @ts-expect-error - test purposes
    expect(switchElement).toHaveAttribute("aria-invalid", "true");
    // @ts-expect-error - test purposes
    expect(switchElement).toHaveAttribute("aria-describedby", expect.stringContaining("-error"));
  });
});
