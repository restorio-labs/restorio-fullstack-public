import type { CanvasBounds, OrderStatusDisplay, TableDisplayInfo, TableRuntimeState } from "@restorio/types";
import type { ReactElement } from "react";

import { useI18n } from "../../providers/I18nProvider";
import { cn } from "../../utils";
import { CanvasElement } from "../CanvasElement";

export interface FloorTableProps {
  bounds: CanvasBounds;
  tableNumber: number;
  seats: number;
  label?: string;
  state?: TableRuntimeState;
  displayInfo?: TableDisplayInfo;
  isSelected?: boolean;
  "aria-label"?: string;
  onPointerDown?: (e: React.PointerEvent) => void;
}

const stateStyles: Record<TableRuntimeState | "neutral", string> = {
  neutral: "bg-surface-primary border-border-default",
  free: "bg-surface-primary border-border-default",
  occupied: "bg-status-error-background border-status-error-border",
  reserved: "bg-status-warning-background border-status-warning-border",
  dirty: "bg-status-error-background/30 border-status-error-border",
};

const orderStatusStyles: Record<OrderStatusDisplay, string> = {
  browsing: "bg-surface-primary border-border-default",
  ordering: "bg-status-info-background border-status-info-border",
  ordered: "bg-status-warning-background border-status-warning-border",
  preparing: "bg-orange-500/20 border-orange-500/50",
  ready_to_serve: "bg-cyan-500/20 border-cyan-600/50",
  served: "bg-status-success-background border-status-success-border",
  bill_requested: "bg-purple-500/20 border-purple-500/50",
  rejected: "bg-status-error-background border-status-error-border",
};

export const FloorTable = ({
  bounds,
  tableNumber,
  seats,
  label: tableLabel,
  state,
  displayInfo,
  isSelected = false,
  "aria-label": ariaLabel,
  onPointerDown,
}: FloorTableProps): ReactElement => {
  const { t } = useI18n();
  const needHelp = displayInfo?.needHelp;
  const orderStatus = displayInfo?.orderStatus;
  const hasActiveOrder = orderStatus !== undefined && orderStatus !== "browsing";
  const isRejected = orderStatus === "rejected";
  const statusLine =
    hasActiveOrder && displayInfo !== undefined ? (displayInfo.orderStatusLabel ?? displayInfo.orderStatus) : undefined;
  const resolvedState: TableRuntimeState | "neutral" = hasActiveOrder ? "occupied" : (state ?? "neutral");
  const resolvedTableLabel = tableLabel?.trim() ?? t("floorEditor.tableLabel", { number: tableNumber });
  const tableStyle = hasActiveOrder ? orderStatusStyles[orderStatus] : stateStyles[resolvedState];
  const label =
    ariaLabel ??
    (resolvedState === "neutral"
      ? `${resolvedTableLabel}, ${seats} ${t("floorEditor.panel.seats")}`
      : `${resolvedTableLabel}, ${seats} ${t("floorEditor.panel.seats")}, ${resolvedState}`);

  return (
    <CanvasElement bounds={bounds} aria-label={label} role="img" onPointerDown={onPointerDown}>
      <div
        className={cn(
          "relative flex h-full w-full flex-col items-center justify-center rounded-lg border-2 text-text-primary",
          !isSelected &&
            "focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-border-focus",
          tableStyle,
          isSelected && "ring-2 ring-interactive-primary ring-offset-1",
          isRejected && "animate-pulse",
        )}
      >
        {needHelp && (
          <span
            className="absolute right-1 top-1 rounded-full bg-status-error-background px-1.5 py-0.5 text-xs md:px-2 md:py-1 md:text-sm font-medium text-status-error-text"
            aria-label="Customer needs help"
            title="Needs help"
          >
            Help
          </span>
        )}
        <span className="text-xs md:text-sm lg:text-base font-medium" aria-hidden="true">
          {resolvedTableLabel}
        </span>
        <span
          className="flex items-center gap-0.5 font-semibold tabular-nums text-[10px] md:text-xs lg:text-sm text-text-secondary"
          aria-hidden="true"
        >
          <svg
            className="size-2.5 md:size-3 lg:size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {seats}
        </span>
        {statusLine !== undefined && (
          <span className="text-xs font-medium text-text-primary text-center" aria-hidden="true">
            {statusLine}
          </span>
        )}
        {displayInfo?.occupationTimeLabel !== undefined && displayInfo.occupationTimeLabel !== "" && (
          <span className="text-[10px] font-medium tabular-nums text-text-tertiary md:text-xs" aria-hidden="true">
            {displayInfo.occupationTimeLabel}
          </span>
        )}
      </div>
    </CanvasElement>
  );
};
