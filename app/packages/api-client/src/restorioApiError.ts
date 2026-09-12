import axios from "axios";

export const INVALID_ORDER_STATUS_TRANSITION_CODE = "INVALID_ORDER_STATUS_TRANSITION" as const;

export interface RestorioApiErrorPayload {
  message: string;
  details?: Record<string, unknown>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const parseRestorioApiError = (error: unknown): RestorioApiErrorPayload | null => {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const data = error.response?.data;

  if (!isRecord(data)) {
    return null;
  }

  const { message } = data;

  if (typeof message !== "string") {
    return null;
  }

  const { details } = data;

  if (details !== undefined && !isRecord(details)) {
    return { message };
  }

  return { message, details };
};

export interface OrderStatusTransitionErrorDetails {
  current: string;
  newStatus: string;
}

export const parseOrderStatusTransitionDetails = (
  details: Record<string, unknown> | undefined,
): OrderStatusTransitionErrorDetails | null => {
  if (!details) {
    return null;
  }

  if (details.code !== INVALID_ORDER_STATUS_TRANSITION_CODE) {
    return null;
  }

  const { current } = details;
  const newStatus = details.new_status;

  if (typeof current !== "string" || typeof newStatus !== "string") {
    return null;
  }

  return { current, newStatus };
};
