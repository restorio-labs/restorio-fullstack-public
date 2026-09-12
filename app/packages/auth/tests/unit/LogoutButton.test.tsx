import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LogoutButton } from "../../src/LogoutButton";

describe("LogoutButton", () => {
  it("renders with default aria-label and icon fallback", () => {
    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: "Logout" });

    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-busy", "false");
  });

  it("runs onLogout and shows loading state while pending", async () => {
    let resolveLogout: (() => void) | undefined;
    const onLogout = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLogout = resolve;
        }),
    );

    render(<LogoutButton onLogout={onLogout}>Sign out</LogoutButton>);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign out" })).toHaveAttribute("aria-busy", "true");
      expect(screen.getByText("Logging out…")).toBeInTheDocument();
      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    resolveLogout?.();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign out" })).toHaveAttribute("aria-busy", "false");
      expect(screen.getByText("Sign out")).toBeInTheDocument();
    });
  });

  it("prefers loadingContent over loadingLabel while pending", async () => {
    const onLogout = vi.fn().mockImplementation(() => new Promise<void>(() => undefined));

    render(
      <LogoutButton
        onLogout={onLogout}
        loadingLabel="Signing out now"
        loadingContent={<span data-testid="busy">*</span>}
      >
        Sign out
      </LogoutButton>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(screen.getByTestId("busy")).toBeInTheDocument();
      expect(screen.queryByText("Signing out now")).not.toBeInTheDocument();
    });
  });

  it("respects provided loadingLabel", async () => {
    const onLogout = vi.fn().mockImplementation(() => new Promise<void>(() => undefined));

    render(
      <LogoutButton onLogout={onLogout} loadingLabel="Signing out now">
        Sign out
      </LogoutButton>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(screen.getByText("Signing out now")).toBeInTheDocument();
    });
  });

  it("keeps button disabled when disabled prop is true", () => {
    const onLogout = vi.fn();

    render(
      <LogoutButton onLogout={onLogout} disabled>
        Sign out
      </LogoutButton>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(onLogout).not.toHaveBeenCalled();
  });

  it("returns to idle state after a successful logout", async () => {
    const onLogout = vi.fn().mockResolvedValue(undefined);

    render(<LogoutButton onLogout={onLogout}>Sign out</LogoutButton>);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign out" })).toHaveAttribute("aria-busy", "false");
    });
  });

  it("redirects after successful logout when redirectTo is provided", async () => {
    const originalLocation = window.location;
    delete (window as Window & { location?: Location }).location;
    (window as Window & { location: { href: string } }).location = { href: "http://localhost/" };

    const onLogout = vi.fn().mockResolvedValue(undefined);

    render(
      <LogoutButton onLogout={onLogout} redirectTo="/signed-out">
        Sign out
      </LogoutButton>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect((window as Window & { location: { href: string } }).location.href).toBe("/signed-out");
    });

    (window as Window & { location?: Location }).location = originalLocation;
  });
});
