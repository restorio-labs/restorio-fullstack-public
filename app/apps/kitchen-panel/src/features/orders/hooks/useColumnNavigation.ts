import type { OrderStatus } from "@restorio/types";
import { useEffect, useRef, type RefObject } from "react";
import { useSearchParams } from "react-router-dom";

export const useColumnNavigation = (
  statusKeys: OrderStatus[],
  useHorizontalLayout: boolean,
): RefObject<HTMLDivElement | null> => {
  const [searchParams] = useSearchParams();
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const columnParam = searchParams.get("column");

    if (columnParam && boardRef.current) {
      const columnIndex = statusKeys.findIndex((key) => key === (columnParam as OrderStatus));

      if (columnIndex !== -1 && useHorizontalLayout) {
        const columnElement = boardRef.current.querySelector(`[data-zone-id="${columnParam}"]`);

        if (columnElement) {
          setTimeout(() => {
            columnElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
          }, 100);
        }
      }
    }
  }, [searchParams, useHorizontalLayout, statusKeys]);

  return boardRef;
};
