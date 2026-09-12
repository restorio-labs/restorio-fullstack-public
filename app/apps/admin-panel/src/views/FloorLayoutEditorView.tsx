import type {
  ElementToAdd,
  FloorCanvas as FloorCanvasType,
  FloorElement,
  FloorLayoutEditorState,
} from "@restorio/types";
import {
  Button,
  useBreakpoint,
  useDragResize,
  type DragResizeMode,
  useI18n,
  useSnapToGrid,
  useTheme,
} from "@restorio/ui";
import type { PointerEvent as ReactPointerEvent, ReactElement } from "react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { FloorEditorCanvas } from "../features/floor/components/FloorEditorCanvas";
import { FloorEditorInspector } from "../features/floor/components/FloorEditorInspector";
import { FloorEditorToolbar } from "../features/floor/components/FloorEditorToolbar";
import {
  GRID_CELL,
  ZONE_COLOR_SELECTORS,
  clampElementBounds,
  ensureMinimumCanvasSize,
} from "../features/floor/editorShared";
import { readFloorEditorShowGrid, writeFloorEditorShowGrid } from "../features/floor/floorEditorStorage";
import {
  createElementFromToAdd,
  layoutHistoryReducer,
  type FloorEditorHistoryAction,
} from "../features/floor/floorLayoutState";
import { useFloorEditorKeyboard } from "../features/floor/hooks/useFloorEditorKeyboard";

interface FloorLayoutEditorViewProps {
  initialLayout: FloorCanvasType;
  onSave?: (layout: FloorCanvasType) => void | Promise<void>;
  onHeaderActionsChange?: (actions: ReactElement | null) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  extraControls?: ReactElement | null;
}

export const FloorLayoutEditorView = ({
  initialLayout,
  onSave,
  onHeaderActionsChange,
  onDirtyChange,
  extraControls,
}: FloorLayoutEditorViewProps): ReactElement => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const isDesktopUp = useBreakpoint("lg");
  const normalizedInitialLayout = ensureMinimumCanvasSize(initialLayout);
  const [state, dispatch] = useReducer<FloorLayoutEditorState, [FloorEditorHistoryAction]>(layoutHistoryReducer, {
    layout: normalizedInitialLayout,
    history: [normalizedInitialLayout],
    historyIndex: 0,
  });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [showCanvasGrid, setShowCanvasGrid] = useState((): boolean => readFloorEditorShowGrid());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clipboardElements, setClipboardElements] = useState<FloorElement[]>([]);
  const [isMultiSelectModifierPressed, setIsMultiSelectModifierPressed] = useState(false);
  const [activeDragMode, setActiveDragMode] = useState<DragResizeMode | null>(null);
  const hasPendingHistoryCommitRef = useRef(false);

  const { snapPoint, snapSize: snapGridSize } = useSnapToGrid(GRID_CELL);
  const onBoundsChange = useCallback(
    (id: string, bounds: { x: number; y: number; w: number; h: number; rotation?: number }) => {
      const clampedBounds = clampElementBounds(bounds, state.layout);
      const currentElement = state.layout.elements.find((element) => element.id === id);

      if (!currentElement) {
        return;
      }

      const isMultiMove = activeDragMode === "move" && selectedIds.length > 1 && selectedIds.includes(id);

      if (!isMultiMove) {
        dispatch({ type: "UPDATE_ELEMENT", payload: { id, bounds: clampedBounds, recordHistory: false } });
        hasPendingHistoryCommitRef.current = true;

        return;
      }

      const deltaX = clampedBounds.x - currentElement.x;
      const deltaY = clampedBounds.y - currentElement.y;

      if (deltaX === 0 && deltaY === 0) {
        return;
      }

      selectedIds.forEach((selectedId) => {
        const element = state.layout.elements.find((item) => item.id === selectedId);

        if (!element) {
          return;
        }

        const nextBounds = clampElementBounds(
          {
            x: element.x + deltaX,
            y: element.y + deltaY,
            w: element.w,
            h: element.h,
            rotation: element.rotation,
          },
          state.layout,
        );

        dispatch({ type: "UPDATE_ELEMENT", payload: { id: selectedId, bounds: nextBounds, recordHistory: false } });
      });

      hasPendingHistoryCommitRef.current = true;
    },
    [activeDragMode, selectedIds, state.layout],
  );

  const dragResize = useDragResize({
    onBoundsChange,
    snap: (x, y) => snapPoint(x, y),
    snapSize: (w, h) => snapGridSize(w, h),
    minWidth: GRID_CELL,
    minHeight: GRID_CELL,
    canvasBounds: { width: state.layout.width, height: state.layout.height },
  });
  const { setSelectedId } = dragResize;

  const [addZoneCount, setAddZoneCount] = useState(0);

  const zoneColors = useMemo(() => {
    const palette = ZONE_COLOR_SELECTORS.map((getColor) => getColor(colors)).filter((value): value is string =>
      Boolean(value),
    );

    if (palette.length === 0) {
      return [colors.status.info.background];
    }

    return Array.from(new Set(palette));
  }, [colors]);

  useEffect(() => {
    dispatch({ type: "SET_LAYOUT", payload: ensureMinimumCanvasSize(initialLayout) });
    setSelectedIds([]);
    setSelectedId(null);
  }, [initialLayout, setSelectedId]);

  useEffect(() => {
    setSelectedIds((currentIds) =>
      currentIds.filter((id) => state.layout.elements.some((element) => element.id === id)),
    );
  }, [state.layout.elements]);

  const removeSelectedElements = useCallback(() => {
    if (selectedIds.length === 0) {
      return;
    }

    selectedIds.forEach((id) => {
      dispatch({ type: "REMOVE_ELEMENT", payload: { id } });
    });

    setSelectedIds([]);
    setSelectedId(null);
  }, [selectedIds, setSelectedId]);

  useFloorEditorKeyboard({
    layout: state.layout,
    selectedIds,
    clipboardElements,
    setClipboardElements,
    setSelectedIds,
    setSelectedId,
    setIsMultiSelectModifierPressed,
    removeSelectedElements,
    dispatch,
  });

  const handleElementPointerDown = useCallback(
    (
      id: string,
      e: ReactPointerEvent,
      mode: DragResizeMode,
      bounds: { x: number; y: number; w: number; h: number; rotation?: number },
    ) => {
      if (isMultiSelectModifierPressed && mode !== "move") {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && mode === "move") {
        setSelectedIds((currentIds) => {
          const exists = currentIds.includes(id);
          const nextIds = exists ? currentIds.filter((currentId) => currentId !== id) : [...currentIds, id];

          setSelectedId(nextIds[0] ?? null);

          return nextIds;
        });

        return;
      }

      if (!selectedIds.includes(id)) {
        setSelectedIds([id]);
      }

      setActiveDragMode(mode);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragResize.handlePointerDown(id, e, mode, bounds);
    },
    [dragResize, isMultiSelectModifierPressed, selectedIds, setSelectedId],
  );

  useEffect(() => {
    const onPointerMove = (e: PointerEvent): void => {
      dragResize.handlePointerMove(e as unknown as React.PointerEvent);
    };
    const onPointerUp = (): void => {
      if (hasPendingHistoryCommitRef.current) {
        dispatch({ type: "COMMIT_LAYOUT" });
        hasPendingHistoryCommitRef.current = false;
      }

      setActiveDragMode(null);
      dragResize.handlePointerUp();
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointerleave", onPointerUp);

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointerleave", onPointerUp);
    };
  }, [dragResize]);

  const addElement = useCallback(
    (toAdd: ElementToAdd) => {
      const el = createElementFromToAdd(toAdd, state.layout.tenantId);
      const x = 80 + (state.layout.elements.length % 5) * 100;
      const y = 80 + Math.floor(state.layout.elements.length / 5) * 100;

      dispatch({ type: "ADD_ELEMENT", payload: { element: el, x, y } });
    },
    [state.layout.tenantId, state.layout.elements.length],
  );

  const handleAddTable = useCallback(() => {
    const nextNumber = state.layout.elements.reduce((max, element) => {
      if (element.type !== "table") {
        return max;
      }

      return Math.max(max, typeof element.tableNumber === "number" ? element.tableNumber : 0);
    }, 0);

    addElement({ type: "table", seats: 4, tableNumber: nextNumber + 1 });
  }, [addElement, state.layout.elements]);

  const handleAddZone = useCallback(() => {
    setAddZoneCount((c) => c + 1);
    const paletteColor = zoneColors[(addZoneCount + zoneColors.length) % zoneColors.length] ?? zoneColors[0];

    addElement({
      type: "zone",
      name: t("floorEditor.zoneName", { number: addZoneCount + 1 }),
      color: paletteColor,
    });
  }, [addElement, addZoneCount, t, zoneColors]);

  const selectedElements = state.layout.elements.filter((el) => selectedIds.includes(el.id));
  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;
  const isDirty = useMemo(
    () => JSON.stringify(state.layout) !== JSON.stringify(normalizedInitialLayout),
    [normalizedInitialLayout, state.layout],
  );

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;
  const toolbar = useMemo(
    () => (
      <FloorEditorToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        layout={state.layout}
        onSave={onSave}
        showSave={!isDesktopUp}
        dispatch={dispatch}
        isAddOpen={isAddOpen}
        setIsAddOpen={setIsAddOpen}
        onAddTable={handleAddTable}
        onAddZone={handleAddZone}
        onAddElement={addElement}
        showCanvasGrid={showCanvasGrid}
        onShowCanvasGridChange={setShowCanvasGrid}
        direction="row"
        className=""
      />
    ),
    [
      addElement,
      canRedo,
      canUndo,
      dispatch,
      handleAddTable,
      handleAddZone,
      isAddOpen,
      isDesktopUp,
      onSave,
      showCanvasGrid,
      state.layout,
    ],
  );

  const headerSaveAction = useMemo(() => {
    if (!isDesktopUp || !onSave) {
      return null;
    }

    return <Button onClick={() => void onSave(state.layout)}>{t("floorEditor.toolbar.save")}</Button>;
  }, [isDesktopUp, onSave, state.layout, t]);

  useEffect(() => {
    if (isDesktopUp) {
      onHeaderActionsChange?.(headerSaveAction);
    } else {
      onHeaderActionsChange?.(null);
    }

    return () => {
      onHeaderActionsChange?.(null);
    };
  }, [headerSaveAction, isDesktopUp, onHeaderActionsChange]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    writeFloorEditorShowGrid(showCanvasGrid);
  }, [showCanvasGrid]);

  return (
    <div className="box-border flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4">
      <div className="relative z-10 overflow-visible rounded-lg border border-border-default bg-surface-primary px-6 py-4">
        <div
          className={
            extraControls
              ? "flex min-w-0 flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-between"
              : "flex min-w-0 flex-nowrap items-center gap-3 justify-end"
          }
        >
          {extraControls ? (
            <div className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {extraControls}
            </div>
          ) : null}
          <div className="flex min-w-0 shrink-0 justify-end">{toolbar}</div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-visible rounded-lg border border-border-default">
        <div className="relative z-30 flex h-[150px] w-full min-h-0 shrink-0 flex-col overflow-visible rounded-t-lg border-b border-border-default bg-surface-primary">
          <FloorEditorInspector
            layout={state.layout}
            selectedElement={selectedElement}
            selectedIds={selectedIds}
            zoneColors={zoneColors}
            isMultiSelectModifierPressed={isMultiSelectModifierPressed}
            dispatch={dispatch}
            onRemoveSelected={removeSelectedElements}
            className="flex h-full min-h-0 w-full flex-col gap-3 overflow-visible rounded-none border-0 p-6"
          />
        </div>
        <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-b-lg bg-background-secondary">
          <FloorEditorCanvas
            className="min-h-0 flex-1 rounded-none border-0 bg-transparent"
            showGrid={showCanvasGrid}
            layout={state.layout}
            selectedIds={selectedIds}
            selectedElements={selectedElements}
            selectedElement={selectedElement}
            onElementPointerDown={handleElementPointerDown}
            onClearSelection={() => {
              setSelectedIds([]);
              setSelectedId(null);
            }}
          />
        </div>
      </div>
    </div>
  );
};
