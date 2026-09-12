/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormMessage } from "../../../../src/components/forms/FormMessage";

describe("FormMessage", () => {
  it("renders nothing when children is empty", () => {
    const { container } = render(<FormMessage />);

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when children is null", () => {
    const { container } = render(<FormMessage>{null}</FormMessage>);

    expect(container.firstChild).toBeNull();
  });

  it("renders message with helper variant by default", () => {
    render(<FormMessage>Helper text</FormMessage>);

    const message = screen.getByText("Helper text");

    expect(message).toHaveClass("text-text-secondary");
  });

  it("renders message with error variant styling", () => {
    render(<FormMessage variant="error">Error message</FormMessage>);

    const message = screen.getByText("Error message");

    expect(message).toHaveClass("text-status-error-text");
  });

  it("renders message with success variant styling", () => {
    render(<FormMessage variant="success">Success message</FormMessage>);

    const message = screen.getByText("Success message");

    expect(message).toHaveClass("text-status-success-text");
  });

  it("renders message with helper variant styling", () => {
    render(<FormMessage variant="helper">Helper message</FormMessage>);

    const message = screen.getByText("Helper message");

    expect(message).toHaveClass("text-text-secondary");
  });

  it("applies role='alert' for error variant", () => {
    render(<FormMessage variant="error">Error message</FormMessage>);

    const message = screen.getByText("Error message");

    expect(message).toHaveAttribute("role", "alert");
  });

  it("applies aria-live='polite' for error variant", () => {
    render(<FormMessage variant="error">Error message</FormMessage>);

    const message = screen.getByText("Error message");

    expect(message).toHaveAttribute("aria-live", "polite");
  });

  it("does not apply role for non-error variants", () => {
    render(<FormMessage variant="helper">Helper message</FormMessage>);

    const message = screen.getByText("Helper message");

    expect(message).not.toHaveAttribute("role");
  });

  it("does not apply aria-live for non-error variants", () => {
    render(<FormMessage variant="success">Success message</FormMessage>);

    const message = screen.getByText("Success message");

    expect(message).not.toHaveAttribute("aria-live");
  });

  it("forwards id prop for aria-describedby linking", () => {
    render(
      <FormMessage id="email-error" variant="error">
        Invalid email
      </FormMessage>,
    );

    const message = screen.getByText("Invalid email");

    expect(message).toHaveAttribute("id", "email-error");
  });

  it("forwards custom className", () => {
    render(
      <FormMessage className="custom-class" variant="error">
        Error message
      </FormMessage>,
    );

    const message = screen.getByText("Error message");

    expect(message).toHaveClass("custom-class");
    expect(message).toHaveClass("text-status-error-text");
  });

  it("renders with small text size", () => {
    render(<FormMessage variant="error">Error message</FormMessage>);

    const message = screen.getByText("Error message");

    expect(message).toHaveClass("text-sm");
  });
});
