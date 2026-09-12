/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { Input } from "../../../../src/components/inputs/Input";

describe("Input", () => {
  it("should render input element", () => {
    render(<Input />);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should render with label", () => {
    render(<Input label="Email" />);

    // @ts-expect-error - test purposes
    expect(screen.getByText("Email")).toBeInTheDocument();
    // @ts-expect-error - test purposes
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("should render error message when error prop is provided", () => {
    render(<Input error="This field is required" />);

    // @ts-expect-error - test purposes
    expect(screen.getByText("This field is required")).toBeInTheDocument();
    // @ts-expect-error - test purposes
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("should render helper text when provided", () => {
    render(<Input helperText="Enter your email address" />);
    // @ts-expect-error - test purposes
    expect(screen.getByText("Enter your email address")).toBeInTheDocument();
  });

  it("should render label tooltip trigger when labelTooltip is provided", () => {
    render(<Input label="Logo" labelTooltip="PNG or JPEG, max 5 MB" />);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("button", { name: "PNG or JPEG, max 5 MB" })).toBeInTheDocument();
  });

  it("should not show helper text when error is present", () => {
    render(<Input error="Error" helperText="Helper" />);
    // @ts-expect-error - test purposes
    expect(screen.getByText("Error")).toBeInTheDocument();
    // @ts-expect-error - test purposes
    expect(screen.queryByText("Helper")).not.toBeInTheDocument();
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Input disabled />);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("should handle user input", async () => {
    const user = userEvent.setup();

    render(<Input />);
    const input = screen.getByRole("textbox");

    await user.type(input, "test@example.com");
    // @ts-expect-error - test purposes
    expect(input).toHaveValue("test@example.com");
  });

  it("should forward ref", () => {
    const ref = vi.fn();

    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("should have proper aria attributes for error", () => {
    render(<Input error="Error message" id="test-input" />);
    const input = screen.getByRole("textbox");

    // @ts-expect-error - test purposes
    expect(input).toHaveAttribute("aria-invalid", "true");
    // @ts-expect-error - test purposes
    expect(input).toHaveAttribute("aria-describedby", expect.stringContaining("-error"));
  });
});
