import { Loader, useI18n } from "@restorio/ui";
import type { ReactElement } from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useCurrentTenant } from "../context/TenantContext";
import { useSelectedTenantDetails } from "../features/qr/hooks/useSelectedTenantDetails";
import { useTableQRCodes } from "../features/qr/hooks/useTableQRCodes";
import { getTenantTableEntries, getTenantTablesByFloor } from "../features/qr/tableQRCodes";

export const QRCodePrintPage = (): ReactElement => {
  const { t } = useI18n();
  const { tenantsState } = useCurrentTenant();
  const { tenant, isLoading } = useSelectedTenantDetails();

  const floorGroups = useMemo(() => {
    if (!tenant) {
      return [];
    }

    return getTenantTablesByFloor(tenant);
  }, [tenant]);

  const tables = useMemo(() => {
    if (!tenant) {
      return [];
    }

    return getTenantTableEntries(tenant);
  }, [tenant]);

  const { tableQRCodes, isGenerating } = useTableQRCodes(tenant, tables, {
    width: 512,
    margin: 2,
  });

  const handlePrint = (): void => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 flex-col gap-4">
        <Loader />
        <div className="text-sm text-text-tertiary">{t("qrPrint.loadingRestaurant")}</div>
      </div>
    );
  }

  if (tenantsState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center text-sm text-text-tertiary">
        {t("qrPrint.loadError")}
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-6 text-sm text-text-tertiary">
        {t("qrPrint.noRestaurant")}{" "}
        <Link to="/qr-code-generator" className="text-interactive-primary hover:underline">
          {t("qrPrint.backToGenerator")}
        </Link>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-text-tertiary ">
        <p className="mb-2 text-center text-text-tertiary">{t("qrPrint.noTablesTitle")}</p>
        <Link to="/floor-editor" className="text-interactive-primary hover:underline">
          {t("qrPrint.noTablesAction")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/qr-code-generator"
          className="rounded-md border border-border-default bg-surface-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          {t("qrPrint.goBack")}
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          disabled={isGenerating}
          className="rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-primary-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:opacity-50"
        >
          {isGenerating ? t("qrPrint.generating") : t("qrPrint.print")}
        </button>
      </div>

      {isGenerating && (
        <div className="print:hidden text-center text-sm text-text-tertiary">
          {t("qrPrint.generatingTables", { count: tables.length })}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {floorGroups.map((floorGroup) => {
          const floorQRCodes = tableQRCodes.filter((qrCode) => qrCode.canvasId === floorGroup.canvasId);

          if (floorQRCodes.length === 0) {
            return null;
          }

          return (
            <section key={floorGroup.canvasId} className="flex flex-col gap-4 print:break-inside-avoid">
              <h2 className="text-xl font-semibold text-text-primary print:text-3xl">{floorGroup.floorName}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-3">
                {floorQRCodes.map((qrCode) => (
                  <div
                    key={`${qrCode.canvasId}-${qrCode.elementId}`}
                    className="flex flex-col items-center p-2 print:break-inside-avoid"
                  >
                    {qrCode.qrDataUrl ? (
                      <img
                        src={qrCode.qrDataUrl}
                        alt={t("qrRow.qrAltTable", { table: qrCode.tableId })}
                        className="h-auto w-full max-w-[360px]"
                      />
                    ) : (
                      <div className="flex h-[360px] w-full max-w-[360px] items-center justify-center text-sm text-text-tertiary">
                        {t("qrRow.failed")}
                      </div>
                    )}
                    <h3 className="mt-4 text-lg font-semibold text-text-primary print:text-2xl">
                      {t("qrRow.table", { table: qrCode.tableId })}
                    </h3>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
