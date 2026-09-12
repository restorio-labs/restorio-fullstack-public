import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, it, expect } from "vitest";

import { Card } from "../../src/components/Card";

describe("Card", () => {
  it("should render card with children", () => {
    render(<Card>Click me</Card>);
    expect(screen.getByText("Click me")).toBeTruthy();
  });

  it("should render card with title", () => {
    render(<Card title="Title">Content</Card>);
    expect(screen.getByText("Title")).toBeTruthy();
    expect(document.querySelector(".card-body")).toBeTruthy();
  });
});
