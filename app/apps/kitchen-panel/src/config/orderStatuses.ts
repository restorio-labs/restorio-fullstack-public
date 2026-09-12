import { OrderStatus } from "@restorio/types";

export const statusConfig = {
  [OrderStatus.NEW]: {
    labelKey: "orders.status.new",
    ariaLabelKey: "aria.newOrders",
    indicatorClassName: "bg-status-info-background border-status-info-border text-status-info-text",
    iconClassName: "text-status-info-text",
    iconKey: "add",
  },
  [OrderStatus.PREPARING]: {
    labelKey: "orders.status.preparing",
    ariaLabelKey: "aria.preparingOrders",
    indicatorClassName: "bg-status-warning-background border-status-warning-border text-status-warning-text",
    iconClassName: "text-status-warning-text",
    iconKey: "clock",
  },
  [OrderStatus.READY_TO_SERVE]: {
    labelKey: "orders.status.readyToServe",
    ariaLabelKey: "aria.readyToServeOrders",
    indicatorClassName: "bg-status-success-background border-status-success-border text-status-success-text",
    iconClassName: "text-status-success-text",
    iconKey: "check",
  },
  [OrderStatus.REJECTED]: {
    labelKey: "orders.status.rejected",
    ariaLabelKey: "aria.rejectedOrders",
    indicatorClassName: "bg-status-error-background border-status-error-border text-status-error-text",
    iconClassName: "text-status-error-text",
    iconKey: "x",
  },
} as const;
