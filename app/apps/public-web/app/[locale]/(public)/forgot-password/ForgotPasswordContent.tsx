"use client";

import { Button, Form, FormActions, FormField, Input, useAuthRoute } from "@restorio/ui";
import { getApiErrorData, getApiErrorMessage } from "@restorio/utils";
import Link from "next/link";
import type { ReactElement } from "react";
import { useState } from "react";

import { api } from "@/api/client";
import { AuthenticatedAppPicker } from "@/components/auth/AuthenticatedAppPicker";
import { useLocale, useTranslations } from "@/i18n/useT";
import { isEmailValid } from "@/services/validation";

export const ForgotPasswordContent = (): ReactElement => {
  const { authStatus } = useAuthRoute();
  const locale = useLocale();
  const t = useTranslations("forgotPassword");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<"success" | "error" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const animatedFieldClassName = "onboarding-fade-up motion-reduce:animate-none";

  const emailError = submitted
    ? email.trim().length === 0
      ? t("errors.emailRequired")
      : !isEmailValid(email)
        ? t("errors.emailInvalid")
        : undefined
    : undefined;

  const isFormValid = isEmailValid(email);
  const backendUnavailable = authStatus === "unavailable";
  const reconnecting = authStatus === "reconnecting";
  const blockAuthActions = backendUnavailable || reconnecting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitted(true);
    setFeedbackStatus(null);
    setFeedbackMessage("");

    if (!isFormValid || blockAuthActions) {
      return;
    }

    setSubmitting(true);

    try {
      await api.auth.forgotPassword({ email: email.trim() });

      setFeedbackStatus("success");
      setFeedbackMessage(t("genericConfirm"));
      setSubmitted(false);
    } catch (err: unknown) {
      const data = getApiErrorData(err);
      const rawMessage = getApiErrorMessage(data);

      setFeedbackStatus("error");
      setFeedbackMessage(rawMessage ?? t("errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  if (authStatus === "authenticated") {
    return <AuthenticatedAppPicker />;
  }

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold text-text-primary">{t("title")}</h1>
      {feedbackStatus && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            feedbackStatus === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {feedbackMessage}
        </div>
      )}
      <Form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        noValidate
        spacing="md"
      >
        <FormField className={animatedFieldClassName} style={{ animationDelay: "120ms" }}>
          <Input
            label={t("fields.email")}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
            required
          />
        </FormField>
        <FormActions align="stretch" className={animatedFieldClassName} style={{ animationDelay: "220ms" }}>
          <Button
            type="submit"
            size="lg"
            variant="primary"
            fullWidth
            disabled={!isFormValid || submitting || blockAuthActions}
          >
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </FormActions>
      </Form>
      <p className="mt-6 text-center text-sm text-text-secondary">
        <Link href={`/${locale}/login`} className="text-text-primary underline underline-offset-2 hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </>
  );
};
