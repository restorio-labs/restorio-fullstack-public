/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { FormActions } from "../../../../src/components/forms";

describe("FormActions", () => {
  it("renders a div element", () => {
    render(<FormActions data-testid="test-actions">Actions</FormActions>);

    const actions = screen.getByTestId("test-actions");

    expect(actions.tagName).toBe("DIV");
  });

  it("applies default end alignment", () => {
    render(<FormActions data-testid="test-actions">Actions</FormActions>);

    const actions = screen.getByTestId("test-actions");

    // @ts-expect-error - test purposes
    expect(actions).toHaveClass("justify-end");
  });

  it("applies start alignment when specified", () => {
    render(
      <FormActions align="start" data-testid="test-actions">
        Actions
      </FormActions>,
    );

    const actions = screen.getByTestId("test-actions");

    // @ts-expect-error - test purposes
    expect(actions).toHaveClass("justify-start");
  });

  it("applies center alignment when specified", () => {
    render(
      <FormActions align="center" data-testid="test-actions">
        Actions
      </FormActions>,
    );

    const actions = screen.getByTestId("test-actions");

    // @ts-expect-error - test purposes
    expect(actions).toHaveClass("justify-center");
  });

  it("applies stretch alignment when specified", () => {
    render(
      <FormActions align="stretch" data-testid="test-actions">
        Actions
      </FormActions>,
    );

    const actions = screen.getByTestId("test-actions");

    // @ts-expect-error - test purposes
    expect(actions).toHaveClass("justify-stretch");
  });

  it("applies default medium spacing", () => {
    render(<FormActions data-testid="test-actions">Actions</FormActions>);

    const actions = screen.getByTestId("test-actions");

    // @ts-expect-error - test purposes
    expect(actions).toHaveClass("gap-3");
  });

  it("applies small spacing when specified", () => {
    render(
      <FormActions spacing="sm" data-testid="test-actions">
        Actions
      </FormActions>,
    );

    const actions = screen.getByTestId("test-actions");

    // @ts-expect-error - test purposes
    expect(actions).toHaveClass("gap-2");
  });

  it("applies large spacing when specified", () => {
    render(
      <FormActions spacing="lg" data-testid="test-actions">
        Actions
      </FormActions>,
    );

    const actions = screen.getByTestId("test-actions");

    // @ts-expect-error - test purposes
    expect(actions).toHaveClass("gap-4");
  });

  it("forwards custom className", () => {
    render(
      <FormActions className="custom-class" data-testid="test-actions">
        Actions
      </FormActions>,
    );

    const actions = screen.getByTestId("test-actions");

    // @ts-expect-error - test purposes
    expect(actions).toHaveClass("custom-class");
    // @ts-expect-error - test purposes
    expect(actions).toHaveClass("flex");
  });

  it("renders children correctly", () => {
    render(
      <FormActions>
        <button type="button">Cancel</button>
        <button type="submit">Submit</button>
      </FormActions>,
    );

    // @ts-expect-error - test purposes
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    // @ts-expect-error - test purposes
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });

  it("maintains flex container with items-center", () => {
    render(<FormActions data-testid="test-actions">Actions</FormActions>);

    const actions = screen.getByTestId("test-actions");

    // @ts-expect-error - test purposes
    expect(actions).toHaveClass("flex");
    // @ts-expect-error - test purposes
    expect(actions).toHaveClass("items-center");
  });
});
