import type { ElementToAdd, FloorCanvas as FloorCanvasType } from "@restorio/types";
import { Button, Checkbox, Dropdown, useI18n } from "@restorio/ui";
import type { Dispatch, ReactElement } from "react";

import type { FloorEditorHistoryAction } from "../floorLayoutState";

interface FloorEditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  layout: FloorCanvasType;
  onSave?: (layout: FloorCanvasType) => void | Promise<void>;
  showSave?: boolean;
  dispatch: Dispatch<FloorEditorHistoryAction>;
  isAddOpen: boolean;
  setIsAddOpen: (open: boolean) => void;
  onAddTable: () => void;
  onAddZone: () => void;
  onAddElement: (toAdd: ElementToAdd) => void;
  showCanvasGrid?: boolean;
  onShowCanvasGridChange?: (show: boolean) => void;
  className?: string;
  direction?: "row" | "column";
}

export const FloorEditorToolbar = ({
  canUndo,
  canRedo,
  layout,
  onSave,
  showSave = true,
  dispatch,
  isAddOpen,
  setIsAddOpen,
  onAddTable,
  onAddZone,
  onAddElement,
  showCanvasGrid,
  onShowCanvasGridChange,
  className,
  direction = "column",
}: FloorEditorToolbarProps): ReactElement => {
  const { t } = useI18n();
  const isRow = direction === "row";
  const gridToggleId = "floor-editor-show-grid";
  const gridToggle =
    typeof showCanvasGrid === "boolean" && typeof onShowCanvasGridChange === "function" ? (
      <Checkbox
        id={gridToggleId}
        label={t("floorEditor.toolbar.showGrid")}
        checked={showCanvasGrid}
        onChange={(e) => onShowCanvasGridChange(e.target.checked)}
        containerClassName="w-fit shrink-0"
        labelClassName="font-normal text-text-secondary select-none"
        className="shrink-0 cursor-pointer"
      />
    ) : null;
  const addMenuItemClassName =
    "w-full rounded-none px-4 py-2.5 pr-4 text-left text-sm text-text-primary hover:bg-surface-secondary first:rounded-t-md first:last:rounded-md last:rounded-b-md";
  const addDropdown = (
    <Dropdown
      trigger={
        <Button variant="primary" size="sm" className={isRow ? "" : "w-full"}>
          {t("floorEditor.toolbar.add")}
        </Button>
      }
      placement="bottom-end"
      portal
      isOpen={isAddOpen}
      onOpenChange={setIsAddOpen}
      className="p-0"
    >
      <div className="flex flex-col gap-px">
        <button
          type="button"
          className={addMenuItemClassName}
          onClick={() => {
            onAddTable();
            setIsAddOpen(false);
          }}
        >
          {t("floorEditor.addMenu.table")}
        </button>
        <button
          type="button"
          className={addMenuItemClassName}
          onClick={() => {
            onAddZone();
            setIsAddOpen(false);
          }}
        >
          {t("floorEditor.addMenu.zone")}
        </button>
        <button
          type="button"
          className={addMenuItemClassName}
          onClick={() => {
            onAddElement({ type: "bar" });
            setIsAddOpen(false);
          }}
        >
          {t("floorEditor.addMenu.bar")}
        </button>
        <button
          type="button"
          className={addMenuItemClassName}
          onClick={() => {
            onAddElement({ type: "wall" });
            setIsAddOpen(false);
          }}
        >
          {t("floorEditor.addMenu.wall")}
        </button>
        <button
          type="button"
          className={addMenuItemClassName}
          onClick={() => {
            onAddElement({ type: "entrance" });
            setIsAddOpen(false);
          }}
        >
          {t("floorEditor.addMenu.entrance")}
        </button>
      </div>
    </Dropdown>
  );

  return (
    <div className={className}>
      <div className={["flex gap-2", isRow ? "flex-row flex-nowrap items-center justify-end" : "flex-col"].join(" ")}>
        <div
          className={
            isRow
              ? "flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "flex w-full flex-col gap-2"
          }
        >
          {gridToggle}
          {isRow ? <div className="shrink-0">{addDropdown}</div> : null}
          <Button
            variant="secondary"
            size="sm"
            className={isRow ? "shrink-0" : "w-full"}
            disabled={!canUndo}
            onClick={() => dispatch({ type: "UNDO" })}
            aria-label={t("floorEditor.toolbar.undo")}
          >
            {t("floorEditor.toolbar.undo")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className={isRow ? "shrink-0" : "w-full"}
            disabled={!canRedo}
            onClick={() => dispatch({ type: "REDO" })}
            aria-label={t("floorEditor.toolbar.redo")}
          >
            {t("floorEditor.toolbar.redo")}
          </Button>
          {onSave && showSave && (
            <Button className={isRow ? "shrink-0" : "w-full"} onClick={() => void onSave(layout)}>
              {t("floorEditor.toolbar.save")}
            </Button>
          )}
        </div>
      </div>
      {!isRow ? addDropdown : null}
    </div>
  );
};
