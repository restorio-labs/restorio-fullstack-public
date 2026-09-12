/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormField } from "../../../../src/components/forms/FormField";

describe("FormField", () => {
  it("renders a div element", () => {
    render(<FormField data-testid="test-field">Content</FormField>);

    const field = screen.getByTestId("test-field");

    expect(field.tagName).toBe("DIV");
  });

  it("applies default spacing class", () => {
    render(<FormField data-testid="test-field">Content</FormField>);

    const field = screen.getByTestId("test-field");

    expect(field).toHaveClass("space-y-1.5");
  });

  it("forwards custom className", () => {
    render(
      <FormField className="custom-class" data-testid="test-field">
        Content
      </FormField>,
    );

    const field = screen.getByTestId("test-field");

    expect(field).toHaveClass("custom-class");
    expect(field).toHaveClass("space-y-1.5");
  });

  it("renders children correctly", () => {
    render(
      <FormField data-testid="test-field">
        <label>Label</label>
        <input type="text" />
      </FormField>,
    );

    expect(screen.getByText("Label")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("supports required prop for context", () => {
    render(
      <FormField required data-testid="test-field">
        Content
      </FormField>,
    );

    const field = screen.getByTestId("test-field");

    expect(field).toBeInTheDocument();
  });

  it("supports disabled prop for context", () => {
    render(
      <FormField disabled data-testid="test-field">
        Content
      </FormField>,
    );

    const field = screen.getByTestId("test-field");

    expect(field).toBeInTheDocument();
  });
});
