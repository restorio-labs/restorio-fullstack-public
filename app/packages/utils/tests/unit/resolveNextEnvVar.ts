import { describe, expect, it } from "vitest";

import { resolveNextEnvVar } from "@restorio/utils";

describe("resolveNextEnvVar", () => {
  const source = {
    NEXT_PUBLIC_API_URL: "https://api.example.com",
    NEXT_PUBLIC_APP_NAME: "MyApp",
    NUMBER_VAR: 42,
    BOOL_VAR: true,
    NULL_VAR: null,
    UNDEF_VAR: undefined,
  };

  it("returns the value of the first matching string key", () => {
    expect(resolveNextEnvVar(source, "NEXT_PUBLIC_API_URL")).toBe("https://api.example.com");
  });

  it("returns the first key whose value is a string when multiple keys are provided", () => {
    expect(resolveNextEnvVar(source, "NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_APP_NAME")).toBe("https://api.example.com");
  });

  it("skips keys with non-string values and returns the next matching string key", () => {
    expect(resolveNextEnvVar(source, "NUMBER_VAR", "NEXT_PUBLIC_APP_NAME")).toBe("MyApp");
  });

  it("skips keys with boolean values", () => {
    expect(resolveNextEnvVar(source, "BOOL_VAR", "NEXT_PUBLIC_API_URL")).toBe("https://api.example.com");
  });

  it("skips keys with null values", () => {
    expect(resolveNextEnvVar(source, "NULL_VAR", "NEXT_PUBLIC_APP_NAME")).toBe("MyApp");
  });

  it("skips keys with undefined values", () => {
    expect(resolveNextEnvVar(source, "UNDEF_VAR", "NEXT_PUBLIC_API_URL")).toBe("https://api.example.com");
  });

  it("returns undefined when no key is found in the source", () => {
    expect(resolveNextEnvVar(source, "MISSING_KEY")).toBeUndefined();
  });

  it("returns undefined when called with no keys", () => {
    expect(resolveNextEnvVar(source)).toBeUndefined();
  });

  it("returns undefined when all candidate keys have non-string values", () => {
    expect(resolveNextEnvVar(source, "NUMBER_VAR", "BOOL_VAR", "NULL_VAR", "UNDEF_VAR")).toBeUndefined();
  });

  it("returns undefined for an empty source object", () => {
    expect(resolveNextEnvVar({}, "NEXT_PUBLIC_API_URL")).toBeUndefined();
  });

  it("treats an empty string as unset", () => {
    expect(resolveNextEnvVar({ EMPTY: "" }, "EMPTY")).toBeUndefined();
  });
});
