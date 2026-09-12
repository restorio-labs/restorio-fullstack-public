import type { FloorCanvas as FloorCanvasType, FloorElement } from "@restorio/types";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";

import { clampElementBounds, isTextEditingTarget } from "../editorShared";
import { cloneFloorElement, type FloorEditorHistoryAction } from "../floorLayoutState";

interface UseFloorEditorKeyboardOptions {
  layout: FloorCanvasType;
  selectedIds: string[];
  clipboardElements: FloorElement[];
  setClipboardElements: Dispatch<SetStateAction<FloorElement[]>>;
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  setSelectedId: (id: string | null) => void;
  setIsMultiSelectModifierPressed: Dispatch<SetStateAction<boolean>>;
  removeSelectedElements: () => void;
  dispatch: Dispatch<FloorEditorHistoryAction>;
}

export const useFloorEditorKeyboard = ({
  layout,
  selectedIds,
  clipboardElements,
  setClipboardElements,
  setSelectedIds,
  setSelectedId,
  setIsMultiSelectModifierPressed,
  removeSelectedElements,
  dispatch,
}: UseFloorEditorKeyboardOptions): void => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Control" || e.key === "Meta") {
        setIsMultiSelectModifierPressed(true);
      }

      if (isTextEditingTarget(e.target)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (selectedIds.length === 0) {
          return;
        }

        e.preventDefault();
        const selectedSet = new Set(selectedIds);
        const copied = layout.elements.filter((element) => selectedSet.has(element.id));

        setClipboardElements(copied);

        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (clipboardElements.length === 0) {
          return;
        }

        e.preventDefault();
        let nextTableNumber = layout.elements.reduce((max, element) => {
          if (element.type !== "table") {
            return max;
          }

          return Math.max(max, element.tableNumber);
        }, 0);
        const pasted = clipboardElements.map((element) => {
          const copy = cloneFloorElement(element);
          const withNumber = copy.type === "table" ? { ...copy, tableNumber: ++nextTableNumber } : copy;
          const nextBounds = clampElementBounds(
            {
              x: element.x + Math.round(element.w / 2),
              y: element.y,
              w: withNumber.w,
              h: withNumber.h,
              rotation: withNumber.rotation,
            },
            layout,
          );

          return { ...withNumber, ...nextBounds };
        });

        pasted.forEach((element) => {
          dispatch({
            type: "ADD_ELEMENT",
            payload: { element, x: element.x, y: element.y },
          });
        });
        setSelectedIds(pasted.map((element) => element.id));
        setSelectedId(pasted[0]?.id ?? null);

        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length === 0) {
          return;
        }

        e.preventDefault();
        removeSelectedElements();
      }
    };

    const onKeyUp = (e: KeyboardEvent): void => {
      if (e.key === "Control" || e.key === "Meta") {
        setIsMultiSelectModifierPressed(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    clipboardElements,
    dispatch,
    layout,
    removeSelectedElements,
    selectedIds,
    setClipboardElements,
    setIsMultiSelectModifierPressed,
    setSelectedId,
    setSelectedIds,
  ]);
};
