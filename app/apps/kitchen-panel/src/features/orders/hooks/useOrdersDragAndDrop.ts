import type { Order, OrderStatus } from "@restorio/types";
import { useCallback, useState } from "react";

import { useDragAndDrop } from "./useDragAndDrop";

export interface UseOrdersDragAndDropReturn {
  dragState: {
    isDragging: boolean;
    draggedItemId: string | null;
    currentPosition: { x: number; y: number } | null;
    activeDropZoneId: string | null;
    dropTargetItemId: string | null;
    dropPosition: "before" | "after" | null;
  };
  getDragHandleProps: (itemId: string) => Record<string, unknown>;
  draggedOrder: Order | null;
}

export const useOrdersDragAndDrop = (
  orders: Order[],
  onOrderMove: (
    orderId: string,
    targetStatus: OrderStatus,
    targetItemId?: string | null,
    position?: "before" | "after" | null,
  ) => void,
): UseOrdersDragAndDropReturn => {
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);

  const handleDrop = useCallback(
    (
      orderId: string,
      targetZoneId: string | null,
      dropTargetItemId?: string | null,
      dropPosition?: "before" | "after" | null,
    ): void => {
      if (!targetZoneId) {
        setDraggedOrder(null);

        return;
      }

      const order = orders.find((o) => o.id === orderId);

      if (order && order.status === (targetZoneId as OrderStatus)) {
        setDraggedOrder(null);

        return;
      }

      onOrderMove(orderId, targetZoneId as OrderStatus, dropTargetItemId, dropPosition);
      setDraggedOrder(null);
    },
    [onOrderMove, orders],
  );

  const { dragState, getDragHandleProps } = useDragAndDrop({
    onDragStart: (itemId: string) => {
      const order = orders.find((o) => o.id === itemId);

      setDraggedOrder(order ?? null);
    },
    onDrop: handleDrop,
  });

  return {
    dragState,
    getDragHandleProps,
    draggedOrder,
  };
};
