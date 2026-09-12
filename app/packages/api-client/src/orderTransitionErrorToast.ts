import { getOrderStatusLabelKey } from "@restorio/utils";

import { parseOrderStatusTransitionDetails, parseRestorioApiError } from "./restorioApiError";

export type OrderStatusErrorTranslateFn = (
  key: string,
  defaultMessageOrValues?: string | Record<string, string | number | undefined>,
  values?: Record<string, string | number | undefined>,
) => string;

export const getOrderStatusUpdateErrorToastTitle = (error: unknown, t: OrderStatusErrorTranslateFn): string => {
  const parsed = parseRestorioApiError(error);

  if (!parsed) {
    return t("orders.errors.statusUpdateFailed");
  }

  const transition = parseOrderStatusTransitionDetails(parsed.details);

  if (transition) {
    const fromLabel = t(getOrderStatusLabelKey(transition.current));
    const toLabel = t(getOrderStatusLabelKey(transition.newStatus));

    return t("orders.errors.invalidTransition", {
      from: fromLabel,
      to: toLabel,
    });
  }

  return parsed.message;
};
