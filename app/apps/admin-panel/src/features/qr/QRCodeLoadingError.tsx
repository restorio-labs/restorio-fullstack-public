import { Loader, useI18n } from "@restorio/ui";
import type { ReactElement } from "react";

interface QRCodeLoadingErrorProps {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onGoBack: () => void;
}

export const QRCodeLoadingError = ({
  isLoading,
  isError,
  errorMessage,
  onGoBack,
}: QRCodeLoadingErrorProps): ReactElement | null => {
  const { t } = useI18n();
  const resolvedErrorMessage = errorMessage ?? t("qrLoadingError.default");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <Loader />
        <div className="text-sm text-text-tertiary">{t("common.loading")}</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-sm text-text-tertiary">
          <p className="mb-4">{resolvedErrorMessage}</p>
          <button type="button" onClick={onGoBack} className="text-interactive-primary hover:underline">
            {t("qrLoadingError.goBack")}
          </button>
        </div>
      </div>
    );
  }

  return null;
};
