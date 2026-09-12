/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { Modal } from "../../../../src/components/overlays/Modal";

describe("Modal", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("should not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>,
    );
    // @ts-expect-error - test purposes
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render when isOpen is true", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("Test Modal")).toBeDefined();
    expect(screen.getByText("Content")).toBeDefined();
  });

  it("should call onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen onClose={onClose} title="Test Modal">
        Content
      </Modal>,
    );

    const closeButton = screen.getByLabelText("Close modal");

    await user.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when Escape key is pressed", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen onClose={onClose} title="Test Modal" closeOnEscape>
        Content
      </Modal>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should not call onClose on Escape when closeOnEscape is false", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen onClose={onClose} title="Test Modal" closeOnEscape={false}>
        Content
      </Modal>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should call onClose when overlay is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen onClose={onClose} title="Test Modal" closeOnOverlayClick>
        Content
      </Modal>,
    );

    const overlay = screen.getByRole("dialog");

    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should apply size classes", () => {
    const { rerender } = render(
      <Modal isOpen onClose={vi.fn()} title="Test" size="sm">
        Content
      </Modal>,
    );

    expect(screen.getByRole("document").className).toContain("max-w-md");

    rerender(
      <Modal isOpen onClose={vi.fn()} title="Test" size="lg">
        Content
      </Modal>,
    );
    expect(screen.getByRole("document").className).toContain("max-w-2xl");
  });

  it("should have proper aria attributes", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Test Modal">
        Content
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");

    // @ts-expect-error - test purposes
    expect(dialog).toHaveAttribute("aria-modal", "true");
    // @ts-expect-error - test purposes
    expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
  });
});
