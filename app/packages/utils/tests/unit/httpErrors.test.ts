import { describe, expect, it } from "vitest";

import {
  getApiErrorData,
  getApiErrorMessage,
  getApiValidationFieldLeafs,
  getApiValidationFields,
} from "@restorio/utils";

describe("getApiErrorData", () => {
  it("extracts nested response data", () => {
    const error = { response: { data: { message: "Invalid request" } } };

    expect(getApiErrorData(error)).toEqual({ message: "Invalid request" });
  });

  it("returns undefined for non-objects", () => {
    expect(getApiErrorData("boom")).toBeUndefined();
  });
});

describe("getApiErrorMessage", () => {
  it("prefers detail when detail is a non-empty string", () => {
    expect(getApiErrorMessage({ detail: "Detailed message", message: "Fallback" })).toBe("Detailed message");
  });

  it("falls back to message when detail is not a string", () => {
    expect(getApiErrorMessage({ detail: [{ loc: ["body", "email"] }], message: "Fallback" })).toBe("Fallback");
  });

  it("returns undefined when data is not a record", () => {
    expect(getApiErrorMessage(null)).toBeUndefined();
    expect(getApiErrorMessage(undefined)).toBeUndefined();
    expect(getApiErrorMessage("string")).toBeUndefined();
  });

  it("returns undefined when detail is empty string", () => {
    expect(getApiErrorMessage({ detail: "", message: "Fallback" })).toBe("Fallback");
  });

  it("returns undefined when both detail and message are empty or whitespace", () => {
    expect(getApiErrorMessage({ detail: "  ", message: "  " })).toBeUndefined();
  });
});

describe("getApiValidationFields", () => {
  it("returns fields from ValidationErrorResponse payload", () => {
    expect(getApiValidationFields({ fields: ["email", "password"] })).toEqual(["email", "password"]);
  });

  it("extracts dotted paths from FastAPI-style detail payload", () => {
    expect(
      getApiValidationFields({
        detail: [{ loc: ["body", "email"] }, { loc: ["body", "credentials", "password"] }],
      }),
    ).toEqual(["email", "credentials.password"]);
  });

  it("deduplicates fields coming from both formats", () => {
    expect(getApiValidationFields({ fields: ["email"], detail: [{ loc: ["body", "email"] }] })).toEqual(["email"]);
  });

  it("returns empty array when data is not a record", () => {
    expect(getApiValidationFields(null)).toEqual([]);
    expect(getApiValidationFields(undefined)).toEqual([]);
  });

  it("skips non-string or empty field entries in fields array", () => {
    expect(getApiValidationFields({ fields: ["a", "", "b", 1 as unknown as string] })).toEqual(["a", "b"]);
  });

  it("skips detail items without valid loc array", () => {
    expect(getApiValidationFields({ detail: [{ loc: "not-array" }] })).toEqual([]);
    expect(getApiValidationFields({ detail: [{}] })).toEqual([]);
  });

  it("includes numeric loc parts as string", () => {
    expect(getApiValidationFields({ detail: [{ loc: ["body", "items", 0, "name"] }] })).toEqual(["items.0.name"]);
  });

  it("filters out body from path", () => {
    expect(getApiValidationFields({ detail: [{ loc: ["body", "email"] }] })).toEqual(["email"]);
  });
});

describe("getApiValidationFieldLeafs", () => {
  it("returns lowercase leaf segments from validation paths", () => {
    expect(getApiValidationFieldLeafs({ fields: ["credentials.email", "Password"] })).toEqual(["email", "password"]);
  });

  it("deduplicates leafs", () => {
    expect(getApiValidationFieldLeafs({ fields: ["a.b", "c.b"] })).toEqual(["b"]);
  });

  it("returns empty array when no valid fields", () => {
    expect(getApiValidationFieldLeafs({})).toEqual([]);
    expect(getApiValidationFieldLeafs({ fields: [] })).toEqual([]);
  });
});
