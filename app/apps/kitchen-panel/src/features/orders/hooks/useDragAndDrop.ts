import { useCallback, useRef, useState } from "react";

export interface DragPosition {
  x: number;
  y: number;
}

export interface DragState {
  isDragging: boolean;
  startPosition: DragPosition | null;
  currentPosition: DragPosition | null;
  draggedItemId: string | null;
  activeDropZoneId: string | null;
  dropTargetItemId: string | null;
  dropPosition: "before" | "after" | null;
}

export interface UseDragAndDropOptions {
  onDragStart?: (itemId: string, position: DragPosition) => void;
  onDragMove?: (itemId: string, position: DragPosition) => void;
  onDragEnd?: (itemId: string, startPosition: DragPosition, endPosition: DragPosition) => void;
  onDrop?: (
    itemId: string,
    targetZone: string | null,
    dropTargetItemId?: string | null,
    dropPosition?: "before" | "after" | null,
  ) => void;
  dragThreshold?: number;
  touchActionNone?: boolean;
}

export interface UseDragAndDropReturn {
  dragState: DragState;
  getDragHandleProps: (itemId: string) => {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
    style: React.CSSProperties;
  };
  resetDrag: () => void;
}

export const useDragAndDrop = (options: UseDragAndDropOptions = {}): UseDragAndDropReturn => {
  const { onDragStart, onDragMove, onDragEnd, onDrop, dragThreshold = 5, touchActionNone = true } = options;

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPosition: null,
    currentPosition: null,
    draggedItemId: null,
    activeDropZoneId: null,
    dropTargetItemId: null,
    dropPosition: null,
  });

  const pointerIdRef = useRef<number | null>(null);
  const hasMovedRef = useRef(false);

  const resetDrag = useCallback((): void => {
    setDragState({
      isDragging: false,
      startPosition: null,
      currentPosition: null,
      draggedItemId: null,
      activeDropZoneId: null,
      dropTargetItemId: null,
      dropPosition: null,
    });
    pointerIdRef.current = null;
    hasMovedRef.current = false;
  }, []);

  const handlePointerDown = useCallback(
    (itemId: string) =>
      (event: React.PointerEvent<HTMLElement>): void => {
        if (event.button !== 0) {
          return;
        }

        const target = event.currentTarget as HTMLElement;

        target.setPointerCapture(event.pointerId);
        pointerIdRef.current = event.pointerId;
        hasMovedRef.current = false;

        const position: DragPosition = {
          x: event.clientX,
          y: event.clientY,
        };

        setDragState({
          isDragging: false,
          startPosition: position,
          currentPosition: position,
          draggedItemId: itemId,
          activeDropZoneId: null,
          dropTargetItemId: null,
          dropPosition: null,
        });
      },
    [],
  );

  const handlePointerMove = useCallback(
    (itemId: string) =>
      (event: React.PointerEvent<HTMLElement>): void => {
        if (pointerIdRef.current !== event.pointerId || !dragState.startPosition) {
          return;
        }

        const currentPosition: DragPosition = {
          x: event.clientX,
          y: event.clientY,
        };

        const deltaX = Math.abs(currentPosition.x - dragState.startPosition.x);
        const deltaY = Math.abs(currentPosition.y - dragState.startPosition.y);
        const hasMoved = deltaX > dragThreshold || deltaY > dragThreshold;

        if (!dragState.isDragging && hasMoved) {
          hasMovedRef.current = true;
          setDragState((prev) => ({
            ...prev,
            isDragging: true,
            currentPosition,
          }));
          onDragStart?.(itemId, dragState.startPosition);
        } else if (dragState.isDragging) {
          const targetElement = document.elementFromPoint(currentPosition.x, currentPosition.y);
          const snapZone = targetElement?.closest("[data-snap-zone]");
          const activeDropZoneId = snapZone?.getAttribute("data-zone-id") ?? null;

          const orderCard = targetElement?.closest("[data-order-id]");
          const dropTargetItemId = orderCard?.getAttribute("data-order-id") ?? null;

          let dropPosition: "before" | "after" | null = null;

          if (orderCard && dropTargetItemId && dropTargetItemId !== itemId) {
            const rect = orderCard.getBoundingClientRect();
            const midPoint = rect.top + rect.height / 2;

            dropPosition = currentPosition.y < midPoint ? "before" : "after";
          }

          setDragState((prev) => ({
            ...prev,
            currentPosition,
            activeDropZoneId,
            dropTargetItemId,
            dropPosition,
          }));
          onDragMove?.(itemId, currentPosition);
        }
      },
    [dragState.isDragging, dragState.startPosition, dragThreshold, onDragStart, onDragMove],
  );

  const handlePointerUp = useCallback(
    (itemId: string) =>
      (event: React.PointerEvent<HTMLElement>): void => {
        if (pointerIdRef.current !== event.pointerId) {
          return;
        }

        const target = event.currentTarget as HTMLElement;

        target.releasePointerCapture(event.pointerId);

        const endPosition: DragPosition = {
          x: event.clientX,
          y: event.clientY,
        };

        if (dragState.isDragging && dragState.startPosition) {
          const targetElement = document.elementFromPoint(endPosition.x, endPosition.y);
          const snapZone = targetElement?.closest("[data-snap-zone]");
          const targetZoneId = snapZone?.getAttribute("data-zone-id") ?? null;

          onDragEnd?.(itemId, dragState.startPosition, endPosition);
          onDrop?.(itemId, targetZoneId, dragState.dropTargetItemId, dragState.dropPosition);
        }

        resetDrag();
      },
    [
      dragState.dropPosition,
      dragState.dropTargetItemId,
      dragState.isDragging,
      dragState.startPosition,
      onDragEnd,
      onDrop,
      resetDrag,
    ],
  );

  const handlePointerCancel = useCallback(
    (_itemId: string) =>
      (event: React.PointerEvent<HTMLElement>): void => {
        if (pointerIdRef.current !== event.pointerId) {
          return;
        }

        resetDrag();
      },
    [resetDrag],
  );

  const getDragHandleProps = useCallback(
    (itemId: string) => ({
      onPointerDown: handlePointerDown(itemId),
      onPointerMove: handlePointerMove(itemId),
      onPointerUp: handlePointerUp(itemId),
      onPointerCancel: handlePointerCancel(itemId),
      style: {
        touchAction: touchActionNone ? "none" : undefined,
        cursor: dragState.isDragging && dragState.draggedItemId === itemId ? "grabbing" : "grab",
      } as React.CSSProperties,
    }),
    [
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handlePointerCancel,
      touchActionNone,
      dragState.isDragging,
      dragState.draggedItemId,
    ],
  );

  return {
    dragState,
    getDragHandleProps,
    resetDrag,
  };
};
