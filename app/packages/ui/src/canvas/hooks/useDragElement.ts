import { useCallback, useState } from "react";

export interface Point {
  x: number;
  y: number;
}

export interface UseDragElementOptions {
  onDragEnd?: (delta: Point) => void;
  snap?: (x: number, y: number) => Point;
}

export const useDragElement = (
  options: UseDragElementOptions = {},
): {
  isDragging: boolean;
  dragOffset: Point | null;
  startDrag: (clientX: number, clientY: number, elementX: number, elementY: number) => void;
  moveDrag: (clientX: number, clientY: number) => Point | null;
  endDrag: (clientX: number, clientY: number) => void;
} => {
  const { onDragEnd, snap } = options;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ client: Point; element: Point } | null>(null);
  const [dragOffset, setDragOffset] = useState<Point | null>(null);

  const startDrag = useCallback((clientX: number, clientY: number, elementX: number, elementY: number): void => {
    setIsDragging(true);
    setDragStart({ client: { x: clientX, y: clientY }, element: { x: elementX, y: elementY } });
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const moveDrag = useCallback(
    (clientX: number, clientY: number): Point | null => {
      if (!dragStart) {
        return null;
      }
      const rawX = dragStart.element.x + (clientX - dragStart.client.x);
      const rawY = dragStart.element.y + (clientY - dragStart.client.y);
      const point = snap ? snap(rawX, rawY) : { x: rawX, y: rawY };

      setDragOffset({
        x: point.x - dragStart.element.x,
        y: point.y - dragStart.element.y,
      });

      return point;
    },
    [dragStart, snap],
  );

  const endDrag = useCallback(
    (clientX: number, clientY: number): void => {
      if (!dragStart) {
        setIsDragging(false);
        setDragOffset(null);
        setDragStart(null);

        return;
      }
      const rawX = dragStart.element.x + (clientX - dragStart.client.x);
      const rawY = dragStart.element.y + (clientY - dragStart.client.y);
      const point = snap ? snap(rawX, rawY) : { x: rawX, y: rawY };
      const delta = { x: point.x - dragStart.element.x, y: point.y - dragStart.element.y };

      onDragEnd?.(delta);
      setIsDragging(false);
      setDragOffset(null);
      setDragStart(null);
    },
    [dragStart, onDragEnd, snap],
  );

  return { isDragging, dragOffset, startDrag, moveDrag, endDrag };
};
