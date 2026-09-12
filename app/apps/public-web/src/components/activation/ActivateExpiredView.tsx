import { Button, Text } from "@restorio/ui";
import type { ReactElement } from "react";

import { useTranslations } from "@/i18n/useT";

interface ActivateExpiredViewProps {
  errorMessage: string;
  resendLoading: boolean;
  resendOnCooldown: boolean;
  cooldownSeconds: number;
  onResend: () => void;
}

export const ActivateExpiredView = ({
  errorMessage,
  resendLoading,
  resendOnCooldown,
  cooldownSeconds,
  onResend,
}: ActivateExpiredViewProps): ReactElement => {
  const t = useTranslations("activate");

  const buttonLabel =
    resendLoading && !resendOnCooldown
      ? t("buttons.resendLoading")
      : resendOnCooldown
        ? t("buttons.resendWithCooldown", { seconds: cooldownSeconds })
        : t("buttons.resend");

  return (
    <>
      <Text variant="h2" weight="bold" className="mb-4">
        {t("expired.title")}
      </Text>
      <Text variant="body-lg" className="mb-6 text-text-secondary">
        {errorMessage || t("expired.genericMessage")}
      </Text>
      <Button variant="primary" onClick={onResend} disabled={resendLoading || resendOnCooldown}>
        {buttonLabel}
      </Button>
    </>
  );
};
