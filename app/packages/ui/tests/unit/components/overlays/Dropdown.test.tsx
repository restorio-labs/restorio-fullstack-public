/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import { Dropdown } from "../../../../src/components/overlays/Dropdown";

describe("Dropdown", () => {
  it("should render trigger", () => {
    render(
      <Dropdown trigger={<button type="button">Open</button>}>
        <div>Menu Item</div>
      </Dropdown>,
    );
    expect(screen.getByText("Open")).toBeDefined();
  });

  it("should not render menu when closed", () => {
    render(
      <Dropdown trigger={<button type="button">Open</button>}>
        <div>Menu Item</div>
      </Dropdown>,
    );
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("should render menu when opened", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown trigger={<button type="button">Open</button>}>
        <div>Menu Item</div>
      </Dropdown>,
    );

    await user.click(screen.getByText("Open"));

    expect(screen.getByRole("menu")).toBeDefined();
    expect(screen.getByText("Menu Item")).toBeDefined();
  });

  it("should toggle menu on trigger click", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown trigger={<button type="button">Open</button>}>
        <div>Menu Item</div>
      </Dropdown>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("menu")).toBeDefined();

    await user.click(screen.getByText("Open"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("should close menu when Escape is pressed", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown trigger={<button type="button">Open</button>}>
        <div>Menu Item</div>
      </Dropdown>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("menu")).toBeDefined();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("should not close menu when non-Escape key is pressed", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown trigger={<button type="button">Open</button>}>
        <div>Menu Item</div>
      </Dropdown>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("menu")).toBeDefined();

    const enterEvent = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });

    document.dispatchEvent(enterEvent);
    expect(screen.getByRole("menu")).toBeDefined();
  });

  it("should close menu when clicking outside", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <Dropdown trigger={<button type="button">Open</button>}>
          <div>Menu Item</div>
        </Dropdown>
        <div data-testid="outside">Outside element</div>
      </div>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("menu")).toBeDefined();

    await user.click(screen.getByTestId("outside"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("should be controlled when isOpen prop is provided", () => {
    const onOpenChange = vi.fn();

    render(
      <Dropdown trigger={<button type="button">Open</button>} isOpen onOpenChange={onOpenChange}>
        <div>Menu Item</div>
      </Dropdown>,
    );

    expect(screen.getByRole("menu")).toBeDefined();
  });

  it("should use internal state when uncontrolled", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown trigger={<button type="button">Open</button>}>
        <div>Menu Item</div>
      </Dropdown>,
    );

    expect(screen.queryByRole("menu")).toBeNull();

    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("menu")).toBeDefined();

    await user.click(screen.getByText("Open"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("should apply placement classes", () => {
    const { rerender } = render(
      <Dropdown trigger={<button type="button">Open</button>} isOpen placement="bottom-start">
        <div>Menu</div>
      </Dropdown>,
    );

    expect(screen.getByRole("menu").className).toContain("top-full");

    rerender(
      <Dropdown trigger={<button type="button">Open</button>} isOpen placement="bottom-center">
        <div>Menu</div>
      </Dropdown>,
    );
    expect(screen.getByRole("menu").className).toContain("-translate-x-1/2");

    rerender(
      <Dropdown trigger={<button type="button">Open</button>} isOpen placement="top-end">
        <div>Menu</div>
      </Dropdown>,
    );
    expect(screen.getByRole("menu").className).toContain("bottom-full");
  });

  it("should have proper aria attributes", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown trigger={<button type="button">Open</button>}>
        <div>Menu Item</div>
      </Dropdown>,
    );

    const trigger = screen.getByText("Open").closest("div");

    expect(trigger?.getAttribute("aria-haspopup")).toBe("true");
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");

    await user.click(screen.getByText("Open"));
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
  });

  it("should open dropdown with Enter key", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown trigger={<button type="button">Open</button>}>
        <div>Menu Item</div>
      </Dropdown>,
    );

    const trigger = screen.getByText("Open").closest("div");

    expect(screen.queryByRole("menu")).toBeNull();

    if (trigger) {
      trigger.focus();
      await user.keyboard("{Enter}");
    }

    expect(screen.getByRole("menu")).toBeDefined();
  });

  it("should open dropdown with Space key", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown trigger={<button type="button">Open</button>}>
        <div>Menu Item</div>
      </Dropdown>,
    );

    const trigger = screen.getByText("Open").closest("div");

    expect(screen.queryByRole("menu")).toBeNull();

    if (trigger) {
      trigger.focus();
      await user.keyboard(" ");
    }

    expect(screen.getByRole("menu")).toBeDefined();
  });

  it("should call onOpenChange and not update internal state when controlled", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Dropdown trigger={<button type="button">Open</button>} isOpen={false} onOpenChange={onOpenChange}>
        <div>Menu Item</div>
      </Dropdown>,
    );

    await user.click(screen.getByText("Open"));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("menu")).toBeNull();
    rerender(
      <Dropdown trigger={<button type="button">Open</button>} isOpen onOpenChange={onOpenChange}>
        <div>Menu Item</div>
      </Dropdown>,
    );
    expect(screen.getByRole("menu")).toBeDefined();
  });

  it("should close on menu click when closeOnSelect is enabled", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown trigger={<button type="button">Open</button>} closeOnSelect>
        <button type="button">Selectable item</button>
      </Dropdown>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("menu")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Selectable item" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("should keep menu open when clicking prevent-close content", async () => {
    const user = userEvent.setup();

    render(
      <Dropdown trigger={<button type="button">Open</button>} closeOnSelect>
        <button type="button" data-dropdown-prevent-close="true">
          Keep open
        </button>
      </Dropdown>,
    );

    await user.click(screen.getByText("Open"));
    expect(screen.getByRole("menu")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Keep open" }));
    expect(screen.getByRole("menu")).toBeDefined();
  });
});
