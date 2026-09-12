"use client";

import { Button, Form, FormActions, FormField, Input, PasswordInput, useAuthRoute } from "@restorio/ui";
import {
  getApiErrorData,
  getApiErrorMessage,
  getApiValidationFieldLeafs,
  goToApp,
  LAST_VISITED_APP_STORAGE_KEY,
  resolveAuthenticatedAppRedirect,
} from "@restorio/utils";
import Link from "next/link";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { api } from "@/api/client";
import { useLocale, useTranslations } from "@/i18n/useT";
import { translateLoginApiMessage } from "@/services/authApiMessages";
import { isEmailValid } from "@/services/validation";

type ViewState = "form" | "redirecting";
type LoginField = "email" | "password";
type LoginFieldErrors = Partial<Record<LoginField, string>>;

const extractFieldErrors = (data: unknown, t: ReturnType<typeof useTranslations>): LoginFieldErrors => {
  const errors: LoginFieldErrors = {};
  const fieldLeafs = new Set(getApiValidationFieldLeafs(data));

  if (fieldLeafs.has("email")) {
    errors.email = t("login.errors.emailInvalid");
  }

  if (fieldLeafs.has("password")) {
    errors.password = t("login.errors.passwordInvalid");
  }

  return errors;
};
const MIN_PASSWORD_LENGTH_FACADE = 1;

export const LoginContent = (): ReactElement | null => {
  const { authStatus, refreshAuth } = useAuthRoute();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [view, setView] = useState<ViewState>("form");
  const t = useTranslations();
  const locale = useLocale();
  const animatedFieldClassName = "onboarding-fade-up motion-reduce:animate-none";

  const passwordValid = useMemo(() => password.trim().length >= MIN_PASSWORD_LENGTH_FACADE, [password]);
  const isFormValid = useMemo(() => isEmailValid(email) && passwordValid, [email, passwordValid]);
  const backendUnavailable = authStatus === "unavailable";
  const reconnecting = authStatus === "reconnecting";
  const blockAuthActions = backendUnavailable || reconnecting;

  const emailError = fieldErrors.email
    ? fieldErrors.email
    : submitted
      ? email.trim().length === 0
        ? t("login.errors.emailRequired")
        : !isEmailValid(email)
          ? t("login.errors.emailInvalid")
          : undefined
      : undefined;
  const passwordError = fieldErrors.password
    ? fieldErrors.password
    : submitted
      ? password.trim().length === 0
        ? t("login.errors.passwordRequired")
        : !passwordValid
          ? t("login.errors.passwordMinLength", { min: MIN_PASSWORD_LENGTH_FACADE })
          : undefined
      : undefined;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitted(true);
    setErrorMessage("");
    setFieldErrors({});

    if (!isFormValid || submitting || blockAuthActions) {
      return;
    }

    setSubmitting(true);

    try {
      await api.auth.login(email.trim(), password);

      await refreshAuth();

      const meData = await api.auth.me();
      const rlvp = localStorage.getItem(LAST_VISITED_APP_STORAGE_KEY);

      goToApp(resolveAuthenticatedAppRedirect(meData.account_type, rlvp));
    } catch (err: unknown) {
      const data = getApiErrorData(err);
      const extractedFieldErrors = extractFieldErrors(data, t);
      const hasFieldErrors = Object.keys(extractedFieldErrors).length > 0;
      const rawApiMessage = getApiErrorMessage(data);
      const apiMessage = translateLoginApiMessage(rawApiMessage, t);

      if (hasFieldErrors) {
        setFieldErrors(extractedFieldErrors);
      }

      setErrorMessage(apiMessage ?? (hasFieldErrors ? "" : t("login.genericError")));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }

    const fetchRoleAndRedirect = async (): Promise<void> => {
      try {
        const meData = await api.auth.me();
        const rlvp = localStorage.getItem(LAST_VISITED_APP_STORAGE_KEY);

        goToApp(resolveAuthenticatedAppRedirect(meData.account_type, rlvp));
      } catch {
        goToApp("admin-panel");
      }
    };

    void fetchRoleAndRedirect();
  }, [authStatus]);

  if (authStatus === "authenticated" || view === "redirecting") {
    return null;
  }

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold text-text-primary">{t("login.title")}</h1>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-status-error-border bg-status-error-surface px-4 py-3 text-sm text-status-error-text">
          {errorMessage}
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
            id="login-email"
            label={t("login.email")}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);

              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            error={emailError}
            required
          />
        </FormField>

        <FormField className={animatedFieldClassName} style={{ animationDelay: "220ms" }}>
          <PasswordInput
            id="login-password"
            label={t("login.password")}
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);

              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            error={passwordError}
            required
          />
        </FormField>

        <div className={`text-right ${animatedFieldClassName}`} style={{ animationDelay: "280ms" }}>
          <Link
            href={`/${locale}/forgot-password`}
            className="text-sm font-medium text-text-primary underline underline-offset-2 hover:underline"
          >
            {t("login.forgotPasswordLink")}
          </Link>
        </div>

        <FormActions align="stretch" className={animatedFieldClassName} style={{ animationDelay: "320ms" }}>
          <Button
            type="submit"
            size="lg"
            variant="primary"
            fullWidth
            disabled={!isFormValid || submitting || blockAuthActions}
          >
            {submitting ? t("login.submitting") : t("login.submit")}
          </Button>
        </FormActions>
      </Form>
    </>
  );
};
