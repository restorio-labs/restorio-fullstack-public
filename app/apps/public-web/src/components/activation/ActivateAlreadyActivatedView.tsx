import { Loader, Text } from "@restorio/ui";
import type { ReactElement } from "react";
import { useEffect } from "react";

import { useTranslations } from "@/i18n/useT";

interface ActivateAlreadyActivatedViewProps {
  onRedirect: () => void;
}

export const ActivateAlreadyActivatedView = ({ onRedirect }: ActivateAlreadyActivatedViewProps): ReactElement => {
  const t = useTranslations("activate");

  useEffect(() => {
    const timer = setTimeout(() => {
      onRedirect();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onRedirect]);

  return (
    <>
      <Text variant="h2" weight="bold" className="mb-4 text-center">
        {t("alreadyActivated.title")}
      </Text>
      <div className="mt-8 flex justify-center">
        <Loader size="lg" />
      </div>
      <Text variant="body-sm" className="mt-4 text-text-tertiary">
        {t("success.redirecting")}
      </Text>
    </>
  );
};
