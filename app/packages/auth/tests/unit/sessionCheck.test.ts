import { describe, expect, it, vi } from "vitest";

import { checkAuthSession, checkPublicWebAuth } from "../../src/sessionCheck";

describe("checkAuthSession", () => {
  it("returns true when session check succeeds", async () => {
    const getCurrentSession = vi.fn<() => Promise<unknown>>().mockResolvedValue({});

    const result = await checkAuthSession(getCurrentSession);

    expect(result).toBe(true);
    expect(getCurrentSession).toHaveBeenCalledTimes(1);
  });

  it("returns false when session check fails", async () => {
    const getCurrentSession = vi.fn<() => Promise<unknown>>().mockRejectedValue(new Error("unauthorized"));

    const result = await checkAuthSession(getCurrentSession);

    expect(result).toBe(false);
    expect(getCurrentSession).toHaveBeenCalledTimes(1);
  });

  it("returns false and skips API call when required session hint cookie is missing", async () => {
    const getCurrentSession = vi.fn<() => Promise<unknown>>().mockResolvedValue({});

    const result = await checkAuthSession(getCurrentSession, { requireSessionHintCookie: "rshc" });

    expect(result).toBe(false);
    expect(getCurrentSession).not.toHaveBeenCalled();
  });

  it("checks session when required session hint cookie is present", async () => {
    const getCurrentSession = vi.fn<() => Promise<unknown>>().mockResolvedValue({});
    const documentRef = {
      cookie: "foo=1; rshc=1",
    } as Document;

    const result = await checkAuthSession(getCurrentSession, {
      requireSessionHintCookie: "rshc",
      documentRef,
    });

    expect(result).toBe(true);
    expect(getCurrentSession).toHaveBeenCalledTimes(1);
  });
});

describe("checkPublicWebAuth", () => {
  it("returns anonymous when required session hint cookie is missing", async () => {
    const getCurrentSession = vi.fn<() => Promise<unknown>>().mockResolvedValue({});
    const isBackendReachable = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);

    const result = await checkPublicWebAuth(getCurrentSession, {
      requireSessionHintCookie: "rshc",
      isBackendReachable,
    });

    expect(result).toBe("anonymous");
    expect(getCurrentSession).not.toHaveBeenCalled();
    expect(isBackendReachable).not.toHaveBeenCalled();
  });

  it("returns authenticated when session succeeds", async () => {
    const getCurrentSession = vi.fn<() => Promise<unknown>>().mockResolvedValue({});
    const isBackendReachable = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
    const documentRef = {
      cookie: "foo=1; rshc=1",
    } as Document;

    const result = await checkPublicWebAuth(getCurrentSession, {
      requireSessionHintCookie: "rshc",
      documentRef,
      isBackendReachable,
    });

    expect(result).toBe("authenticated");
    expect(isBackendReachable).not.toHaveBeenCalled();
  });

  it("returns unavailable when session fails and all health checks fail after retries", async () => {
    vi.useFakeTimers();
    try {
      const getCurrentSession = vi.fn<() => Promise<unknown>>().mockRejectedValue(new Error("unauthorized"));
      const isBackendReachable = vi.fn<() => Promise<boolean>>().mockResolvedValue(false);
      const onReconnecting = vi.fn();
      const documentRef = {
        cookie: "foo=1; rshc=1",
      } as Document;

      const resultPromise = checkPublicWebAuth(getCurrentSession, {
        requireSessionHintCookie: "rshc",
        documentRef,
        isBackendReachable,
        onReconnecting,
      });

      await vi.runAllTimersAsync();

      const result = await resultPromise;

      expect(result).toBe("unavailable");
      expect(isBackendReachable).toHaveBeenCalledTimes(9);
      expect(onReconnecting).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns anonymous when session fails but backend health succeeds on first attempt", async () => {
    const getCurrentSession = vi.fn<() => Promise<unknown>>().mockRejectedValue(new Error("unauthorized"));
    const isBackendReachable = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
    const documentRef = {
      cookie: "foo=1; rshc=1",
    } as Document;

    const result = await checkPublicWebAuth(getCurrentSession, {
      requireSessionHintCookie: "rshc",
      documentRef,
      isBackendReachable,
    });

    expect(result).toBe("anonymous");
    expect(isBackendReachable).toHaveBeenCalledTimes(1);
  });

  it("returns anonymous when health succeeds on second attempt after first failure", async () => {
    vi.useFakeTimers();
    try {
      const getCurrentSession = vi.fn<() => Promise<unknown>>().mockRejectedValue(new Error("unauthorized"));
      const isBackendReachable = vi
        .fn<() => Promise<boolean>>()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      const documentRef = {
        cookie: "foo=1; rshc=1",
      } as Document;

      const resultPromise = checkPublicWebAuth(getCurrentSession, {
        requireSessionHintCookie: "rshc",
        documentRef,
        isBackendReachable,
      });

      await vi.advanceTimersByTimeAsync(2000);

      const result = await resultPromise;

      expect(result).toBe("anonymous");
      expect(isBackendReachable).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
