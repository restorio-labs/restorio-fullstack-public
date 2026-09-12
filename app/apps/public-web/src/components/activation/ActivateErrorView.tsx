import { Text, Button } from "@restorio/ui";
import type { ReactElement } from "react";

import { useTranslations } from "@/i18n/useT";

interface ActivateErrorViewProps {
  errorMessage: string;
  canResend: boolean;
  resendLoading: boolean;
  resendOnCooldown: boolean;
  cooldownSeconds: number;
  onResend: () => void;
}

export const ActivateErrorView = ({
  canResend,
  resendLoading,
  resendOnCooldown,
  cooldownSeconds,
  errorMessage,
  onResend,
}: ActivateErrorViewProps): ReactElement => {
  const t = useTranslations("activate");

  const buttonDisabled = resendLoading || resendOnCooldown || !canResend;
  const buttonLabel =
    resendOnCooldown && canResend ? t("buttons.resendWithCooldown", { seconds: cooldownSeconds }) : t("buttons.resend");

  return (
    <>
      <Text variant="h2" weight="bold" className="mb-4">
        {t("error.title")}
      </Text>
      <Text variant="body-lg" className="mb-6 text-text-secondary">
        {errorMessage || t("error.genericMessage")}
      </Text>
      {canResend && (
        <Button variant="primary" onClick={onResend} disabled={buttonDisabled}>
          {buttonLabel}
        </Button>
      )}
    </>
  );
};
