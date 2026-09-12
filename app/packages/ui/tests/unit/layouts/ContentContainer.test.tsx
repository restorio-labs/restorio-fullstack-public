import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { ContentContainer } from "../../../src/layouts/ContentContainer";

describe("ContentContainer", () => {
  it("should render children", () => {
    render(<ContentContainer>Container content</ContentContainer>);
    expect(screen.getByText("Container content")).toBeDefined();
  });

  it("should apply max-width classes", () => {
    const { rerender } = render(<ContentContainer maxWidth="sm">Content</ContentContainer>);

    expect(screen.getByText("Content").className).toContain("max-w-screen-sm");

    rerender(<ContentContainer maxWidth="md">Content</ContentContainer>);
    expect(screen.getByText("Content").className).toContain("max-w-screen-md");

    rerender(<ContentContainer maxWidth="lg">Content</ContentContainer>);
    expect(screen.getByText("Content").className).toContain("max-w-screen-lg");

    rerender(<ContentContainer maxWidth="xl">Content</ContentContainer>);
    expect(screen.getByText("Content").className).toContain("max-w-screen-xl");
  });

  it("should apply padding by default", () => {
    render(<ContentContainer>Content</ContentContainer>);
    expect(screen.getByText("Content").className).toContain("px-4");
  });

  it("should not apply padding when padding is false", () => {
    render(<ContentContainer padding={false}>Content</ContentContainer>);
    expect(screen.getByText("Content").className).not.toContain("px-4");
  });

  it("should center content with mx-auto", () => {
    render(<ContentContainer>Content</ContentContainer>);
    expect(screen.getByText("Content").className).toContain("mx-auto");
  });
});
