import { describe, expect, it, vi, afterEach } from "vitest";

import { getEnvSource } from "@restorio/utils";

describe("getEnvSource", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the provided viteEnv object when given", () => {
    const viteEnv = { MY_KEY: "my-value" };

    expect(getEnvSource(viteEnv)).toBe(viteEnv);
  });

  it("returns an empty viteEnv object as-is (falsy check does not apply to {})", () => {
    const viteEnv = {};

    expect(getEnvSource(viteEnv)).toBe(viteEnv);
  });

  it("falls back to process.env when viteEnv is undefined and process is available", () => {
    expect(getEnvSource(undefined)).toBe(process.env);
  });

  it("returns an empty object when viteEnv is undefined and process is undefined", () => {
    vi.stubGlobal("process", undefined);
    expect(getEnvSource(undefined)).toEqual({});
  });

  it("returns an empty object when called with no arguments and process is undefined", () => {
    vi.stubGlobal("process", undefined);
    expect(getEnvSource()).toEqual({});
  });

  it("prefers viteEnv over process.env when both are available", () => {
    const viteEnv = { VITE_KEY: "vite-value" };

    expect(getEnvSource(viteEnv)).toBe(viteEnv);
    expect(getEnvSource(viteEnv)).not.toBe(process.env);
  });
});
