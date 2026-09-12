/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { Text } from "../../../../src/components/primitives/Text";

describe("Text", () => {
  it("should render text content", () => {
    render(<Text>Hello World</Text>);
    // @ts-expect-error - test purposes
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("should render as div by default", () => {
    render(<Text>Default</Text>);
    expect(screen.getByText("Default").tagName).toBe("DIV");
  });

  it("should render as custom element when as prop is provided", () => {
    render(<Text as="p">Paragraph</Text>);
    expect(screen.getByText("Paragraph").tagName).toBe("P");
  });

  it("should apply variant styles", () => {
    const { rerender } = render(<Text variant="h1">Heading 1</Text>);

    expect(screen.getByText("Heading 1").className).toContain("text-4xl");

    rerender(<Text variant="h2">Heading 2</Text>);
    expect(screen.getByText("Heading 2").className).toContain("text-3xl");

    rerender(<Text variant="body-md">Body</Text>);
    expect(screen.getByText("Body").className).toContain("text-base");
  });

  it("should apply weight styles", () => {
    const { rerender } = render(<Text weight="regular">Regular</Text>);

    expect(screen.getByText("Regular").className).toContain("font-normal");

    rerender(<Text weight="bold">Bold</Text>);
    expect(screen.getByText("Bold").className).toContain("font-bold");
  });

  it("should apply alignment styles", () => {
    const { rerender } = render(<Text align="start">Start</Text>);

    expect(screen.getByText("Start").className).toContain("text-start");

    rerender(<Text align="center">Center</Text>);
    expect(screen.getByText("Center").className).toContain("text-center");

    rerender(<Text align="end">End</Text>);
    expect(screen.getByText("End").className).toContain("text-end");
  });

  it("should forward ref", () => {
    const ref = vi.fn();

    render(<Text ref={ref}>Ref</Text>);
    expect(ref).toHaveBeenCalled();
  });
});
