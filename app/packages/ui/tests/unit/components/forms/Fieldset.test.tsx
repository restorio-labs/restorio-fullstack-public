/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Fieldset } from "../../../../src/components/forms/Fieldset";

describe("Fieldset", () => {
  it("renders a fieldset element", () => {
    render(
      <Fieldset data-testid="test-fieldset">
        <input type="text" />
      </Fieldset>,
    );

    const fieldset = screen.getByTestId("test-fieldset");

    expect(fieldset.tagName).toBe("FIELDSET");
  });

  it("renders legend when provided", () => {
    render(
      <Fieldset legend="Personal Information">
        <input type="text" />
      </Fieldset>,
    );

    expect(screen.getByText("Personal Information")).toBeInTheDocument();
  });

  it("does not render legend when not provided", () => {
    const { container } = render(
      <Fieldset>
        <input type="text" />
      </Fieldset>,
    );

    const legend = container.querySelector("legend");

    expect(legend).not.toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <Fieldset legend="Personal Information" description="Update your personal details">
        <input type="text" />
      </Fieldset>,
    );

    expect(screen.getByText("Update your personal details")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(
      <Fieldset legend="Personal Information">
        <input type="text" />
      </Fieldset>,
    );

    expect(screen.queryByText("Update your personal details")).not.toBeInTheDocument();
  });

  it("applies default spacing class", () => {
    render(
      <Fieldset legend="Test" data-testid="test-fieldset">
        <input type="text" />
      </Fieldset>,
    );

    const contentDiv = screen.getByTestId("test-fieldset").querySelector("div");

    expect(contentDiv).toHaveClass("space-y-4");
  });

  it("applies small spacing when specified", () => {
    render(
      <Fieldset legend="Test" spacing="sm" data-testid="test-fieldset">
        <input type="text" />
      </Fieldset>,
    );

    const contentDiv = screen.getByTestId("test-fieldset").querySelector("div");

    expect(contentDiv).toHaveClass("space-y-3");
  });

  it("applies large spacing when specified", () => {
    render(
      <Fieldset legend="Test" spacing="lg" data-testid="test-fieldset">
        <input type="text" />
      </Fieldset>,
    );

    const contentDiv = screen.getByTestId("test-fieldset").querySelector("div");

    expect(contentDiv).toHaveClass("space-y-6");
  });

  it("applies disabled styling when disabled prop is true", () => {
    render(
      <Fieldset legend="Test" disabled data-testid="test-fieldset">
        <input type="text" />
      </Fieldset>,
    );

    const fieldset = screen.getByTestId("test-fieldset");

    expect(fieldset).toHaveClass("opacity-50");
    expect(fieldset).toHaveClass("cursor-not-allowed");
  });

  it("disables all child inputs when disabled", () => {
    render(
      <Fieldset legend="Test" disabled>
        <input type="text" data-testid="child-input" />
      </Fieldset>,
    );

    const input = screen.getByTestId("child-input");

    expect(input).toBeDisabled();
  });

  it("forwards custom className", () => {
    render(
      <Fieldset legend="Test" className="custom-class" data-testid="test-fieldset">
        <input type="text" />
      </Fieldset>,
    );

    const fieldset = screen.getByTestId("test-fieldset");

    expect(fieldset).toHaveClass("custom-class");
    expect(fieldset).toHaveClass("border-border-default");
  });

  it("renders children correctly", () => {
    render(
      <Fieldset legend="Test">
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </Fieldset>,
    );

    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });
});
