import { renderHook, act } from "@testing-library/react";
import { I18nProvider } from "@restorio/ui";
import React, { type PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";

import { useValidationErrors } from "../../../src/hooks/useValidationErrors";
import { fallbackMessages, getMessages } from "../../../src/i18n/messages";

const wrapper = ({ children }: PropsWithChildren): React.JSX.Element => (
  <I18nProvider locale="en" messages={getMessages("en")} fallbackMessages={fallbackMessages}>
    {children}
  </I18nProvider>
);

describe("useValidationErrors", () => {
  it("returns false for non-response errors", () => {
    const { result } = renderHook(() => useValidationErrors(), { wrapper });

    const handled = result.current.setFromResponse("boom", "payment.fields");

    expect(handled).toBe(false);
    expect(result.current.fieldErrors).toEqual([]);
  });

  it("returns false for non-422 responses", () => {
    const { result } = renderHook(() => useValidationErrors(), { wrapper });

    const handled = result.current.setFromResponse(
      {
        response: {
          status: 500,
          data: { fields: ["p24_api"] },
        },
      },
      "payment.fields",
    );

    expect(handled).toBe(false);
    expect(result.current.fieldErrors).toEqual([]);
  });

  it("returns false for malformed or empty validation payload", () => {
    const { result } = renderHook(() => useValidationErrors(), { wrapper });

    const malformedHandled = result.current.setFromResponse(
      {
        response: {
          status: 422,
          data: { fields: "p24_api" },
        },
      },
      "payment.fields",
    );

    const emptyHandled = result.current.setFromResponse(
      {
        response: {
          status: 422,
          data: { fields: [] },
        },
      },
      "payment.fields",
    );

    expect(malformedHandled).toBe(false);
    expect(emptyHandled).toBe(false);
  });

  it("maps snake_case fields, exposes lookup helpers, and clears errors", () => {
    const { result } = renderHook(() => useValidationErrors(), { wrapper });

    act(() => {
      const handled = result.current.setFromResponse(
        {
          response: {
            status: 422,
            data: { fields: ["p24_api", "p24_crc"] },
          },
        },
        "payment.fields",
      );

      expect(handled).toBe(true);
    });

    expect(result.current.fieldErrors).toEqual([
      { field: "p24Api", message: "API key is required and must contain exactly 32 characters" },
      { field: "p24Crc", message: "CRC key is required and must contain exactly 16 characters" },
    ]);
    expect(result.current.fieldErrorMap).toEqual({
      p24Api: "API key is required and must contain exactly 32 characters",
      p24Crc: "CRC key is required and must contain exactly 16 characters",
    });
    expect(result.current.hasFieldError("p24Api")).toBe(true);
    expect(result.current.hasFieldError("p24Merchantid")).toBe(false);
    expect(result.current.getFieldError("p24Crc")).toBe("CRC key is required and must contain exactly 16 characters");
    expect(result.current.getFieldError("unknown")).toBeUndefined();

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.fieldErrors).toEqual([]);
    expect(result.current.fieldErrorMap).toEqual({});
  });
});
