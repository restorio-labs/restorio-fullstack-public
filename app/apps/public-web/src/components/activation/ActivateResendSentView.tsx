import { Text } from "@restorio/ui";
import type { ReactElement } from "react";

import { useTranslations } from "@/i18n/useT";

interface ActivateResendSentViewProps {
  resendLoading: boolean;
  resendOnCooldown: boolean;
  cooldownSeconds: number;
  onResend: () => void;
}

export const ActivateResendSentView = ({
  resendLoading,
  resendOnCooldown,
  cooldownSeconds,
  onResend,
}: ActivateResendSentViewProps): ReactElement => {
  const t = useTranslations("activate");

  const canResend = !resendOnCooldown && !resendLoading;
  const resendLabel = resendOnCooldown
    ? t("buttons.resendWithCooldown", { seconds: cooldownSeconds })
    : t("resendSent.resendAgain");

  return (
    <>
      <Text variant="h2" weight="bold" className="mb-4">
        {t("resendSent.title")}
      </Text>
      <Text variant="body-lg" className="text-text-secondary">
        {t("resendSent.description")}
      </Text>
      <div className="mt-6 text-sm text-text-secondary">
        <span className="mr-2">{t("resendSent.secondaryPrompt")}</span>
        <button
          type="button"
          className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onResend}
          disabled={!canResend}
        >
          {resendLabel}
        </button>
      </div>
    </>
  );
};
