import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import {
  INVALID_ORDER_STATUS_TRANSITION_CODE,
  parseOrderStatusTransitionDetails,
  parseRestorioApiError,
} from "../../src/restorioApiError";

const emptyConfig = {} as InternalAxiosRequestConfig;

describe("parseRestorioApiError", () => {
  it("returns null for non-axios errors", () => {
    expect(parseRestorioApiError(new Error("x"))).toBeNull();
  });

  it("parses message and details from axios error response", () => {
    const response: AxiosResponse = {
      data: {
        message: "Cannot transition",
        details: {
          code: INVALID_ORDER_STATUS_TRANSITION_CODE,
          current: "new",
          new_status: "paid",
        },
      },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: emptyConfig,
    };

    const err = new AxiosError("fail", "ERR_BAD_REQUEST", emptyConfig, undefined, response);

    expect(parseRestorioApiError(err)).toEqual({
      message: "Cannot transition",
      details: {
        code: INVALID_ORDER_STATUS_TRANSITION_CODE,
        current: "new",
        new_status: "paid",
      },
    });
  });
});

describe("parseOrderStatusTransitionDetails", () => {
  it("returns null when code does not match", () => {
    expect(parseOrderStatusTransitionDetails({ code: "other" })).toBeNull();
  });

  it("returns current and newStatus when valid", () => {
    expect(
      parseOrderStatusTransitionDetails({
        code: INVALID_ORDER_STATUS_TRANSITION_CODE,
        current: "new",
        new_status: "preparing",
      }),
    ).toEqual({ current: "new", newStatus: "preparing" });
  });
});
