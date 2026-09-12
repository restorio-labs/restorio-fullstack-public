/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { FormControl } from "../../../../src/components/forms/FormControl";

describe("FormControl", () => {
  it("renders a div element", () => {
    render(<FormControl data-testid="test-control">Content</FormControl>);

    const control = screen.getByTestId("test-control");

    expect(control.tagName).toBe("DIV");
  });

  it("applies relative positioning", () => {
    render(<FormControl data-testid="test-control">Content</FormControl>);

    const control = screen.getByTestId("test-control");

    // @ts-expect-error - test purposes
    expect(control).toHaveClass("relative");
  });

  it("applies full width class", () => {
    render(<FormControl data-testid="test-control">Content</FormControl>);

    const control = screen.getByTestId("test-control");

    // @ts-expect-error - test purposes
    expect(control).toHaveClass("w-full");
  });

  it("applies form-control-invalid class when isInvalid is true", () => {
    render(
      <FormControl isInvalid data-testid="test-control">
        Content
      </FormControl>,
    );

    const control = screen.getByTestId("test-control");

    // @ts-expect-error - test purposes
    expect(control).toHaveClass("form-control-invalid");
  });

  it("does not apply form-control-invalid class when isInvalid is false", () => {
    render(<FormControl data-testid="test-control">Content</FormControl>);

    const control = screen.getByTestId("test-control");

    // @ts-expect-error - test purposes
    expect(control).not.toHaveClass("form-control-invalid");
  });

  it("forwards custom className", () => {
    render(
      <FormControl className="custom-class" data-testid="test-control">
        Content
      </FormControl>,
    );

    const control = screen.getByTestId("test-control");

    // @ts-expect-error - test purposes
    expect(control).toHaveClass("custom-class");
    // @ts-expect-error - test purposes
    expect(control).toHaveClass("w-full");
  });

  it("renders children correctly", () => {
    render(
      <FormControl data-testid="test-control">
        <input type="text" data-testid="child-input" />
      </FormControl>,
    );

    // @ts-expect-error - test purposes
    expect(screen.getByTestId("child-input")).toBeInTheDocument();
  });

  it("forwards additional props", () => {
    render(
      <FormControl data-testid="test-control" aria-label="Test control">
        Content
      </FormControl>,
    );

    const control = screen.getByTestId("test-control");

    // @ts-expect-error - test purposes
    expect(control).toHaveAttribute("aria-label", "Test control");
  });
});
