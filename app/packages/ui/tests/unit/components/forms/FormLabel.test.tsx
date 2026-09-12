/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormLabel } from "../../../../src/components/forms/FormLabel";

describe("FormLabel", () => {
  it("renders a label element", () => {
    render(<FormLabel htmlFor="test-input">Label Text</FormLabel>);

    const label = screen.getByText("Label Text");

    expect(label.tagName).toBe("LABEL");
  });

  it("associates with input via htmlFor", () => {
    render(<FormLabel htmlFor="test-input">Email</FormLabel>);

    const label = screen.getByText("Email");

    expect(label.htmlFor).toBe("test-input");
  });

  it("displays required indicator when required prop is true", () => {
    render(
      <FormLabel htmlFor="test-input" required>
        Email
      </FormLabel>,
    );

    const asterisk = screen.getByText("*");

    expect(asterisk).toBeInTheDocument();
    expect(asterisk).toHaveClass("text-status-error-text");
    expect(asterisk).toHaveAttribute("aria-label", "required");
  });

  it("does not display required indicator when required prop is false", () => {
    render(<FormLabel htmlFor="test-input">Email</FormLabel>);

    const asterisk = screen.queryByText("*");

    expect(asterisk).not.toBeInTheDocument();
  });

  it("applies disabled styling when disabled prop is true", () => {
    render(
      <FormLabel htmlFor="test-input" disabled>
        Email
      </FormLabel>,
    );

    const label = screen.getByText("Email");

    expect(label).toHaveClass("opacity-50");
    expect(label).toHaveClass("cursor-not-allowed");
  });

  it("does not apply disabled styling when disabled prop is false", () => {
    render(<FormLabel htmlFor="test-input">Email</FormLabel>);

    const label = screen.getByText("Email");

    expect(label).not.toHaveClass("opacity-50");
    expect(label).not.toHaveClass("cursor-not-allowed");
  });

  it("forwards custom className", () => {
    render(
      <FormLabel htmlFor="test-input" className="custom-class">
        Email
      </FormLabel>,
    );

    const label = screen.getByText("Email");

    expect(label).toHaveClass("custom-class");
    expect(label).toHaveClass("text-text-primary");
  });

  it("renders with both required and disabled states", () => {
    render(
      <FormLabel htmlFor="test-input" required disabled>
        Email
      </FormLabel>,
    );

    const label = screen.getByText("Email");

    expect(label).toHaveClass("opacity-50");

    const asterisk = screen.getByText("*");

    expect(asterisk).toBeInTheDocument();
  });

  it("renders children correctly", () => {
    render(
      <FormLabel htmlFor="test-input">
        <span>Custom Label Content</span>
      </FormLabel>,
    );

    expect(screen.getByText("Custom Label Content")).toBeInTheDocument();
  });
});
