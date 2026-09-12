import { APP_SLUGS, Environment } from "@restorio/types";
import { describe, expect, it, vi, afterEach } from "vitest";

import {
  getAppBaseUrl,
  getAppHref,
  getAppUrl,
  getEnvMode,
  getEnvironmentFromEnv,
  getMergedRuntimeEnv,
  goToApp,
  resolveApiBaseUrl,
} from "@restorio/utils";

describe("Environment", () => {
  it("defines the supported runtime environments", () => {
    expect(Environment).toEqual({
      PRODUCTION: "production",
      DEVELOPMENT: "development",
      LOCAL: "local",
    });
  });

  it("uses lowercase string values", () => {
    expect(Object.values(Environment)).toEqual(["production", "development", "local"]);
  });
});

describe("APP_SLUGS", () => {
  it("contains all supported app slugs in stable order", () => {
    expect(APP_SLUGS).toEqual(["public-web", "admin-panel", "kitchen-panel", "waiter-panel", "mobile-app"]);
  });

  it("does not contain duplicate slugs", () => {
    expect(new Set(APP_SLUGS).size).toBe(APP_SLUGS.length);
  });
});

describe("getAppUrl", () => {
  it("returns root production domain for public web", () => {
    expect(getAppUrl(Environment.PRODUCTION, "public-web")).toBe("https://restorio.org");
  });

  it("returns subdomain production urls for non-public apps", () => {
    expect(getAppUrl(Environment.PRODUCTION, "admin-panel")).toBe("https://admin.restorio.org");
    expect(getAppUrl(Environment.PRODUCTION, "mobile-app")).toBe("https://mobile.restorio.org");
  });

  it("returns localhost urls for development", () => {
    expect(getAppUrl(Environment.DEVELOPMENT, "public-web")).toBe("http://localhost:3000");
    expect(getAppUrl(Environment.DEVELOPMENT, "admin-panel")).toBe("http://localhost:3001");
    expect(getAppUrl(Environment.DEVELOPMENT, "kitchen-panel")).toBe("http://localhost:3002");
    expect(getAppUrl(Environment.DEVELOPMENT, "mobile-app")).toBe("http://localhost:3003");
    expect(getAppUrl(Environment.DEVELOPMENT, "waiter-panel")).toBe("http://localhost:3004");
  });

  it("returns localhost urls for local", () => {
    expect(getAppUrl(Environment.LOCAL, "public-web")).toBe("http://localhost:3000");
  });
});

describe("getEnvironmentFromEnv", () => {
  it("maps production mode", () => {
    expect(getEnvironmentFromEnv("production")).toBe(Environment.PRODUCTION);
  });

  it("maps development mode", () => {
    expect(getEnvironmentFromEnv("development")).toBe(Environment.DEVELOPMENT);
  });

  it("falls back to local for unknown mode", () => {
    expect(getEnvironmentFromEnv("test")).toBe(Environment.LOCAL);
  });
});

describe("getEnvMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns ENV when set", () => {
    vi.stubEnv("ENV", "production");

    expect(getEnvMode()).toBe("production");
  });

  it("uses NODE_ENV when ENV is not set", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(getEnvMode()).toBe("production");
  });

  it("falls back to process env when import.meta.env is undefined", () => {
    vi.stubEnv("ENV", "development");
    vi.stubGlobal("import", { meta: {} });

    expect(getEnvMode()).toBe("development");
  });
});

describe("getAppHref", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns app url for current env mode", () => {
    vi.stubEnv("ENV", "production");

    expect(getAppHref("public-web")).toBe("https://restorio.org");
    expect(getAppHref("admin-panel")).toBe("https://admin.restorio.org");
  });

  it("returns localhost url when env is development", () => {
    vi.stubEnv("ENV", "development");

    expect(getAppHref("public-web")).toBe("http://localhost:3000");
  });
});

describe("getAppBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns override from VITE_PUBLIC_WEB_URL when set", () => {
    vi.stubEnv("VITE_PUBLIC_WEB_URL", "https://public.example");

    expect(getAppBaseUrl("public-web")).toBe("https://public.example");
  });

  it("returns override from VITE_ADMIN_PANEL_URL when set", () => {
    vi.stubEnv("VITE_ADMIN_PANEL_URL", "https://admin.example");

    expect(getAppBaseUrl("admin-panel")).toBe("https://admin.example");
  });

  it("falls back to getAppHref when no override", () => {
    vi.stubEnv("ENV", "development");

    expect(getAppBaseUrl("public-web")).toBe("http://localhost:3000");
    expect(getAppBaseUrl("kitchen-panel")).toBe("http://localhost:3002");
  });
});

describe("resolveApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns localhost default when no env", () => {
    expect(resolveApiBaseUrl()).toBe("http://localhost:8000/api/v1");
  });

  it("returns VITE_API_BASE_URL when set", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com/api/v1");

    expect(resolveApiBaseUrl()).toBe("https://api.example.com/api/v1");
  });

  it("uses public API host in production when no full URL env", () => {
    vi.stubEnv("ENV", "production");
    vi.stubEnv("NODE_ENV", "production");

    expect(resolveApiBaseUrl()).toBe("https://api.restorio.org/api/v1");
  });

  it("builds API path from NEXT_PUBLIC_PUBLIC_API_ORIGIN in production", () => {
    vi.stubEnv("ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_PUBLIC_API_ORIGIN", "https://api.example.org");

    expect(resolveApiBaseUrl()).toBe("https://api.example.org/api/v1");
  });

  it("does not use relative /api/v1 in production even when preferRelativeInBrowser", () => {
    vi.stubEnv("ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("window", {});

    expect(resolveApiBaseUrl({ preferRelativeInBrowser: true })).toBe("https://api.restorio.org/api/v1");
  });
});

describe("getMergedRuntimeEnv", () => {
  it("is a function", () => {
    expect(typeof getMergedRuntimeEnv).toBe("function");
  });
});

describe("goToApp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does nothing when window is undefined", () => {
    const win = globalThis.window;

    (globalThis as { window?: undefined }).window = undefined;

    expect(() => goToApp("admin-panel")).not.toThrow();

    (globalThis as { window: unknown }).window = win;
  });

  it("sets last visited app and redirects when window is defined", () => {
    const location = { href: "" };
    const setItem = vi.fn();

    vi.stubGlobal("window", { location });
    vi.stubGlobal("localStorage", { setItem });

    goToApp("waiter-panel");

    expect(setItem).toHaveBeenCalledWith("rlvp", "waiter-panel");
    expect(location.href).toBe("http://localhost:3004");
  });
});

describe("utils barrel exports", () => {
  it("exposes environment helpers from root index", () => {
    expect(typeof getAppUrl).toBe("function");
    expect(typeof getEnvironmentFromEnv).toBe("function");
    expect(typeof getEnvMode).toBe("function");
    expect(typeof getAppHref).toBe("function");
    expect(typeof getAppBaseUrl).toBe("function");
    expect(typeof resolveApiBaseUrl).toBe("function");
    expect(typeof getMergedRuntimeEnv).toBe("function");
    expect(typeof goToApp).toBe("function");
  });
});
