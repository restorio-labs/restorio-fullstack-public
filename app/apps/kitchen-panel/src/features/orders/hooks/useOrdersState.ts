import { getOrderStatusUpdateErrorToastTitle, type OrderStatusErrorTranslateFn } from "@restorio/api-client";
import type { Order, OrderStatus } from "@restorio/types";
import { useI18n, useToast } from "@restorio/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { api } from "../../../api/client";

export interface UseOrdersStateReturn {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  moveOrder: (
    orderId: string,
    targetStatus: OrderStatus,
    targetItemId?: string | null,
    position?: "before" | "after" | null,
  ) => void;
  moveOrderUp: (orderId: string) => void;
  moveOrderDown: (orderId: string) => void;
  approveOrder: (orderId: string) => void;
  rejectOrder: (orderId: string, reason: string) => void;
  markReadyToServe: (orderId: string) => void;
  refundOrder: (orderId: string) => void;
}

const ordersQueryKey = (restaurantId: string): readonly string[] => ["orders", restaurantId];

export const useOrdersState = (restaurantId: string | null): UseOrdersStateReturn => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { t } = useI18n();
  const translate: OrderStatusErrorTranslateFn = useCallback(
    (key, defaultMessageOrValues, values) => t(key, defaultMessageOrValues, values),
    [t],
  );
  const showErrorToast = useCallback(
    (title: string): void => {
      showToast("error", title);
    },
    [showToast],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ordersQueryKey(restaurantId ?? ""),
    queryFn: async () => {
      if (!restaurantId) {
        return [];
      }
      const response = await api.orders.list(restaurantId);

      return response.data;
    },
    enabled: Boolean(restaurantId),
    refetchInterval: 30000,
  });

  const orders: Order[] = Array.isArray(data) ? data : [];

  const statusMutation = useMutation({
    mutationFn: async (params: { orderId: string; status: OrderStatus; rejectionReason?: string }) => {
      if (!restaurantId) {
        throw new Error("No restaurant selected");
      }

      return api.orders.updateStatus(restaurantId, params.orderId, params.status, params.rejectionReason);
    },
    onSuccess: () => {
      if (restaurantId) {
        void queryClient.invalidateQueries({ queryKey: ordersQueryKey(restaurantId) });
      }
    },
    onError: (err: unknown) => {
      showErrorToast(getOrderStatusUpdateErrorToastTitle(err, translate));
    },
  });

  const moveOrder = useCallback(
    (orderId: string, targetStatus: OrderStatus): void => {
      statusMutation.mutate({ orderId, status: targetStatus });
    },
    [statusMutation],
  );

  const approveOrder = useCallback(
    (orderId: string): void => {
      statusMutation.mutate({ orderId, status: "preparing" as OrderStatus });
    },
    [statusMutation],
  );

  const rejectOrder = useCallback(
    (orderId: string, reason: string): void => {
      statusMutation.mutate({ orderId, status: "rejected" as OrderStatus, rejectionReason: reason });
    },
    [statusMutation],
  );

  const markReadyToServe = useCallback(
    (orderId: string): void => {
      statusMutation.mutate({ orderId, status: "ready_to_serve" as OrderStatus });
    },
    [statusMutation],
  );

  const refundMutation = useMutation({
    mutationFn: async (params: { orderId: string }) => {
      if (!restaurantId) {
        throw new Error("No restaurant selected");
      }

      return api.orders.refund(restaurantId, params.orderId);
    },
    onSuccess: () => {
      if (restaurantId) {
        void queryClient.invalidateQueries({ queryKey: ordersQueryKey(restaurantId) });
      }
    },
  });

  const refundOrder = useCallback(
    (orderId: string): void => {
      refundMutation.mutate({ orderId });
    },
    [refundMutation],
  );

  const moveOrderUp = useCallback((_orderId: string): void => {
    // reordering within columns is local-only; not persisted
  }, []);

  const moveOrderDown = useCallback((_orderId: string): void => {
    // reordering within columns is local-only; not persisted
  }, []);

  return {
    orders,
    isLoading,
    error,
    moveOrder,
    moveOrderUp,
    moveOrderDown,
    approveOrder,
    rejectOrder,
    markReadyToServe,
    refundOrder,
  };
};
