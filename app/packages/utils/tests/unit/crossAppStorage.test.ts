import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { getCrossAppValue, setCrossAppValue } from "../../src/storage/crossAppStorage";

describe("crossAppStorage", () => {
  let cookieStore: string;
  let localStorageStore: Map<string, string>;

  beforeEach(() => {
    cookieStore = "";
    localStorageStore = new Map();

    vi.stubGlobal("document", {
      get cookie() {
        return cookieStore;
      },
      set cookie(value: string) {
        cookieStore = cookieStore ? `${cookieStore}; ${value}` : value;
      },
    });
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => localStorageStore.get(key) ?? null,
        setItem: (key: string, value: string) => {
          localStorageStore.set(key, value);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("setCrossAppValue", () => {
    it("sets cookie with key and value", () => {
      setCrossAppValue("key1", "value1");

      expect(cookieStore).toContain("key1=value1");
      expect(cookieStore).toContain("path=/");
      expect(cookieStore).toContain("samesite=lax");
    });

    it("writes to backup storage", () => {
      setCrossAppValue("key1", "value1");

      const backupKey = "rsinfo";
      const stored = localStorageStore.get(backupKey);

      expect(stored).toBeDefined();
      expect(JSON.parse(stored ?? "{}")).toEqual({ key1: "value1" });
    });
  });

  describe("getCrossAppValue", () => {
    it("returns cookie value when present", () => {
      document.cookie = "key1=" + encodeURIComponent("value1") + "; path=/";

      expect(getCrossAppValue("key1")).toBe("value1");
    });

    it("returns backup value when cookie is missing", () => {
      localStorageStore.set("rsinfo", JSON.stringify({ key1: "from-backup" }));

      expect(getCrossAppValue("key1")).toBe("from-backup");
    });

    it("returns null when key is not found", () => {
      expect(getCrossAppValue("missing")).toBeNull();
    });

    it("migrates legacy localStorage value to cookie and backup", () => {
      localStorageStore.set("key1", "legacy-value");

      expect(getCrossAppValue("key1")).toBe("legacy-value");
      expect(cookieStore).toContain("key1=legacy-value");
    });
  });

  describe("when window is undefined", () => {
    it("setCrossAppValue does not throw", () => {
      vi.stubGlobal("window", undefined);

      expect(() => setCrossAppValue("k", "v")).not.toThrow();
    });

    it("getCrossAppValue returns null", () => {
      vi.stubGlobal("window", undefined);
      vi.stubGlobal("document", undefined);

      expect(getCrossAppValue("k")).toBeNull();
    });
  });
});
