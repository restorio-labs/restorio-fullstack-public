/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { FormDescription } from "../../../../src/components/forms/FormDescription";

describe("FormDescription", () => {
  it("renders a paragraph element", () => {
    render(<FormDescription>Description text</FormDescription>);

    const description = screen.getByText("Description text");

    expect(description.tagName).toBe("P");
  });

  it("applies correct text styling", () => {
    render(<FormDescription>Description text</FormDescription>);

    const description = screen.getByText("Description text");

    // @ts-expect-error - test purposes
    expect(description).toHaveClass("text-sm");
    // @ts-expect-error - test purposes
    expect(description).toHaveClass("text-text-secondary");
  });

  it("forwards custom className", () => {
    render(<FormDescription className="custom-class">Description text</FormDescription>);

    const description = screen.getByText("Description text");

    // @ts-expect-error - test purposes
    expect(description).toHaveClass("custom-class");
    // @ts-expect-error - test purposes
    expect(description).toHaveClass("text-sm");
  });

  it("renders children correctly", () => {
    render(
      <FormDescription>
        <span>Custom content</span>
      </FormDescription>,
    );

    // @ts-expect-error - test purposes
    expect(screen.getByText("Custom content")).toBeInTheDocument();
  });

  it("forwards id prop", () => {
    render(<FormDescription id="desc-1">Description text</FormDescription>);

    const description = screen.getByText("Description text");

    // @ts-expect-error - test purposes
    expect(description).toHaveAttribute("id", "desc-1");
  });

  it("forwards additional props", () => {
    render(
      <FormDescription data-testid="test-description" aria-label="Field description">
        Description text
      </FormDescription>,
    );

    const description = screen.getByTestId("test-description");

    // @ts-expect-error - test purposes
    expect(description).toHaveAttribute("aria-label", "Field description");
  });
});
