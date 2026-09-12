"use client";

import { Button, Form, FormActions, FormField, Input, PasswordInput, useAuthRoute } from "@restorio/ui";
import { getApiErrorData, getApiErrorMessage } from "@restorio/utils";
import Link from "next/link";
import { useId, useState, type ReactElement } from "react";

import { api } from "@/api/client";
import { AuthenticatedAppPicker } from "@/components/auth/AuthenticatedAppPicker";
import { PasswordRulesPin } from "@/components/password/RulesPin";
import { useLocale, useTranslations } from "@/i18n/useT";
import { translateRegisterApiMessage } from "@/services/authApiMessages";
import { getPasswordFieldsValidation } from "@/services/passwordFieldsValidation";
import { MIN_PASSWORD_LENGTH, isEmailValid } from "@/services/validation";

export const RegisterContent = (): ReactElement => {
  const { authStatus, refreshAuth } = useAuthRoute();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<"success" | "error" | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const t = useTranslations("register");
  const locale = useLocale();
  const animatedFieldClassName = "onboarding-fade-up motion-reduce:animate-none";

  const checkboxId = useId();
  const errorId = `${checkboxId}-error`;

  const linkedTermsText: ReactElement = (
    <>
      {t("fields.accept")}{" "}
      <Link
        href={`/${locale}/privacy`}
        target="_blank"
        className="text-text-primary underline underline-offset-2 hover:underline"
      >
        {t("fields.statute")}
      </Link>{" "}
      {t("fields.and")}{" "}
      <Link
        href={`/${locale}/terms`}
        target="_blank"
        className="text-text-primary underline underline-offset-2 hover:underline"
      >
        {t("fields.terms")}
      </Link>{" "}
      {t("fields.ofService")}
    </>
  );

  const { passwordChecks, passwordValid, isPasswordFormValid } = getPasswordFieldsValidation(
    password,
    confirmPassword,
    submitted,
  );

  const emailError = submitted
    ? email.trim().length === 0
      ? t("errors.emailRequired")
      : !isEmailValid(email)
        ? t("errors.emailInvalid")
        : undefined
    : undefined;

  const passwordError = submitted
    ? password.trim().length === 0
      ? t("errors.passwordRequired")
      : !passwordValid
        ? t("errors.passwordInvalid")
        : undefined
    : undefined;

  const confirmPasswordError = submitted
    ? confirmPassword.trim().length === 0
      ? t("errors.confirmPasswordRequired")
      : confirmPassword !== password
        ? t("errors.confirmPasswordMismatch")
        : undefined
    : undefined;

  const termsError = submitted && !acceptTerms ? t("errors.termsRequired") : undefined;

  const isFormValid = isEmailValid(email) && isPasswordFormValid && acceptTerms;
  const backendUnavailable = authStatus === "unavailable";
  const reconnecting = authStatus === "reconnecting";
  const blockAuthActions = backendUnavailable || reconnecting;

  const confirmPasswordMeetsLength = confirmPassword.length >= MIN_PASSWORD_LENGTH;
  const passwordsMatchByLength = confirmPasswordMeetsLength && confirmPassword === password;
  const confirmPasswordMismatchHighlight =
    password.trim().length > 0 && confirmPasswordMeetsLength && confirmPassword !== password && !confirmPasswordError;

  const passwordInputStatusClassName =
    !passwordError && passwordsMatchByLength
      ? "border-status-success-border focus:ring-status-success-border focus:border-status-success-border"
      : undefined;

  const confirmPasswordInputStatusClassName =
    !confirmPasswordError && passwordsMatchByLength
      ? "border-status-success-border focus:ring-status-success-border focus:border-status-success-border"
      : confirmPasswordMismatchHighlight
        ? "border-status-error-border focus:ring-status-error-border focus:border-status-error-border"
        : undefined;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitted(true);
    setFeedbackStatus(null);
    setFeedbackMessage("");

    if (!isFormValid || blockAuthActions) {
      return;
    }

    try {
      const response = await api.auth.register({
        email: email.trim(),
        password,
      });

      await refreshAuth();

      setFeedbackStatus("success");
      setFeedbackMessage(String(response.message));
      setSubmitted(false);
    } catch (err: unknown) {
      const data = getApiErrorData(err);
      const rawMessage = getApiErrorMessage(data);
      const apiMessage = translateRegisterApiMessage(rawMessage, t) ?? t("errors.generic");

      setFeedbackStatus("error");

      setFeedbackMessage(apiMessage);
    }
  };

  if (authStatus === "authenticated") {
    return <AuthenticatedAppPicker />;
  }

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">{t("title")}</h1>
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

        <FormField className={animatedFieldClassName} style={{ animationDelay: "220ms" }}>
          <div className="relative">
            <PasswordInput
              label={t("fields.password")}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onFocus={() => setShowPasswordRules(true)}
              onBlur={() => setShowPasswordRules(false)}
              error={passwordError}
              className={passwordInputStatusClassName}
              required
            />
            {showPasswordRules && <PasswordRulesPin checks={passwordChecks} />}
          </div>
        </FormField>

        <FormField className={animatedFieldClassName} style={{ animationDelay: "320ms" }}>
          <PasswordInput
            label={t("fields.confirmPassword")}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={confirmPasswordError}
            className={confirmPasswordInputStatusClassName}
            required
          />
        </FormField>

        <FormField className={animatedFieldClassName} style={{ animationDelay: "420ms" }}>
          <div className="w-full">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id={checkboxId}
                className={`mt-0.5 w-4 h-4 text-interactive-primary bg-surface-primary border-border-default rounded-sm focus:ring-2 focus:ring-border-focus focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                  termsError ? "border-status-error-border" : ""
                }`}
                aria-invalid={termsError ? "true" : undefined}
                aria-describedby={termsError ? errorId : undefined}
                checked={acceptTerms}
                onChange={(event) => setAcceptTerms(event.target.checked)}
                required
              />
              <label htmlFor={checkboxId} className="text-sm font-medium text-text-primary cursor-pointer">
                {linkedTermsText}
              </label>
            </div>
            {termsError && (
              <span id={errorId} className="block mt-1 text-sm text-status-error-text" role="alert">
                {termsError}
              </span>
            )}
          </div>
        </FormField>

        <FormActions align="stretch" className={animatedFieldClassName} style={{ animationDelay: "520ms" }}>
          <Button type="submit" size="lg" variant="primary" fullWidth disabled={!isFormValid || blockAuthActions}>
            {t("button")}
          </Button>
        </FormActions>
      </Form>
    </>
  );
};
