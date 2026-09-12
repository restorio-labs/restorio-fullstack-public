/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { Stack } from "../../../../src/components/primitives/Stack";

describe("Stack", () => {
  it("should render children", () => {
    render(
      <Stack>
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>,
    );
    // @ts-expect-error - test purposes
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    // @ts-expect-error - test purposes
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("should render as div by default", () => {
    render(<Stack>Content</Stack>);
    expect(screen.getByText("Content").tagName).toBe("DIV");
  });

  it("should apply column direction by default", () => {
    render(<Stack>Content</Stack>);
    expect(screen.getByText("Content").className).toContain("flex-col");
  });

  it("should apply row direction when specified", () => {
    render(<Stack direction="row">Content</Stack>);
    expect(screen.getByText("Content").className).toContain("flex-row");
  });

  it("should apply spacing classes", () => {
    const { rerender } = render(<Stack spacing="xs">Content</Stack>);

    expect(screen.getByText("Content").className).toContain("gap-xs");

    rerender(<Stack spacing="md">Content</Stack>);
    expect(screen.getByText("Content").className).toContain("gap-md");
  });

  it("should apply alignment classes", () => {
    const { rerender } = render(<Stack align="start">Content</Stack>);

    expect(screen.getByText("Content").className).toContain("items-start");

    rerender(<Stack align="center">Content</Stack>);
    expect(screen.getByText("Content").className).toContain("items-center");
  });

  it("should apply justify classes", () => {
    const { rerender } = render(<Stack justify="start">Content</Stack>);

    expect(screen.getByText("Content").className).toContain("justify-start");

    rerender(<Stack justify="between">Content</Stack>);
    expect(screen.getByText("Content").className).toContain("justify-between");
  });

  it("should apply wrap class when wrap is true", () => {
    const { container } = render(<Stack wrap>Content</Stack>);
    const stackElement = container.querySelector(".flex");

    expect(stackElement?.className).toContain("flex-wrap");
  });

  it("should forward ref", () => {
    const ref = vi.fn();

    render(<Stack ref={ref}>Ref</Stack>);

    expect(ref).toHaveBeenCalled();
  });
});
