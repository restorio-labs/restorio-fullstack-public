/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { EmptyState } from "../../../../src/components/feedback/EmptyState";

describe("EmptyState", () => {
  it("should render title", () => {
    render(<EmptyState title="No items found" />);

    expect(screen.getByText("No items found")).toBeDefined();
  });

  it("should render description when provided", () => {
    render(<EmptyState title="Empty" description="No items to display" />);

    expect(screen.getByText("No items to display")).toBeDefined();
  });

  it("should render icon when provided", () => {
    render(<EmptyState title="Empty" icon={<div data-testid="icon">Icon</div>} />);
    expect(screen.getByTestId("icon")).toBeDefined();
  });

  it("should render action when provided", () => {
    render(
      <EmptyState
        title="Empty"
        action={
          <button type="button" data-testid="action">
            Add Item
          </button>
        }
      />,
    );
    expect(screen.getByTestId("action")).toBeDefined();
  });

  it("should have role status", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("should have aria-live attribute", () => {
    render(<EmptyState title="Empty" />);

    // @ts-expect-error - test purposes
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});
