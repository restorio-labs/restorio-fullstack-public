import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NavItem } from "../../../../src/components/navigation/NavItem";

describe("NavItem", () => {
  it("renders as anchor when href is provided", () => {
    render(<NavItem href="/orders">Orders</NavItem>);

    const link = screen.getByRole("link", { name: "Orders" });

    expect(link.getAttribute("href")).toBe("/orders");
    expect(link.getAttribute("type")).toBeNull();
  });

  it("renders as button by default and handles click", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<NavItem onClick={onClick}>Open</NavItem>);

    const button = screen.getByRole("button", { name: "Open" });

    expect(button.getAttribute("type")).toBe("button");
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies disabled and active states", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <>
        <NavItem active>Dashboard</NavItem>
        <NavItem disabled onClick={onClick}>
          Disabled
        </NavItem>
      </>,
    );

    const active = screen.getByRole("button", { name: "Dashboard" });
    const disabled = screen.getByRole("button", { name: "Disabled" });

    expect(active.getAttribute("aria-current")).toBe("page");
    expect(disabled.getAttribute("aria-disabled")).toBe("true");

    await user.click(disabled);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("supports link variant, touch target and icon+label rendering", () => {
    render(
      <NavItem variant="link" touchTarget icon={<span data-testid="icon">*</span>}>
        Reports
      </NavItem>,
    );

    const button = screen.getByRole("button", { name: /Reports/ });

    expect(screen.getByTestId("icon")).toBeDefined();
    expect(button.className).toContain("bg-transparent");
    expect(button.className).toContain("min-w-[48px]");
  });
});
