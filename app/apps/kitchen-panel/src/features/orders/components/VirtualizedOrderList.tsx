import { useVirtualizer } from "@tanstack/react-virtual";
import { type ReactElement, type ReactNode, useCallback, useRef } from "react";

interface VirtualizedOrderListProps {
  count: number;
  estimateSize?: number;
  gap?: number;
  renderItem: (index: number) => ReactNode;
  footer?: ReactNode;
}

export const VirtualizedOrderList = ({
  count,
  estimateSize = 120,
  gap = 12,
  renderItem,
  footer,
}: VirtualizedOrderListProps): ReactElement => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    gap,
    overscan: 5,
  });

  const setScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollRef.current = node;
      virtualizer.measure();
    },
    [virtualizer],
  );

  return (
    <div ref={setScrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
      <div
        role="list"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(virtualItem.index)}
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
};
