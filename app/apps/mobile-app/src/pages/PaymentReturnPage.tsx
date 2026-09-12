import type { PublicP24TransactionSyncData } from "@restorio/types";
import { Button, Loader, Text, useI18n } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useSearchParams } from "react-router-dom";

import { publicApi } from "../api/client";

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const r = error as { response?: { data?: { detail?: unknown } } };
    const d = r.response?.data?.detail;

    if (typeof d === "string") {
      return d;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const TX_STATUS_UNPAID = 0;
const TX_STATUS_PAID = 1;
const TX_STATUS_ACCEPTED = 2;
const TX_STATUS_REFUNDED = 3;

const isPaymentSettled = (status: number): boolean =>
  status === TX_STATUS_PAID || status === TX_STATUS_ACCEPTED;

const paymentStatusPresentation = (
  status: number,
  t: (key: string) => string,
): { title: string; description: string; tone: "success" | "warning" | "error" } => {
  if (isPaymentSettled(status)) {
    return {
      title: t("paymentReturn.status.success.title"),
      description: t("paymentReturn.status.success.description"),
      tone: "success",
    };
  }
  if (status === TX_STATUS_REFUNDED) {
    return {
      title: t("paymentReturn.status.refunded.title"),
      description: t("paymentReturn.status.refunded.description"),
      tone: "error",
    };
  }
  if (status === TX_STATUS_UNPAID) {
    return {
      title: t("paymentReturn.status.pending.title"),
      description: t("paymentReturn.status.pending.description"),
      tone: "warning",
    };
  }
  return {
    title: t("paymentReturn.status.unfinished.title"),
    description: t("paymentReturn.status.unfinished.description"),
    tone: "warning",
  };
};

export const PaymentReturnPage = (): ReactElement => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId")?.trim() ?? "";
  const sessionIdValid = sessionId.length > 0 && UUID_RE.test(sessionId);

  const { data, isError, error, refetch, isFetching, isPending } = useQuery<PublicP24TransactionSyncData, Error>({
    queryKey: ["public-p24-sync", sessionId],
    queryFn: ({ signal }) =>
      (publicApi.syncPaymentSession as (id: string, signal?: AbortSignal) => Promise<PublicP24TransactionSyncData>)(
        sessionId,
        signal,
      ),
    enabled: sessionIdValid,
    retry: 2,
  });

  const presentation = data ? paymentStatusPresentation(data.status, t) : null;

  const iconCircleClass =
    presentation?.tone === "success"
      ? "bg-status-success-bg"
      : presentation?.tone === "error"
        ? "bg-status-error-bg"
        : "bg-status-warning-bg";

  const iconStrokeClass =
    presentation?.tone === "success"
      ? "text-status-success-text"
      : presentation?.tone === "error"
        ? "text-status-error-text"
        : "text-status-warning-text";

  if (!sessionIdValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary p-6">
        <div className="max-w-sm text-center">
          <Text as="h1" variant="h3" weight="bold" className="mb-2">
            {t("paymentReturn.noPaymentDataTitle")}
          </Text>
          <Text as="p" variant="body-md" className="text-text-secondary">
            {t("paymentReturn.noPaymentSession")}
          </Text>
        </div>
      </div>
    );
  }

  if (isPending || (isFetching && !data)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background-primary p-6">
        <Loader size="lg" />
        <Text as="p" variant="body-md" className="text-center text-text-secondary">
          {t("paymentReturn.checkingStatus")}
        </Text>
      </div>
    );
  }

  if (isError || !presentation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary p-6">
        <div className="max-w-sm text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconCircleClass}`}>
            <svg
              className={`h-8 w-8 ${iconStrokeClass}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <Text as="h1" variant="h3" weight="bold" className="mb-2">
            {t("paymentReturn.errorTitle")}
          </Text>
          <Text as="p" variant="body-md" className="text-text-secondary mb-6">
            {extractApiErrorMessage(error, t("paymentReturn.checkStatusErrorFallback"))}
          </Text>
          <Button variant="primary" onClick={() => void refetch()}>
            {t("common.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary p-6">
      <div className="max-w-sm text-center">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconCircleClass}`}>
          {presentation.tone === "success" ? (
            <svg
              className={`h-8 w-8 ${iconStrokeClass}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : presentation.tone === "error" ? (
            <svg
              className={`h-8 w-8 ${iconStrokeClass}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className={`h-8 w-8 ${iconStrokeClass}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
        </div>
        <Text as="h1" variant="h3" weight="bold" className="mb-2">
          {presentation.title}
        </Text>
        <Text as="p" variant="body-md" className="mb-6 text-text-secondary">
          {presentation.description}
        </Text>
        {!isPaymentSettled(data.status) ? (
          <>
            <Button variant="primary" fullWidth disabled={isFetching} className="mb-4" onClick={() => void refetch()}>
              {isFetching ? t("common.loading") : t("common.checkAgain")}
            </Button>
            <Text as="p" variant="body-sm" className="text-text-tertiary">
              {t("paymentReturn.statusChangeHint")}
            </Text>
          </>
        ) : (
          <Text as="p" variant="body-sm" className="text-text-tertiary">
            {t("paymentReturn.closeHint")}
          </Text>
        )}
      </div>
    </div>
  );
};
