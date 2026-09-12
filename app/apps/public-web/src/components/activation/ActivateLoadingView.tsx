import { Text, Loader } from "@restorio/ui";
import type { ReactElement } from "react";

import { useTranslations } from "@/i18n/useT";

export const ActivateLoadingView = (): ReactElement => {
  const t = useTranslations("activate");

  return (
    <>
      <Text variant="h2" weight="bold" className="mb-4">
        {t("loading.title")}
      </Text>
      <Text variant="body-lg" className="mb-6 text-text-secondary">
        {t("loading.subtitle")}
      </Text>
      <div className="flex justify-center mt-8">
        <Loader size="lg" />
      </div>
    </>
  );
};
