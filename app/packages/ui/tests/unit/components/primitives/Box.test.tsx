/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { Box } from "../../../../src/components/primitives/Box";

describe("Box", () => {
  it("should render children", () => {
    render(<Box>Box content</Box>);
    // @ts-expect-error - test purposes
    expect(screen.getByText("Box content")).toBeInTheDocument();
  });

  it("should render as div by default", () => {
    render(<Box>Default</Box>);
    expect(screen.getByText("Default").tagName).toBe("DIV");
  });

  it("should render as custom element when as prop is provided", () => {
    render(<Box as="section">Section</Box>);
    expect(screen.getByText("Section").tagName).toBe("SECTION");
  });

  it("should apply custom className", () => {
    render(<Box className="custom-class">Custom</Box>);
    expect(screen.getByText("Custom").className).toContain("custom-class");
  });

  it("should forward ref", () => {
    const ref = vi.fn();

    render(<Box ref={ref}>Ref</Box>);
    expect(ref).toHaveBeenCalled();
  });
});
