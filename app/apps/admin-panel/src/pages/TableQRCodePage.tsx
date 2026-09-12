import { useI18n } from "@restorio/ui";
import type { ReactElement } from "react";
import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { useCurrentTenant } from "../context/TenantContext";
import { useQRCodeDataUrl } from "../features/qr/hooks/useQRCodeDataUrl";
import { useSelectedTenantDetails } from "../features/qr/hooks/useSelectedTenantDetails";
import { QRCodeDisplay } from "../features/qr/QRCodeDisplay";
import { QRCodeLoadingError } from "../features/qr/QRCodeLoadingError";
import { getTableQrUrl } from "../features/qr/tableQRCodes";

export const TableQRCodePage = (): ReactElement => {
  const { t } = useI18n();
  const { tableId } = useParams<{ tableId: string }>();
  const [searchParams] = useSearchParams();
  const { tenantsState } = useCurrentTenant();
  const navigate = useNavigate();

  const tableNumber = tableId ? parseInt(tableId, 10) : null;
  const resolvedTableNumber = tableNumber ?? 0;
  const tableRefParam = searchParams.get("ref")?.trim() ?? undefined;

  const { tenant, isLoading } = useSelectedTenantDetails();
  const qrUrl = useMemo(() => {
    if (!tenant || !tableNumber) {
      return null;
    }

    return getTableQrUrl(tenant.slug, tableNumber, tableRefParam);
  }, [tableNumber, tableRefParam, tenant]);
  const qrDataUrl = useQRCodeDataUrl(qrUrl, {
    width: 1024,
    margin: 2,
    errorMessage: tableNumber ? t("tableQr.generateError", { table: resolvedTableNumber }) : undefined,
  });

  const handlePrint = (): void => {
    window.print();
  };

  const handleGoBack = (): void => {
    navigate("/qr-code-generator");
  };

  const showLoadingError = isLoading || tenantsState === "error" || !tenant || !tableNumber;

  if (showLoadingError) {
    return (
      <QRCodeLoadingError
        isLoading={isLoading}
        isError={tenantsState === "error" || !tenant || !tableNumber}
        errorMessage={t("tableQr.loadError")}
        onGoBack={handleGoBack}
      />
    );
  }

  return (
    <QRCodeDisplay
      title={t("tableQr.title", { table: resolvedTableNumber })}
      qrDataUrl={qrDataUrl}
      subtitle={tenant.name}
      onPrint={handlePrint}
      onGoBack={handleGoBack}
      isPrintDisabled={!qrDataUrl}
    />
  );
};
