import { useI18n } from "@restorio/ui";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";

interface QRCodeRowProps {
  tableId?: number;
  tableElementId?: string;
  qrDataUrl: string | null;
  subtitle?: string;
}

export const QRCodeRow = ({ tableId, tableElementId, qrDataUrl, subtitle }: QRCodeRowProps): ReactElement => {
  const { t } = useI18n();

  const tableDetailPath =
    tableId === undefined
      ? "/qr-code/restaurant"
      : tableElementId && tableElementId.trim() !== ""
        ? `/qr-code/table/${tableId}?ref=${encodeURIComponent(tableElementId.trim())}`
        : `/qr-code/table/${tableId}`;

  return (
    <Link
      to={tableDetailPath}
      className="flex items-center justify-between gap-4 rounded-lg border border-border-default bg-surface-primary p-4 transition-colors hover:bg-surface-secondary print:break-inside-avoid print:border-2 print:border-black"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-text-primary print:text-2xl">
          {tableId !== undefined ? t("qrRow.table", { table: tableId }) : t("qrRow.restaurant")}
        </h3>
        {subtitle ? <p className="text-sm text-text-secondary print:text-base">{subtitle}</p> : null}
      </div>
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt={tableId !== undefined ? t("qrRow.qrAltTable", { table: tableId }) : t("qrRow.qrAltRestaurant")}
          className="h-auto w-full max-w-[160px] print:max-w-[180px]"
        />
      ) : (
        <div className="flex h-40 w-40 items-center justify-center bg-surface-secondary text-sm text-text-tertiary">
          {t("qrRow.failed")}
        </div>
      )}
    </Link>
  );
};
