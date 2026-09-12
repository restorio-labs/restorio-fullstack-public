/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { Button } from "../../../../src/components/primitives/Button";

describe("Button", () => {
  it("should render button with children", () => {
    render(<Button>Click me</Button>);
    // @ts-expect-error - test purposes
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("should apply primary variant styles", () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole("button");

    expect(button.className).toContain("bg-interactive-primary");
  });

  it("should apply secondary variant styles", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");

    expect(button.className).toContain("bg-interactive-secondary");
  });

  it("should apply danger variant styles", () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole("button");

    expect(button.className).toContain("bg-interactive-danger");
  });

  it("should apply teal variant styles", () => {
    render(<Button variant="teal">Teal</Button>);
    const button = screen.getByRole("button");

    expect(button.className).toContain("bg-interactive-accentTeal");
  });

  it("should apply warm variant styles", () => {
    render(<Button variant="warm">Warm</Button>);
    const button = screen.getByRole("button");

    expect(button.className).toContain("bg-interactive-accentWarm");
  });

  it("should apply size classes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);

    expect(screen.getByRole("button").className).toContain("text-sm");

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole("button").className).toContain("text-base");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button").className).toContain("text-lg");
  });

  it("should apply fullWidth class when fullWidth is true", () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByRole("button").className).toContain("w-full");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);

    // @ts-expect-error - test purposes
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should call onClick handler when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should not call onClick when disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );

    await user.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should have focus-visible styles for accessibility", () => {
    render(<Button>Focusable</Button>);
    const button = screen.getByRole("button");

    expect(button.className).toContain("focus-visible:outline");
  });

  it("should forward ref", () => {
    const ref = vi.fn();

    render(<Button ref={ref}>Ref</Button>);
    expect(ref).toHaveBeenCalled();
  });
});
