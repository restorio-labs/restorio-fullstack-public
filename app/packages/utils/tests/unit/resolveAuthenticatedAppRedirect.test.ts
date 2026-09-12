import { describe, expect, it } from "vitest";

import {
  canAccessApp,
  resolveAuthenticatedAppRedirect,
  resolveDefaultAppForAccountType,
} from "../../src/environment/resolveAuthenticatedAppRedirect";

describe("resolveAuthenticatedAppRedirect", () => {
  it("returns role default when last visited app is inaccessible", () => {
    expect(resolveAuthenticatedAppRedirect("waiter", "admin-panel")).toBe("waiter-panel");
    expect(resolveAuthenticatedAppRedirect("kitchen", "admin-panel")).toBe("kitchen-panel");
  });

  it("returns last visited app when user can access it", () => {
    expect(resolveAuthenticatedAppRedirect("owner", "admin-panel")).toBe("admin-panel");
    expect(resolveAuthenticatedAppRedirect("waiter", "waiter-panel")).toBe("waiter-panel");
    expect(resolveAuthenticatedAppRedirect("manager", "kitchen-panel")).toBe("kitchen-panel");
  });

  it("ignores public-web as last visited app", () => {
    expect(resolveAuthenticatedAppRedirect("waiter", "public-web")).toBe("waiter-panel");
  });

  it("falls back to role default for unknown last visited values", () => {
    expect(resolveAuthenticatedAppRedirect("waiter", "not-an-app")).toBe("waiter-panel");
    expect(resolveAuthenticatedAppRedirect("waiter", null)).toBe("waiter-panel");
  });
});

describe("resolveDefaultAppForAccountType", () => {
  it("maps staff roles to their panels", () => {
    expect(resolveDefaultAppForAccountType("waiter")).toBe("waiter-panel");
    expect(resolveDefaultAppForAccountType("kitchen")).toBe("kitchen-panel");
  });

  it("maps admin roles to admin panel", () => {
    expect(resolveDefaultAppForAccountType("owner")).toBe("admin-panel");
    expect(resolveDefaultAppForAccountType(null)).toBe("admin-panel");
  });
});

describe("canAccessApp", () => {
  it("denies admin panel for staff-only roles", () => {
    expect(canAccessApp("waiter", "admin-panel")).toBe(false);
    expect(canAccessApp("kitchen", "admin-panel")).toBe(false);
  });

  it("allows staff roles into their dedicated panels", () => {
    expect(canAccessApp("waiter", "waiter-panel")).toBe(true);
    expect(canAccessApp("kitchen", "kitchen-panel")).toBe(true);
  });

  it("denies kitchen panel for waiters", () => {
    expect(canAccessApp("waiter", "kitchen-panel")).toBe(false);
    expect(resolveAuthenticatedAppRedirect("waiter", "kitchen-panel")).toBe("waiter-panel");
  });
});
