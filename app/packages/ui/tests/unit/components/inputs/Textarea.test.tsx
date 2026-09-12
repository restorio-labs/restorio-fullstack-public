/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { Textarea } from "../../../../src/components/inputs/Textarea";

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea />);

    const textarea = screen.getByRole("textbox");

    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("renders label when provided", () => {
    render(<Textarea label="Description" />);

    // @ts-expect-error - test purposes
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("associates label with textarea via htmlFor", () => {
    render(<Textarea label="Description" id="desc" />);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const label = screen.getByText("Description") as HTMLLabelElement;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(label.htmlFor).toBe("desc");
  });

  it("generates unique id when not provided", () => {
    render(<Textarea label="Description" />);

    const textarea = screen.getByRole("textbox");

    expect(textarea.id).toBeTruthy();
  });

  it("uses provided id", () => {
    render(<Textarea id="custom-id" />);

    const textarea = screen.getByRole("textbox");

    expect(textarea.id).toBe("custom-id");
  });

  it("renders error message when error prop is provided", () => {
    render(<Textarea label="Description" error="Description is required" />);

    const error = screen.getByText("Description is required");

    // @ts-expect-error - test purposes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(error).toBeInTheDocument();
    // @ts-expect-error - test purposes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(error).toHaveAttribute("role", "alert");
  });

  it("renders helper text when provided", () => {
    render(<Textarea label="Description" helperText="Max 500 characters" />);
    // @ts-expect-error - test purposes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(screen.getByText("Max 500 characters")).toBeInTheDocument();
  });

  it("does not render helper text when error is present", () => {
    render(<Textarea label="Description" error="Description is required" helperText="Max 500 characters" />);
    // @ts-expect-error - test purposes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(screen.queryByText("Max 500 characters")).not.toBeInTheDocument();
  });

  it("applies error styling when error prop is provided", () => {
    render(<Textarea error="Error message" />);

    const textarea = screen.getByRole("textbox");

    // @ts-expect-error - test purposes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(textarea).toHaveClass("border-status-error-border");
  });

  it("marks textarea as invalid when error is present", () => {
    render(<Textarea error="Error message" />);

    const textarea = screen.getByRole("textbox");

    // @ts-expect-error - test purposes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(textarea).toHaveAttribute("aria-invalid", "true");
  });

  it("links error message via aria-describedby", () => {
    render(<Textarea id="desc" error="Error message" />);

    const textarea = screen.getByRole("textbox");
    const errorId = textarea.getAttribute("aria-describedby");

    expect(errorId).toBeTruthy();
    // @ts-expect-error - test purposes
    expect(screen.getByText("Error message")).toHaveAttribute("id", errorId);
  });

  it("applies disabled styling", () => {
    render(<Textarea disabled />);

    const textarea = screen.getByRole("textbox");

    // @ts-expect-error - test purposes
    expect(textarea).toBeDisabled();
    // @ts-expect-error - test purposes
    expect(textarea).toHaveClass("disabled:opacity-50");
  });

  it("applies vertical resize by default", () => {
    render(<Textarea />);

    const textarea = screen.getByRole("textbox");

    // @ts-expect-error - test purposes
    expect(textarea).toHaveClass("resize-y");
  });

  it("applies no resize when specified", () => {
    render(<Textarea resize="none" />);

    const textarea = screen.getByRole("textbox");

    // @ts-expect-error - test purposes
    expect(textarea).toHaveClass("resize-none");
  });

  it("applies horizontal resize when specified", () => {
    render(<Textarea resize="horizontal" />);

    const textarea = screen.getByRole("textbox");

    // @ts-expect-error - test purposes
    expect(textarea).toHaveClass("resize-x");
  });

  it("applies both resize when specified", () => {
    render(<Textarea resize="both" />);

    const textarea = screen.getByRole("textbox");

    // @ts-expect-error - test purposes
    expect(textarea).toHaveClass("resize");
  });

  it("forwards placeholder prop", () => {
    render(<Textarea placeholder="Enter description..." />);

    const textarea = screen.getByPlaceholderText("Enter description...");

    // @ts-expect-error - test purposes
    expect(textarea).toBeInTheDocument();
  });

  it("forwards custom className", () => {
    render(<Textarea className="custom-class" />);

    const textarea = screen.getByRole("textbox");

    // @ts-expect-error - test purposes
    expect(textarea).toHaveClass("custom-class");
  });

  it("forwards rows prop", () => {
    render(<Textarea rows={5} />);

    const textarea = screen.getByRole("textbox");

    // @ts-expect-error - test purposes
    expect(textarea.rows).toBe(5);
  });

  it("applies minimum height class", () => {
    render(<Textarea />);

    const textarea = screen.getByRole("textbox");

    // @ts-expect-error - test purposes
    expect(textarea).toHaveClass("min-h-[100px]");
  });
});
