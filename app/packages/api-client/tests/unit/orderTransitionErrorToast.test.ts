import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { getOrderStatusUpdateErrorToastTitle } from "../../src/orderTransitionErrorToast";
import { INVALID_ORDER_STATUS_TRANSITION_CODE } from "../../src/restorioApiError";

const emptyConfig = {} as InternalAxiosRequestConfig;

describe("getOrderStatusUpdateErrorToastTitle", () => {
  const t = (
    key: string,
    defaultMessageOrValues?: string | Record<string, string | number | undefined>,
    values?: Record<string, string | number | undefined>,
  ): string => {
    if (key === "orders.status.new") {
      return "NEW";
    }

    if (key === "orders.status.paid") {
      return "PAID";
    }

    if (key === "orders.errors.invalidTransition") {
      return key;
    }

    if (key === "orders.errors.statusUpdateFailed") {
      return "FAILED";
    }

    if (typeof defaultMessageOrValues === "string") {
      return defaultMessageOrValues;
    }

    return key;
  };

  it("returns translated transition message when details match", () => {
    const response: AxiosResponse = {
      data: {
        message: "Cannot transition from 'new' to 'paid'",
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

    expect(getOrderStatusUpdateErrorToastTitle(err, t)).toBe("orders.errors.invalidTransition");
  });

  it("returns generic message when error is not axios", () => {
    expect(getOrderStatusUpdateErrorToastTitle(new Error("x"), t)).toBe("FAILED");
  });

  it("returns API message when not a transition error", () => {
    const response: AxiosResponse = {
      data: { message: "Rejection reason is required" },
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config: emptyConfig,
    };

    const err = new AxiosError("fail", "ERR_BAD_REQUEST", emptyConfig, undefined, response);

    expect(getOrderStatusUpdateErrorToastTitle(err, t)).toBe("Rejection reason is required");
  });
});
