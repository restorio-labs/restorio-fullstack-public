import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { TokenStorage } from "../../src/storage";

describe("TokenStorage", () => {
  let cookieStore: Record<string, string>;
  let cookieWrites: string[];
  const originalWindow = globalThis.window as typeof globalThis.window | undefined;
  const originalDocument = globalThis.document as typeof globalThis.document | undefined;
  const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, "location");

  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore = {};
    cookieWrites = [];

    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () =>
        Object.entries(cookieStore)
          .map(([key, value]) => `${key}=${value}`)
          .join("; "),
      set: (cookie: string) => {
        cookieWrites.push(cookie);

        const [firstPart] = cookie.split(";");
        const [rawKey, rawValue = ""] = firstPart.split("=");
        const key = rawKey.trim();
        const value = rawValue.trim();
        const hasMaxAgeZero = cookie.includes("Max-Age=0");

        if (hasMaxAgeZero) {
          delete cookieStore[key];

          return;
        }

        cookieStore[key] = value;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    if (originalWindow !== undefined) {
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    }

    if (originalDocument !== undefined) {
      Object.defineProperty(globalThis, "document", {
        value: originalDocument,
        writable: true,
        configurable: true,
      });
    }

    if (originalCookieDescriptor) {
      Object.defineProperty(Document.prototype, "cookie", originalCookieDescriptor);
    }

    if (originalLocationDescriptor) {
      Object.defineProperty(window, "location", originalLocationDescriptor);
    }
  });

  it("should return null when window is undefined", () => {
    const originalWindow = (globalThis as { window?: unknown }).window;

    vi.stubGlobal("window", undefined);
    expect(TokenStorage.getAccessToken()).toBeNull();
    vi.stubGlobal("window", originalWindow);
  });

  it("should get access token from cookie", () => {
    const mockToken = "test-access-token";

    cookieStore.rat = encodeURIComponent(mockToken);

    expect(TokenStorage.getAccessToken()).toBe(mockToken);
  });

  it("should not set access token from client-side code", () => {
    const mockToken = "test-access-token";

    TokenStorage.setAccessToken(mockToken);

    expect(cookieWrites).toHaveLength(0);
  });

  it("should return null if document is undefined", () => {
    Object.defineProperty(globalThis.window, "document", {
      value: undefined,
      configurable: true,
    });

    expect(TokenStorage.getAccessToken()).toBeNull();
  });

  it("should do nothing if document is undefined", () => {
    Object.defineProperty(globalThis.window, "document", {
      value: undefined,
      configurable: true,
    });

    TokenStorage.setAccessToken("test");

    expect(cookieWrites).toHaveLength(0);
  });

  it("should not clear HttpOnly cookies from client-side code", () => {
    TokenStorage.clearTokens();

    expect(cookieWrites).toHaveLength(0);
  });

  it("should not clear tokens if document is undefined", () => {
    Object.defineProperty(globalThis.window, "document", {
      value: undefined,
      configurable: true,
    });

    TokenStorage.clearTokens();

    expect(cookieWrites).toHaveLength(0);
  });

  it("should decode token", () => {
    const mockToken =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJuYW1lIjoiUmFueSIsImlhdCI6MTczNTYxMzk0M30.EsmYMso6a8Y-HUijYnO3jRJjuS9XLtASxIKB4HQPj_U";

    const decoded = TokenStorage.decodeToken(mockToken);

    expect(decoded).toBeDefined();
    expect(decoded?.sub).toBe("test-user-id");
  });

  it("should set both tokens", () => {
    TokenStorage.setTokens("access", "refresh");
    expect(cookieWrites).toHaveLength(0);
  });

  it("should return true if token is expired", () => {
    const expiredToken =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJuYW1lIjoiUmFueSIsImlhdCI6MTUxNjIzOTAyMn0.cxeoyZKNyqrTMbGCDKrT8_1qWdO3BHI5iK8YR4CLvCM";

    expect(TokenStorage.isTokenExpired(expiredToken)).toBe(true);
  });

  it("should return false if token is not expired", () => {
    const token = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0=.eyJleHAiOjQxMDI0NDQ4MDB9.test-signature-ignored";

    expect(TokenStorage.isTokenExpired(token)).toBe(false);
  });

  it("decodeToken returns null for an invalid token", () => {
    const invalidToken = "this.is.not.valid";
    const result = TokenStorage.decodeToken(invalidToken);

    expect(result).toBeNull();
  });

  it("setRefreshToken does nothing when document is undefined", () => {
    Object.defineProperty(globalThis.window, "document", {
      value: undefined,
      configurable: true,
    });

    TokenStorage.setRefreshToken("refresh-token");

    expect(cookieWrites).toHaveLength(0);
  });

  it("getRefreshToken returns null when document is undefined", () => {
    Object.defineProperty(globalThis.window, "document", {
      value: undefined,
      configurable: true,
    });

    const result = TokenStorage.getRefreshToken();

    expect(result).toBeNull();
  });

  it("getRefreshToken returns value from cookie", () => {
    cookieStore.rrt = encodeURIComponent("refresh-token-value");

    const result = TokenStorage.getRefreshToken();

    expect(result).toBe("refresh-token-value");
  });

  it("setRefreshToken does not set value from client-side code", () => {
    TokenStorage.setRefreshToken("new-refresh-token");

    expect(cookieWrites).toHaveLength(0);
  });

  it("setAccessToken remains no-op for production hosts", () => {
    Object.defineProperty(window, "location", {
      value: {
        hostname: "admin.restorio.org",
        protocol: "https:",
      },
      configurable: true,
    });

    TokenStorage.setAccessToken("abc");

    expect(cookieWrites).toHaveLength(0);
  });

  it("isTokenExpired returns true when token has no exp field", () => {
    const tokenWithoutExp = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0=.eyJzdWIiOiJ0ZXN0In0=.test-signature";

    expect(TokenStorage.isTokenExpired(tokenWithoutExp)).toBe(true);
  });

  it("isTokenExpired returns true for invalid token", () => {
    const invalidToken = "invalid.token.here";

    expect(TokenStorage.isTokenExpired(invalidToken)).toBe(true);
  });

  it("isAccessTokenValid returns true for code pattern", () => {
    expect(TokenStorage.isAccessTokenValid("123-456")).toBe(true);
  });

  it("isAccessTokenValid returns false for expired JWT", () => {
    const expiredToken =
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJuYW1lIjoiUmFueSIsImlhdCI6MTUxNjIzOTAyMn0.cxeoyZKNyqrTMbGCDKrT8_1qWdO3BHI5iK8YR4CLvCM";

    expect(TokenStorage.isAccessTokenValid(expiredToken)).toBe(false);
  });

  it("isAccessTokenValid returns true for valid JWT", () => {
    const validToken = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0=.eyJleHAiOjQxMDI0NDQ4MDB9.test-signature-ignored";

    expect(TokenStorage.isAccessTokenValid(validToken)).toBe(true);
  });
});
