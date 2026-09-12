import { useI18n } from "@restorio/ui";
import { getAppHref } from "@restorio/utils";
import type { ReactElement } from "react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useCurrentTenant } from "../context/TenantContext";
import { useQRCodeDataUrl } from "../features/qr/hooks/useQRCodeDataUrl";
import { useSelectedTenantDetails } from "../features/qr/hooks/useSelectedTenantDetails";
import { QRCodeDisplay } from "../features/qr/QRCodeDisplay";
import { QRCodeLoadingError } from "../features/qr/QRCodeLoadingError";

export const RestaurantQRCodePage = (): ReactElement => {
  const { t } = useI18n();
  const { tenantsState } = useCurrentTenant();
  const navigate = useNavigate();
  const { tenant, isLoading } = useSelectedTenantDetails();
  const menuUrl = useMemo(() => {
    if (!tenant) {
      return null;
    }

    return `${getAppHref("mobile-app")}/${tenant.slug}`;
  }, [tenant]);
  const qrDataUrl = useQRCodeDataUrl(menuUrl, {
    width: 1024,
    margin: 2,
    errorMessage: t("restaurantQr.generateError"),
  });

  const handlePrint = (): void => {
    window.print();
  };

  const handleGoBack = (): void => {
    navigate("/qr-code-generator");
  };

  const showLoadingError = isLoading || tenantsState === "error" || !tenant;

  if (showLoadingError) {
    return (
      <QRCodeLoadingError
        isLoading={isLoading}
        isError={tenantsState === "error" || !tenant}
        errorMessage={t("restaurantQr.loadError")}
        onGoBack={handleGoBack}
      />
    );
  }

  return (
    <QRCodeDisplay
      title={tenant.name}
      qrDataUrl={qrDataUrl}
      subtitle={t("restaurantQr.subtitle")}
      onPrint={handlePrint}
      onGoBack={handleGoBack}
      isPrintDisabled={!qrDataUrl}
    />
  );
};
