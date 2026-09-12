import type { FloorCanvas as FloorCanvasType, FloorElement } from "@restorio/types";
import { Button, cn, Dropdown, useI18n } from "@restorio/ui";
import type { Dispatch, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { TbTrash } from "react-icons/tb";

import { getMaxZIndex, getMinZIndex } from "../editorShared";
import type { FloorEditorHistoryAction } from "../floorLayoutState";

interface FloorEditorInspectorProps {
  layout: FloorCanvasType;
  selectedElement: FloorElement | null;
  selectedIds: string[];
  zoneColors: string[];
  isMultiSelectModifierPressed: boolean;
  dispatch: Dispatch<FloorEditorHistoryAction>;
  onRemoveSelected: () => void;
  className?: string;
}

export const FloorEditorInspector = ({
  layout,
  selectedElement,
  selectedIds,
  zoneColors,
  isMultiSelectModifierPressed,
  dispatch,
  onRemoveSelected,
  className,
}: FloorEditorInspectorProps): ReactElement => {
  const { t } = useI18n();
  const hasMultiSelection = selectedIds.length > 1;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentScale, setContentScale] = useState(1);
  const [isMoveOpen, setIsMoveOpen] = useState<boolean>(false);
  const minScale = 0.5;
  const moveMenuItemClassName =
    "w-full rounded-none px-3 py-2 pr-4 text-left text-sm text-text-primary hover:bg-surface-secondary first:rounded-t-md first:last:rounded-md last:rounded-b-md";

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content) {
      return;
    }

    const updateScale = (): void => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const sw = content.scrollWidth;
      const sh = content.scrollHeight;

      if (!cw || !ch || !sw || !sh) {
        setContentScale(1);

        return;
      }

      if (sh <= ch && sw <= cw) {
        setContentScale(1);

        return;
      }

      const nextScale = Math.max(minScale, Math.min(1, ch / sh, cw / sw));

      setContentScale(nextScale);
    };

    const frame = requestAnimationFrame(updateScale);
    const resizeObserver = new ResizeObserver(updateScale);

    resizeObserver.observe(container);
    resizeObserver.observe(content);
    window.addEventListener("resize", updateScale);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [selectedElement, selectedIds.length, isMultiSelectModifierPressed, minScale]);

  return (
    <aside
      className={cn(
        "flex w-64 min-h-0 flex-shrink-0 flex-col overflow-hidden rounded-r-lg border-l border border-border-default p-4",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
          {t("floorEditor.panel.title")}
        </h3>
        <div className="flex h-8 shrink-0 items-center justify-end">
          {selectedElement ? (
            <Button
              variant="danger"
              size="sm"
              className="shrink-0 px-2"
              aria-label={t("floorEditor.panel.delete")}
              onClick={onRemoveSelected}
            >
              <TbTrash className="size-5" aria-hidden />
            </Button>
          ) : hasMultiSelection ? (
            <Button
              variant="danger"
              size="sm"
              className="shrink-0 px-2"
              aria-label={t("floorEditor.panel.deleteSelected")}
              onClick={onRemoveSelected}
            >
              <TbTrash className="size-5" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
      <div ref={containerRef} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-visible">
        <div
          ref={contentRef}
          className="flex w-full min-h-fit flex-col gap-3"
          style={{ transform: `scale(${contentScale})`, transformOrigin: "top left", width: `${100 / contentScale}%` }}
        >
          {selectedElement ? (
            <>
              <div className="flex flex-wrap items-end gap-2">
                <Dropdown
                  trigger={
                    <Button variant="primary" size="sm">
                      {t("floorEditor.panel.move")}
                    </Button>
                  }
                  placement="top-start"
                  portal
                  isOpen={isMoveOpen}
                  onOpenChange={setIsMoveOpen}
                  className="p-0"
                >
                  <div className="flex flex-col gap-px">
                    <button
                      type="button"
                      className={moveMenuItemClassName}
                      onClick={() => {
                        const maxZIndex = getMaxZIndex(layout.elements);

                        dispatch({
                          type: "UPDATE_ELEMENT",
                          payload: { id: selectedElement.id, zIndex: maxZIndex + 1 },
                        });
                        setIsMoveOpen(false);
                      }}
                    >
                      {t("floorEditor.panel.bringToFront")}
                    </button>
                    <button
                      type="button"
                      className={moveMenuItemClassName}
                      onClick={() => {
                        const minZIndex = getMinZIndex(layout.elements);

                        dispatch({
                          type: "UPDATE_ELEMENT",
                          payload: { id: selectedElement.id, zIndex: minZIndex - 1 },
                        });
                        setIsMoveOpen(false);
                      }}
                    >
                      {t("floorEditor.panel.sendToBack")}
                    </button>
                    <button
                      type="button"
                      className={moveMenuItemClassName}
                      onClick={() => {
                        dispatch({
                          type: "UPDATE_ELEMENT",
                          payload: { id: selectedElement.id, zIndex: Number(selectedElement.zIndex ?? 0) + 1 },
                        });
                        setIsMoveOpen(false);
                      }}
                    >
                      {t("floorEditor.panel.forward")}
                    </button>
                    <button
                      type="button"
                      className={moveMenuItemClassName}
                      onClick={() => {
                        dispatch({
                          type: "UPDATE_ELEMENT",
                          payload: { id: selectedElement.id, zIndex: Number(selectedElement.zIndex ?? 0) - 1 },
                        });
                        setIsMoveOpen(false);
                      }}
                    >
                      {t("floorEditor.panel.backward")}
                    </button>
                  </div>
                </Dropdown>
                <div className="flex min-w-0 flex-1 flex-wrap items-end justify-start gap-2">
                  {selectedElement.type === "table" && (
                    <>
                      <label className="flex w-[4.5rem] shrink-0 flex-col gap-1 text-xs text-text-secondary">
                        <span>{t("floorEditor.panel.seats")}</span>
                        <input
                          type="number"
                          min={1}
                          value={selectedElement.seats}
                          onChange={(e) =>
                            dispatch({
                              type: "UPDATE_ELEMENT",
                              payload: { id: selectedElement.id, seats: Number(e.target.value) || 1 },
                            })
                          }
                          className="w-full rounded border border-border-default bg-background-primary px-2 py-1.5 text-sm text-text-primary"
                        />
                      </label>
                      <label className="flex min-w-[6rem] max-w-[11rem] flex-col gap-1 text-xs text-text-secondary">
                        <span className="truncate">{t("floorEditor.panel.tableCustomLabel")}</span>
                        <input
                          type="text"
                          value={selectedElement.label?.trim() ? selectedElement.label : ""}
                          placeholder={t("floorEditor.tableLabel", { number: selectedElement.tableNumber })}
                          onChange={(e) =>
                            dispatch({
                              type: "UPDATE_ELEMENT",
                              payload: { id: selectedElement.id, tableLabel: e.target.value },
                            })
                          }
                          className="w-full min-w-0 rounded border border-border-default bg-background-primary px-2 py-1.5 text-sm text-text-primary"
                        />
                      </label>
                    </>
                  )}
                  {selectedElement.type === "zone" && (
                    <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
                      <label className="flex min-w-[5rem] max-w-[10rem] flex-1 flex-col gap-1 text-xs text-text-secondary">
                        <span className="truncate">{t("floorEditor.panel.name")}</span>
                        <input
                          type="text"
                          value={selectedElement.name}
                          onChange={(e) =>
                            dispatch({
                              type: "UPDATE_ELEMENT",
                              payload: { id: selectedElement.id, name: e.target.value },
                            })
                          }
                          className="w-full min-w-0 rounded border border-border-default bg-background-primary px-2 py-1.5 text-sm text-text-primary"
                        />
                      </label>
                      <div className="flex shrink-0 flex-col gap-1">
                        <span className="text-xs text-text-secondary">{t("floorEditor.panel.color")}</span>
                        <div className="flex flex-wrap gap-1">
                          {zoneColors.map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() =>
                                dispatch({
                                  type: "UPDATE_ELEMENT",
                                  payload: { id: selectedElement.id, color: hex },
                                })
                              }
                              className="h-6 w-6 rounded border-2 border-border-default"
                              style={{ backgroundColor: hex }}
                              aria-label={t("floorEditor.aria.setColor", { color: hex })}
                              title={hex}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedElement.type === "bar" && (
                    <label className="flex min-w-[6rem] max-w-[14rem] flex-col gap-1 text-xs text-text-secondary">
                      <span className="truncate">{t("floorEditor.panel.label")}</span>
                      <input
                        type="text"
                        value={selectedElement.label ?? ""}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_ELEMENT",
                            payload: { id: selectedElement.id, label: e.target.value },
                          })
                        }
                        className="w-full min-w-0 rounded border border-border-default bg-background-primary px-2 py-1.5 text-sm text-text-primary"
                      />
                    </label>
                  )}
                  {selectedElement.type === "entrance" && (
                    <label className="flex min-w-[6rem] max-w-[14rem] flex-col gap-1 text-xs text-text-secondary">
                      <span className="truncate">{t("floorEditor.panel.label")}</span>
                      <input
                        type="text"
                        value={selectedElement.label ?? ""}
                        onChange={(e) =>
                          dispatch({
                            type: "UPDATE_ELEMENT",
                            payload: { id: selectedElement.id, label: e.target.value },
                          })
                        }
                        className="w-full min-w-0 rounded border border-border-default bg-background-primary px-2 py-1.5 text-sm text-text-primary"
                      />
                    </label>
                  )}
                </div>
              </div>
            </>
          ) : hasMultiSelection ? (
            <>
              <p className="text-sm text-text-tertiary">
                {t("floorEditor.panel.multiSelected", { count: selectedIds.length })}
              </p>
            </>
          ) : isMultiSelectModifierPressed ? (
            <p className="text-sm text-text-tertiary">{t("floorEditor.panel.multiSelectHint")}</p>
          ) : (
            <p className="text-sm text-text-tertiary">{t("floorEditor.panel.selectHint")}</p>
          )}
        </div>
      </div>
    </aside>
  );
};
