import type { FloorCanvas as FloorCanvasType, FloorElement } from "@restorio/types";
import { cn, FloorCanvas, type DragResizeMode, useI18n } from "@restorio/ui";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";

import { GRID_CELL, HANDLE_SIZE, RESIZE_HANDLES } from "../editorShared";

interface FloorEditorCanvasProps {
  className?: string;
  showGrid?: boolean;
  layout: FloorCanvasType;
  selectedIds: string[];
  selectedElements: FloorElement[];
  selectedElement: FloorElement | null;
  onElementPointerDown: (
    id: string,
    e: ReactPointerEvent,
    mode: DragResizeMode,
    bounds: { x: number; y: number; w: number; h: number; rotation?: number },
  ) => void;
  onClearSelection: () => void;
}

export const FloorEditorCanvas = ({
  className,
  showGrid = true,
  layout,
  selectedIds,
  selectedElements,
  selectedElement,
  onElementPointerDown,
  onClearSelection,
}: FloorEditorCanvasProps): ReactElement => {
  const { t } = useI18n();
  const hasMultiSelection = selectedIds.length > 1;

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-1 flex-col bg-background-secondary", className)}>
      <div className="flex min-h-0 min-w-0 flex-1 overflow-auto p-2">
        <div className="relative m-auto min-h-fit min-w-fit" style={{ touchAction: "none" }}>
          <FloorCanvas
            layout={layout}
            showGrid={showGrid}
            gridCellSize={GRID_CELL}
            selectedElementId={selectedElement?.id ?? null}
            runtimeTableStyling={false}
            interactive
            onElementPointerDown={onElementPointerDown}
            onCanvasBackgroundPointerDown={onClearSelection}
          />
          {hasMultiSelection &&
            selectedElements.map((element) => (
              <div
                key={`multi-select-${element.id}`}
                className="absolute left-0 top-0 z-20 pointer-events-none rounded-sm bg-transparent ring-2 ring-inset ring-border-focus"
                style={{
                  transform: `translate(${element.x}px, ${element.y}px)`,
                  width: element.w,
                  height: element.h,
                }}
                aria-hidden="true"
              />
            ))}
          {selectedElement && selectedIds.length === 1 && (
            <div
              className="absolute left-0 top-0 z-20 pointer-events-none"
              style={{
                transform: `translate(${selectedElement.x}px, ${selectedElement.y}px)`,
                width: selectedElement.w,
                height: selectedElement.h,
              }}
            >
              {RESIZE_HANDLES.map(({ mode, left, top, cursor }) => (
                <div
                  key={mode}
                  className={cn(
                    "pointer-events-auto absolute box-border rounded-full bg-surface-primary ring-2 ring-border-focus",
                  )}
                  style={{
                    cursor,
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    left: left === "50%" ? "50%" : left === "100%" ? "100%" : left,
                    top: top === "50%" ? "50%" : top === "100%" ? "100%" : top,
                    transform: "translate(-50%, -50%)",
                  }}
                  onPointerDown={(e) => {
                    e.preventDefault();

                    onElementPointerDown(selectedElement.id, e, mode, {
                      x: selectedElement.x,
                      y: selectedElement.y,
                      w: selectedElement.w,
                      h: selectedElement.h,
                      rotation: selectedElement.rotation,
                    });
                  }}
                  aria-label={t("floorEditor.aria.resizeHandle", { mode })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
