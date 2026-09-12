import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

import { AuthGuard, type AuthGuardProps } from "../../src/guard";
import { TokenStorage } from "../../src/storage";

vi.mock("../../src/storage", () => ({
  TokenStorage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    isAccessTokenValid: vi.fn(),
  },
}));

type AuthClient = NonNullable<AuthGuardProps["client"]>;

const mockClient: AuthClient = {
  auth: {
    me: vi.fn(),
    refresh: vi.fn(),
  },
};

const ROUTER_FUTURE_FLAGS = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockClient.auth.me as Mock).mockResolvedValue({ authenticated: true, account_type: null });
  });

  it("should render children when authenticated with valid token", async () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue("valid-token");
    (TokenStorage.isAccessTokenValid as Mock).mockReturnValue(true);

    render(
      <MemoryRouter future={ROUTER_FUTURE_FLAGS}>
        <AuthGuard client={mockClient} revalidateOnFocus={false}>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Protected Content")).toBeInTheDocument());
  });

  it("should redirect to login when token is missing", async () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue(null);
    (TokenStorage.getRefreshToken as Mock).mockReturnValue(null);
    (mockClient.auth.me as Mock).mockRejectedValue(new Error("unauthorized"));
    (mockClient.auth.refresh as Mock).mockRejectedValue(new Error("unauthorized"));

    render(
      <MemoryRouter future={ROUTER_FUTURE_FLAGS} initialEntries={["/protected"]}>
        <AuthGuard client={mockClient} revalidateOnFocus={false}>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.queryByText("Protected Content")).not.toBeInTheDocument());
  });

  it("should redirect to login when token is invalid", async () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue("invalid-token");
    (TokenStorage.isAccessTokenValid as Mock).mockReturnValue(false);
    (TokenStorage.getRefreshToken as Mock).mockReturnValue(null);
    (mockClient.auth.me as Mock).mockRejectedValue(new Error("unauthorized"));
    (mockClient.auth.refresh as Mock).mockRejectedValue(new Error("unauthorized"));

    render(
      <MemoryRouter future={ROUTER_FUTURE_FLAGS} initialEntries={["/protected"]}>
        <AuthGuard client={mockClient} revalidateOnFocus={false}>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.queryByText("Protected Content")).not.toBeInTheDocument());
  });

  it("should redirect to custom login path when provided", async () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue(null);
    (TokenStorage.getRefreshToken as Mock).mockReturnValue(null);
    (mockClient.auth.me as Mock).mockRejectedValue(new Error("unauthorized"));
    (mockClient.auth.refresh as Mock).mockRejectedValue(new Error("unauthorized"));

    render(
      <MemoryRouter future={ROUTER_FUTURE_FLAGS} initialEntries={["/protected"]}>
        <AuthGuard loginPath="/custom-login" client={mockClient} revalidateOnFocus={false}>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.queryByText("Protected Content")).not.toBeInTheDocument());
  });

  it("renders children after auth check when token is present", async () => {
    (TokenStorage.getAccessToken as Mock).mockReturnValue("123-456");
    (TokenStorage.isAccessTokenValid as Mock).mockReturnValue(true);

    render(
      <MemoryRouter future={ROUTER_FUTURE_FLAGS}>
        <AuthGuard client={mockClient} revalidateOnFocus={false}>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText("Protected Content")).toBeInTheDocument());
  });
});
