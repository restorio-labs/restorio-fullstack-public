/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { Loader } from "../../../../src/components/feedback/Loader";

describe("Loader", () => {
  it("should render loader element", () => {
    render(<Loader />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("should have default aria-label", () => {
    render(<Loader />);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading");
  });

  it("should use custom aria-label when provided", () => {
    render(<Loader aria-label="Loading data" />);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading data");
  });

  it("should apply size classes", () => {
    const { rerender } = render(<Loader size="sm" />);

    expect(screen.getByRole("status").className).toContain("w-4");

    rerender(<Loader size="md" />);
    expect(screen.getByRole("status").className).toContain("w-8");

    rerender(<Loader size="lg" />);
    expect(screen.getByRole("status").className).toContain("w-12");
  });

  it("should have spinning animation", () => {
    render(<Loader />);
    expect(screen.getByRole("status").className).toContain("animate-spin");
  });

  it("should have sr-only text for screen readers", () => {
    render(<Loader />);
    expect(screen.getByText("Loading")).toBeDefined();
  });
});
