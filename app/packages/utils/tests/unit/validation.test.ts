import { describe, expect, it } from "vitest";

import { isEmailValid, snakeToCamel } from "@restorio/utils";

describe("snakeToCamel", () => {
  it("converts snake_case to camelCase", () => {
    expect(snakeToCamel("hello_world")).toBe("helloWorld");
    expect(snakeToCamel("first_name")).toBe("firstName");
  });

  it("handles single segment", () => {
    expect(snakeToCamel("hello")).toBe("hello");
  });

  it("handles multiple underscores", () => {
    expect(snakeToCamel("one_two_three")).toBe("oneTwoThree");
  });
});

describe("isEmailValid", () => {
  it("returns true for valid email", () => {
    expect(isEmailValid("user@example.com")).toBe(true);
    expect(isEmailValid("a@b.co")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(isEmailValid("")).toBe(false);
  });

  it("returns false for whitespace-only string", () => {
    expect(isEmailValid("   ")).toBe(false);
  });

  it("trims and validates", () => {
    expect(isEmailValid("  user@example.com  ")).toBe(true);
  });

  it("returns false for invalid format without @", () => {
    expect(isEmailValid("userexample.com")).toBe(false);
  });

  it("returns false for invalid format without domain", () => {
    expect(isEmailValid("user@")).toBe(false);
  });

  it("returns false for invalid format without tld", () => {
    expect(isEmailValid("user@domain")).toBe(false);
  });
});
