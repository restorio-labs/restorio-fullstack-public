"use client";

import { Button, ContentContainer, Text } from "@restorio/ui";
import { getApiErrorData, getApiErrorMessage } from "@restorio/utils";
import Link from "next/link";
import type { FormEvent, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

import { api } from "@/api/client";
import { ActivateSetPasswordView } from "@/components/activation";
import { useLocale, useTranslations } from "@/i18n/useT";
import { getPasswordFieldsValidation } from "@/services/passwordFieldsValidation";

type View = "invalid" | "form" | "success";

export const ResetPasswordContent = (): ReactElement => {
  const locale = useLocale();
  const t = useTranslations("resetPassword");
  const [view, setView] = useState<View>("form");
  const [resetTokenId, setResetTokenId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const didInit = useRef(false);

  const { passwordChecks, passwordError, confirmPasswordError, isPasswordFormValid } = getPasswordFieldsValidation(
    password,
    confirmPassword,
    passwordSubmitted,
  );

  useEffect(() => {
    if (didInit.current) {
      return;
    }
    didInit.current = true;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("reset_id")?.trim() ?? "";

    if (!id) {
      setView("invalid");

      return;
    }

    setResetTokenId(id);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setPasswordSubmitted(true);
    setErrorMessage("");

    const { isPasswordFormValid: isValidNow } = getPasswordFieldsValidation(password, confirmPassword, true);

    if (!resetTokenId || !isValidNow) {
      return;
    }

    setIsSubmitting(true);

    const run = async (): Promise<void> => {
      try {
        const response = await api.auth.resetPassword({
          reset_token_id: resetTokenId,
          password,
        });

        setSuccessMessage(String(response.message));
        setView("success");
      } catch (err: unknown) {
        const data = getApiErrorData(err);
        const rawMessage = getApiErrorMessage(data);

        interface AxiosErrorShape {
          response?: { status?: number };
        }
        const axiosErr = err && typeof err === "object" && "response" in err ? (err as AxiosErrorShape) : undefined;
        const status = axiosErr?.response?.status;

        if (status === 410) {
          setErrorMessage(rawMessage ?? t("errors.expired"));
        } else if (status === 404) {
          setErrorMessage(rawMessage ?? t("errors.notFound"));
        } else if (status === 400) {
          setErrorMessage(rawMessage ?? t("errors.alreadyUsed"));
        } else {
          setErrorMessage(rawMessage ?? t("errors.generic"));
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    void run();
  };

  const formCopy = {
    title: t("form.title"),
    description: t("form.description"),
    submit: t("form.submit"),
    submitting: t("form.submitting"),
    passwordLabel: t("fields.password"),
    confirmPasswordLabel: t("fields.confirmPassword"),
  };

  if (view === "invalid") {
    return (
      <ContentContainer maxWidth="md">
        <div className="rounded-2xl border border-border-default bg-surface-primary p-8 text-center">
          <Text variant="h2" weight="bold" className="mb-4">
            {t("invalid.title")}
          </Text>
          <Text variant="body-lg" className="mb-6 text-text-secondary">
            {t("invalid.description")}
          </Text>
          <Link href={`/${locale}/forgot-password`} className="block w-full">
            <Button variant="primary" fullWidth>
              {t("invalid.requestNew")}
            </Button>
          </Link>
        </div>
      </ContentContainer>
    );
  }

  if (view === "success") {
    return (
      <ContentContainer maxWidth="md">
        <div className="rounded-2xl border border-border-default bg-surface-primary p-8 text-center">
          <Text variant="h2" weight="bold" className="mb-4">
            {t("success.title")}
          </Text>
          <Text variant="body-lg" className="mb-6 text-text-secondary">
            {successMessage || t("success.description")}
          </Text>
          <Link href={`/${locale}/login`} className="block w-full">
            <Button variant="primary" fullWidth>
              {t("success.goToLogin")}
            </Button>
          </Link>
        </div>
      </ContentContainer>
    );
  }

  return (
    <ContentContainer maxWidth="md">
      <div className="rounded-2xl border border-border-default bg-surface-primary p-8 text-center">
        <ActivateSetPasswordView
          password={password}
          confirmPassword={confirmPassword}
          passwordChecks={passwordChecks}
          passwordError={passwordError}
          confirmPasswordError={confirmPasswordError}
          showPasswordRules={showPasswordRules}
          errorMessage={errorMessage}
          isPasswordFormValid={isPasswordFormValid}
          isSettingPassword={isSubmitting}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onPasswordFocus={() => {
            setShowPasswordRules(true);
          }}
          onPasswordBlur={() => {
            const allPassed =
              passwordChecks.minLength &&
              passwordChecks.lowercase &&
              passwordChecks.uppercase &&
              passwordChecks.number &&
              passwordChecks.special;

            if (allPassed) {
              setShowPasswordRules(false);
            }
          }}
          onSubmit={handleSubmit}
          formCopy={formCopy}
        />
      </div>
    </ContentContainer>
  );
};
