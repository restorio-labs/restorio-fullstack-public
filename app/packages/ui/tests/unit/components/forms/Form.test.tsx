/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Form } from "../../../../src/components/forms/Form";

describe("Form", () => {
  it("renders a form element", () => {
    render(
      <Form data-testid="test-form">
        <input type="text" />
      </Form>,
    );

    const form = screen.getByTestId("test-form");

    expect(form.tagName).toBe("FORM");
  });

  it("applies default spacing class", () => {
    render(
      <Form data-testid="test-form">
        <input type="text" />
      </Form>,
    );

    const form = screen.getByTestId("test-form");

    // @ts-expect-error - test purposes
    expect(form).toHaveClass("space-y-6");
  });

  it("applies small spacing when specified", () => {
    render(
      <Form spacing="sm" data-testid="test-form">
        <input type="text" />
      </Form>,
    );

    const form = screen.getByTestId("test-form");

    // @ts-expect-error - test purposes
    expect(form).toHaveClass("space-y-4");
  });

  it("applies large spacing when specified", () => {
    render(
      <Form spacing="lg" data-testid="test-form">
        <input type="text" />
      </Form>,
    );

    const form = screen.getByTestId("test-form");

    // @ts-expect-error - test purposes
    expect(form).toHaveClass("space-y-8");
  });

  it("forwards custom className", () => {
    render(
      <Form className="custom-class" data-testid="test-form">
        <input type="text" />
      </Form>,
    );

    const form = screen.getByTestId("test-form");

    // @ts-expect-error - test purposes
    expect(form).toHaveClass("custom-class");
  });

  it("forwards onSubmit handler", () => {
    let submitted = false;
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      submitted = true;
    };

    render(
      <Form onSubmit={handleSubmit} data-testid="test-form">
        <button type="submit">Submit</button>
      </Form>,
    );

    const form = screen.getByTestId("test-form");

    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    expect(submitted).toBe(true);
  });

  it("renders children correctly", () => {
    render(
      <Form data-testid="test-form">
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </Form>,
    );

    // @ts-expect-error - test purposes
    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    // @ts-expect-error - test purposes
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });

  it("supports all form attributes", () => {
    render(
      <Form data-testid="test-form" action="/submit" method="post" encType="multipart/form-data" noValidate>
        <input type="text" />
      </Form>,
    );

    const form = screen.getByTestId("test-form");

    // @ts-expect-error - test purposes
    expect(form.action).toContain("/submit");
    // @ts-expect-error - test purposes
    expect(form.method).toBe("post");
    // @ts-expect-error - test purposes
    expect(form.enctype).toBe("multipart/form-data");
    // @ts-expect-error - test purposes
    expect(form.noValidate).toBe(true);
  });
});
