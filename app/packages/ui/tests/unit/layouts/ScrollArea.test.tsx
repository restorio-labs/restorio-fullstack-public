/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { ScrollArea } from "../../../src/layouts/ScrollArea";

describe("ScrollArea", () => {
  it("should render children", () => {
    render(<ScrollArea>Scrollable content</ScrollArea>);
    expect(screen.getByText("Scrollable content")).toBeDefined();
  });

  it("should apply vertical orientation by default", () => {
    render(<ScrollArea>Content</ScrollArea>);
    expect(screen.getByText("Content").className).toContain("overflow-y-auto");
  });

  it("should apply orientation classes", () => {
    const { rerender } = render(<ScrollArea orientation="horizontal">Content</ScrollArea>);

    expect(screen.getByText("Content").className).toContain("overflow-x-auto");

    rerender(<ScrollArea orientation="both">Content</ScrollArea>);
    expect(screen.getByText("Content").className).toContain("overflow-auto");
  });

  it("should apply hideScrollbar class when hideScrollbar is true", () => {
    render(<ScrollArea hideScrollbar>Content</ScrollArea>);
    expect(screen.getByText("Content").className).toContain("scrollbar-hide");
  });

  it("should forward ref", () => {
    const ref = vi.fn();

    render(<ScrollArea ref={ref}>Content</ScrollArea>);
    expect(ref).toHaveBeenCalled();
  });
});
