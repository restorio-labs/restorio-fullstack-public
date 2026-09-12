import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LAST_VISITED_TENANT_PATH_KEY,
  persistLastVisitedTenantPath,
  readLastVisitedTenantPath,
} from "../../src/lib/lastVisitedTenant";

const createMemoryLocalStorage = (): Storage => {
  const map = new Map<string, string>();

  return {
    get length(): number {
      return map.size;
    },
    clear: (): void => {
      map.clear();
    },
    getItem: (key: string): string | null => (map.has(key) ? map.get(key)! : null),
    key: (index: number): string | null => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string): void => {
      map.delete(key);
    },
    setItem: (key: string, value: string): void => {
      map.set(key, value);
    },
  } as Storage;
};

describe("lastVisitedTenant", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: createMemoryLocalStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("readLastVisitedTenantPath returns null when unset", () => {
    expect(readLastVisitedTenantPath()).toBeNull();
  });

  it("persistLastVisitedTenantPath stores path and read returns it", () => {
    persistLastVisitedTenantPath("/my-restaurant");
    expect(readLastVisitedTenantPath()).toBe("/my-restaurant");
  });

  it("persistLastVisitedTenantPath ignores root and empty", () => {
    persistLastVisitedTenantPath("/");
    persistLastVisitedTenantPath("");
    expect(readLastVisitedTenantPath()).toBeNull();
  });

  it("persistLastVisitedTenantPath rejects traversal", () => {
    persistLastVisitedTenantPath("/foo/../bar");
    expect(readLastVisitedTenantPath()).toBeNull();
  });

  it("readLastVisitedTenantPath rejects stored unsafe values", () => {
    window.localStorage.setItem(LAST_VISITED_TENANT_PATH_KEY, "/../x");
    expect(readLastVisitedTenantPath()).toBeNull();
  });

  it("persistLastVisitedTenantPath requires leading slash", () => {
    persistLastVisitedTenantPath("no-leading");
    expect(readLastVisitedTenantPath()).toBeNull();
  });
});
