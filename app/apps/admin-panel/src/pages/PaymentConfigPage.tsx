import { Button, Form, FormActions, Input, PasswordInput, useI18n } from "@restorio/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { useValidationErrors } from "../hooks/useValidationErrors";
import { PageLayout } from "../layouts/PageLayout";

interface PaymentFormValues {
  merchantId: string;
  apiKey: string;
  crcKey: string;
}

export const PaymentConfigPage = (): ReactElement => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { selectedTenantId, tenantsState } = useCurrentTenant();
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error" | "validation">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { getFieldError, setFromResponse, clearErrors } = useValidationErrors();

  const trimmedTenantId = selectedTenantId?.trim() ?? "";
  const appliedP24FingerprintRef = useRef<string>("");
  const tenantResetWaveRef = useRef<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { isValid },
    reset,
  } = useForm<PaymentFormValues>({
    defaultValues: { merchantId: "", apiKey: "", crcKey: "" },
    mode: "onChange",
  });

  const { data: p24Config } = useQuery({
    queryKey: ["p24-config", trimmedTenantId],
    queryFn: ({ signal }) => api.payments.getP24Config(trimmedTenantId, signal),
    enabled: trimmedTenantId !== "",
    staleTime: Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    if (tenantsState === "error") {
      setErrorMessage(t("payment.errors.loadRestaurants"));
    }
  }, [t, tenantsState]);

  useEffect(() => {
    if (tenantResetWaveRef.current === trimmedTenantId) {
      return;
    }

    tenantResetWaveRef.current = trimmedTenantId;
    setSubmitStatus("idle");
    clearErrors();
    appliedP24FingerprintRef.current = "";
    reset({ merchantId: "", apiKey: "", crcKey: "" });
  }, [clearErrors, reset, trimmedTenantId]);

  useEffect(() => {
    if (trimmedTenantId === "" || p24Config === undefined) {
      return;
    }

    const fingerprint = `${trimmedTenantId}:${String(p24Config.p24Merchantid ?? "")}:${p24Config.p24Api ?? ""}:${p24Config.p24Crc ?? ""}`;

    if (appliedP24FingerprintRef.current === fingerprint) {
      return;
    }

    appliedP24FingerprintRef.current = fingerprint;

    reset({
      merchantId: p24Config.p24Merchantid != null ? String(p24Config.p24Merchantid) : "",
      apiKey: p24Config.p24Api ?? "",
      crcKey: p24Config.p24Crc ?? "",
    });
  }, [reset, trimmedTenantId, p24Config]);

  const submitMutation = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      if (!selectedTenantId) {
        throw new Error(t("payment.errors.selectRestaurant"));
      }

      return api.payments.updateP24Config(selectedTenantId.trim(), {
        p24_merchantid: Number(values.merchantId),
        p24_api: values.apiKey.trim(),
        p24_crc: values.crcKey.trim(),
      });
    },
    onSuccess: () => {
      setSubmitStatus("success");
      setErrorMessage("");
      void queryClient.invalidateQueries({ queryKey: ["p24-config", trimmedTenantId] });
    },
    onError: (err: unknown) => {
      const isValidation = setFromResponse(err, "payment.fields");

      if (isValidation) {
        setSubmitStatus("validation");
        setErrorMessage(t("payment.errors.validationFailed"));
      } else {
        setSubmitStatus("error");
        setErrorMessage(
          err instanceof Error && err.message.trim() !== "" ? err.message : t("payment.errors.updateFailed"),
        );
      }
    },
  });

  const onSubmit = (values: PaymentFormValues): void => {
    setSubmitStatus("idle");
    clearErrors();
    submitMutation.mutate(values);
  };

  const isFormDisabled = !selectedTenantId || !isValid || submitMutation.isPending;

  return (
    <PageLayout
      title={t("payment.title")}
      description={t("payment.description")}
      headerActions={
        <FormActions>
          <Button type="submit" form="payment-config-form" disabled={isFormDisabled}>
            {submitMutation.isPending ? t("payment.actions.saving") : t("payment.actions.save")}
          </Button>
        </FormActions>
      }
    >
      <div className="mx-auto max-w-lg p-6">
        <Form
          id="payment-config-form"
          onSubmit={(event: FormEvent<HTMLFormElement>): void => {
            void handleSubmit(onSubmit)(event);
          }}
        >
          <Input
            label={t("payment.fields.merchantId.label")}
            type="number"
            placeholder={t("payment.fields.merchantId.placeholder")}
            min={0}
            max={999999}
            helperText={t("payment.fields.merchantId.helper")}
            error={getFieldError("p24Merchantid")}
            {...register("merchantId", { required: true })}
          />

          <PasswordInput
            label={t("payment.fields.apiKey.label")}
            placeholder={t("payment.fields.apiKey.placeholder")}
            minLength={32}
            maxLength={32}
            helperText={t("payment.fields.apiKey.helper")}
            error={getFieldError("p24Api")}
            autoComplete="off"
            showPasswordAriaLabel={t("payment.fields.apiKey.show")}
            hidePasswordAriaLabel={t("payment.fields.apiKey.hide")}
            {...register("apiKey", {
              required: true,
              minLength: 32,
              maxLength: 32,
            })}
          />

          <PasswordInput
            label={t("payment.fields.crcKey.label")}
            placeholder={t("payment.fields.crcKey.placeholder")}
            minLength={16}
            maxLength={16}
            helperText={t("payment.fields.crcKey.helper")}
            error={getFieldError("p24Crc")}
            autoComplete="off"
            showPasswordAriaLabel={t("payment.fields.crcKey.show")}
            hidePasswordAriaLabel={t("payment.fields.crcKey.hide")}
            {...register("crcKey", {
              required: true,
              minLength: 16,
              maxLength: 16,
            })}
          />

          {submitStatus === "success" && (
            <div className="rounded-lg border border-status-success-border bg-status-success-background px-4 py-3 text-sm text-status-success-text">
              {t("payment.success")}
            </div>
          )}

          {(submitStatus === "error" || submitStatus === "validation") && (
            <div className="rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
              {errorMessage}
            </div>
          )}
        </Form>
      </div>
    </PageLayout>
  );
};
