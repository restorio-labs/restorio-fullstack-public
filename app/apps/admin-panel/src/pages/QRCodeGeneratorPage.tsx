import { Loader, useI18n } from "@restorio/ui";
import { getAppHref } from "@restorio/utils";
import type { ReactElement } from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { useCurrentTenant } from "../context/TenantContext";
import { useQRCodeDataUrl } from "../features/qr/hooks/useQRCodeDataUrl";
import { useSelectedTenantDetails } from "../features/qr/hooks/useSelectedTenantDetails";
import { useTableQRCodes } from "../features/qr/hooks/useTableQRCodes";
import { QRCodeRow } from "../features/qr/QRCodeRow";
import { getTenantTableEntries, getTenantTablesByFloor } from "../features/qr/tableQRCodes";
import { PageLayout } from "../layouts/PageLayout";

export const QRCodeGeneratorPage = (): ReactElement => {
  const { t } = useI18n();
  const { selectedTenant, selectedTenantId, tenantsState } = useCurrentTenant();
  const { tenant, isLoading } = useSelectedTenantDetails();

  const menuUrl = useMemo(() => {
    if (!tenant) {
      return null;
    }

    return `${getAppHref("mobile-app")}/${tenant.slug}`;
  }, [tenant]);

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

  const menuQrDataUrl = useQRCodeDataUrl(menuUrl, {
    width: 640,
    margin: 2,
  });
  const { tableQRCodes, isGenerating: isGeneratingTableQRCodes } = useTableQRCodes(tenant, tables, {
    width: 512,
    margin: 2,
  });

  if (isLoading) {
    return (
      <PageLayout title={t("qrGenerator.title")} description={t("qrGenerator.description")}>
        <div className="flex flex-1 flex-col gap-4 items-center justify-center p-8">
          <Loader />
          <div className="text-sm text-text-tertiary">{t("qrGenerator.loadingRestaurant")}</div>
        </div>
      </PageLayout>
    );
  }

  if (tenantsState === "error") {
    return (
      <PageLayout title={t("qrGenerator.title")} description={t("qrGenerator.description")}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          {t("qrGenerator.loadError")}
        </div>
      </PageLayout>
    );
  }

  if (!selectedTenantId || !selectedTenant) {
    return (
      <PageLayout title={t("qrGenerator.title")} description={t("qrGenerator.description")}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          {t("qrGenerator.selectRestaurant")}
        </div>
      </PageLayout>
    );
  }

  if (!tenant || !menuUrl) {
    return (
      <PageLayout title={t("qrGenerator.title")} description={t("qrGenerator.description")}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-tertiary">
          {t("qrGenerator.loadTenantError")}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t("qrGenerator.pageTitle", { name: selectedTenant.name })}
      description={t("qrGenerator.description")}
    >
      <div className="flex flex-col gap-6 p-6">
        {tables.length > 3 && (
          <div className="print:hidden flex justify-end">
            <Link
              to="/qr-code/tables"
              className="inline-flex  rounded-md bg-interactive-primary px-4 py-2 text-sm font-medium text-primary-inverse hover:bg-interactive-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            >
              {t("qrGenerator.batchDownload")}
            </Link>
          </div>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-text-primary">{t("qrGenerator.sectionTitle")}</h2>
          {menuQrDataUrl ? (
            <QRCodeRow qrDataUrl={menuQrDataUrl} />
          ) : (
            <div className="text-sm text-text-tertiary">{t("qrGenerator.generatingMenu")}</div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          {tables.length === 0 ? (
            <p className="text-sm text-text-tertiary">{t("qrGenerator.noTables")}</p>
          ) : (
            <>
              {isGeneratingTableQRCodes && (
                <p className="print:hidden text-sm text-text-tertiary">
                  {t("qrGenerator.generatingTables", { count: tables.length })}
                </p>
              )}
              <div className="flex flex-col gap-6">
                {floorGroups.map((floorGroup) => {
                  const floorQRCodes = tableQRCodes.filter((qrCode) => qrCode.canvasId === floorGroup.canvasId);

                  return (
                    <section key={floorGroup.canvasId} className="flex flex-col gap-3">
                      <h3 className="text-lg font-semibold text-text-primary">{floorGroup.floorName}</h3>
                      {floorQRCodes.length === 0 ? (
                        <p className="text-sm text-text-tertiary">{t("qrGenerator.noTablesOnFloor")}</p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {floorQRCodes.map((qrCode) => (
                            <QRCodeRow
                              key={`${qrCode.canvasId}-${qrCode.elementId}`}
                              tableId={qrCode.tableId}
                              tableElementId={qrCode.elementId}
                              qrDataUrl={qrCode.qrDataUrl}
                              subtitle={qrCode.floorName}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </PageLayout>
  );
};
