/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { Skeleton } from "../../../../src/components/feedback/Skeleton";

describe("Skeleton", () => {
  it("should render skeleton element", () => {
    const { container } = render(<Skeleton />);

    expect(container.firstChild).toBeDefined();
  });

  it("should apply rectangular variant by default", () => {
    const { container } = render(<Skeleton />);

    expect((container.firstChild as HTMLElement).className).toContain("rounded-md");
  });

  it("should apply variant styles", () => {
    const { container, rerender } = render(<Skeleton variant="text" />);

    expect((container.firstChild as HTMLElement).className).toContain("rounded-sm");

    rerender(<Skeleton variant="circular" />);
    expect((container.firstChild as HTMLElement).className).toContain("rounded-full");

    rerender(<Skeleton variant="rectangular" />);
    expect((container.firstChild as HTMLElement).className).toContain("rounded-md");
  });

  it("should apply animation styles", () => {
    const { container, rerender } = render(<Skeleton animation="pulse" />);

    expect((container.firstChild as HTMLElement).className).toContain("animate-pulse");

    rerender(<Skeleton animation="wave" />);
    expect((container.firstChild as HTMLElement).className).toContain("animate-[wave_1.6s_ease-in-out_infinite]");

    rerender(<Skeleton animation="none" />);
    expect((container.firstChild as HTMLElement).className).not.toContain("animate-");
  });

  it("should apply custom width and height", () => {
    const { container } = render(<Skeleton width="200px" height="100px" />);
    const skeleton = container.firstChild as HTMLElement;

    // @ts-expect-error - test purposes
    expect(skeleton).toHaveStyle({ width: "200px", height: "100px" });
  });

  it("should have aria-busy attribute", () => {
    const { container } = render(<Skeleton />);

    // @ts-expect-error - test purposes
    expect(container.firstChild).toHaveAttribute("aria-busy", "true");
  });

  it("should have aria-live attribute", () => {
    const { container } = render(<Skeleton />);

    // @ts-expect-error - test purposes
    expect(container.firstChild).toHaveAttribute("aria-live", "polite");
  });
});
