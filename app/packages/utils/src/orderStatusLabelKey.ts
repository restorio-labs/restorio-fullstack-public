const ORDER_STATUS_LABEL_KEYS: Record<string, string> = {
  new: "orders.status.new",
  preparing: "orders.status.preparing",
  ready: "orders.status.ready",
  ready_to_serve: "orders.status.readyToServe",
  rejected: "orders.status.rejected",
  refunded: "orders.status.refunded",
  paid: "orders.status.paid",
  pending: "orders.status.pending",
  confirmed: "orders.status.confirmed",
  delivered: "orders.status.delivered",
  cancelled: "orders.status.cancelled",
};

export const getOrderStatusLabelKey = (status: string): string => {
  return ORDER_STATUS_LABEL_KEYS[status] ?? "orders.status.unknown";
};
