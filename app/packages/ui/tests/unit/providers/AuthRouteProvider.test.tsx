import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";

import { AuthRouteProvider, useAuthRoute, type AuthCheckContext } from "../../../src/providers/AuthRouteProvider";

describe("AuthRouteProvider", () => {
  it("renders children", async () => {
    const checkAuth = vi.fn().mockResolvedValue("anonymous");

    render(
      <AuthRouteProvider checkAuth={checkAuth}>
        <div data-testid="child">content</div>
      </AuthRouteProvider>,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- testing-library screen methods
    expect(screen.getByTestId("child")).toBeInTheDocument();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- testing-library screen methods
    expect(screen.getByText("content")).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it("refreshAuth invokes checkAuth again", async () => {
    const checkAuth = vi.fn().mockResolvedValueOnce("anonymous").mockResolvedValueOnce("authenticated");

    const { result } = renderHook(() => useAuthRoute(), {
      wrapper: ({ children }) => <AuthRouteProvider checkAuth={checkAuth}>{children}</AuthRouteProvider>,
    });

    await waitFor(() => {
      expect(result.current.authStatus).toBe("anonymous");
    });
    expect(checkAuth).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refreshAuth();
    });

    await waitFor(() => {
      expect(result.current.authStatus).toBe("authenticated");
    });
    expect(checkAuth).toHaveBeenCalledTimes(2);
  });

  it("starts with loading then sets anonymous when checkAuth returns anonymous", async () => {
    const checkAuth = vi.fn().mockResolvedValue("anonymous");

    const { result } = renderHook(() => useAuthRoute(), {
      wrapper: ({ children }) => <AuthRouteProvider checkAuth={checkAuth}>{children}</AuthRouteProvider>,
    });

    expect(result.current.authStatus).toBe("loading");

    await waitFor(() => {
      expect(result.current.authStatus).toBe("anonymous");
    });
    expect(checkAuth).toHaveBeenCalledOnce();
  });

  it("sets authenticated when checkAuth returns authenticated", async () => {
    const checkAuth = vi.fn().mockResolvedValue("authenticated");

    const { result } = renderHook(() => useAuthRoute(), {
      wrapper: ({ children }) => <AuthRouteProvider checkAuth={checkAuth}>{children}</AuthRouteProvider>,
    });

    await waitFor(() => {
      expect(result.current.authStatus).toBe("authenticated");
    });
    expect(checkAuth).toHaveBeenCalledOnce();
  });

  it("sets unavailable when checkAuth returns unavailable", async () => {
    const checkAuth = vi.fn().mockResolvedValue("unavailable");

    const { result } = renderHook(() => useAuthRoute(), {
      wrapper: ({ children }) => <AuthRouteProvider checkAuth={checkAuth}>{children}</AuthRouteProvider>,
    });

    await waitFor(() => {
      expect(result.current.authStatus).toBe("unavailable");
    });
    expect(checkAuth).toHaveBeenCalledOnce();
    expect(checkAuth).toHaveBeenCalledWith({ onReconnecting: expect.any(Function) });
  });

  it("sets reconnecting then anonymous when checkAuth invokes onReconnecting", async () => {
    const checkAuth = vi.fn(async ({ onReconnecting }: AuthCheckContext) => {
      onReconnecting();
      await Promise.resolve();

      return "anonymous";
    });

    const { result } = renderHook(() => useAuthRoute(), {
      wrapper: ({ children }) => <AuthRouteProvider checkAuth={checkAuth}>{children}</AuthRouteProvider>,
    });

    await waitFor(() => {
      expect(result.current.authStatus).toBe("reconnecting");
    });
    await waitFor(() => {
      expect(result.current.authStatus).toBe("anonymous");
    });
  });

  it("useAuthRoute throws when used outside provider", () => {
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      expect(() => renderHook(() => useAuthRoute())).toThrow("useAuthRoute must be used within AuthRouteProvider");
    } finally {
      stderrWrite.mockRestore();
      consoleError.mockRestore();
    }
  });

  it("does not update auth status after unmount", async () => {
    let resolveAuth: ((value: "authenticated" | "anonymous" | "unavailable") => void) | null = null;
    const checkAuth = vi.fn(
      (_ctx: AuthCheckContext) =>
        new Promise<"authenticated" | "anonymous" | "unavailable">((resolve) => {
          resolveAuth = resolve;
        }),
    );

    const { result, unmount } = renderHook(() => useAuthRoute(), {
      wrapper: ({ children }) => <AuthRouteProvider checkAuth={checkAuth}>{children}</AuthRouteProvider>,
    });

    expect(result.current.authStatus).toBe("loading");

    unmount();

    await act(async () => {
      resolveAuth?.("authenticated");
      await Promise.resolve();
    });

    expect(checkAuth).toHaveBeenCalledOnce();
  });
});
