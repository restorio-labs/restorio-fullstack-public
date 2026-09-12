"use client";

import { ContentContainer } from "@restorio/ui";
import { goToApp, resolveAuthenticatedAppRedirect } from "@restorio/utils";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/api/client";
import {
  ActivateSetPasswordView,
  ActivateErrorView,
  ActivateExpiredView,
  ActivateResendSentView,
  ActivateLoadingView,
  ActivateSuccessView,
  ActivateAlreadyActivatedView,
} from "@/components/activation";
import { useLocale } from "@/i18n/useT";
import { getPasswordFieldsValidation } from "@/services/passwordFieldsValidation";

type Result = "loading" | "success" | "already_activated" | "expired" | "error" | "resend_sent" | "set_password";

export function ActivateContent(): ReactElement {
  const router = useRouter();
  const locale = useLocale();
  const [result, setResult] = useState<Result>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [activationId, setActivationId] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [passwordSubmitted, setPasswordSubmitted] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const didRun = useRef(false);

  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { passwordChecks, passwordError, confirmPasswordError, isPasswordFormValid } = getPasswordFieldsValidation(
    password,
    confirmPassword,
    passwordSubmitted,
  );

  useEffect(() => {
    if (resendCooldownUntil <= 0) {
      setCooldownSeconds(0);

      return;
    }
    const tick = (): void => {
      const left = Math.ceil((resendCooldownUntil - Date.now()) / 1000);

      setCooldownSeconds(Math.max(0, left));

      if (left <= 0) {
        setResendCooldownUntil(0);
      }
    };

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [resendCooldownUntil]);

  useEffect(() => {
    if (didRun.current) {
      return;
    }
    didRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("activation_id")?.trim() ?? "";

    if (!id) {
      setErrorMessage("");
      setResult("error");

      return;
    }

    setActivationId(id);

    const run = async (): Promise<void> => {
      try {
        const body = await api.auth.activate(id);

        const requiresPasswordChange = body.data.requires_password_change === true;

        if (requiresPasswordChange) {
          setResult("set_password");

          return;
        }

        setResult((body.message === "Account already activated" ? "already_activated" : "success") as Result);
      } catch (err: unknown) {
        interface AxiosErrorShape {
          response?: { status?: number; data?: { message?: string; detail?: string } };
        }
        const axiosErr = err && typeof err === "object" && "response" in err ? (err as AxiosErrorShape) : undefined;
        const status = axiosErr?.response?.status;
        const msg = axiosErr?.response?.data?.message ?? axiosErr?.response?.data?.detail;

        if (status === 410) {
          setErrorMessage(msg ?? "");
          setResult("expired");
        } else if (status === 404) {
          router.replace(`/${locale}`);
        } else {
          setErrorMessage(msg ?? "");
          setResult("error");
        }
      }
    };

    void run();
  }, [locale, router]);

  const handleResend = (): void => {
    const idFromUrl = new URLSearchParams(window.location.search).get("activation_id")?.trim() ?? "";
    const id = activationId || idFromUrl;

    if (!id || resendLoading) {
      return;
    }
    setResendLoading(true);
    setErrorMessage("");

    const run = async (): Promise<void> => {
      try {
        await api.auth.resendActivation(id);
        setResult("resend_sent");
      } catch (err: unknown) {
        interface AxiosErrorShape {
          response?: { status?: number; data?: { message?: string; detail?: string } };
        }
        const axiosErr = err && typeof err === "object" && "response" in err ? (err as AxiosErrorShape) : undefined;

        setErrorMessage(axiosErr?.response?.data?.message ?? axiosErr?.response?.data?.detail ?? "");

        if (axiosErr?.response?.status === 429) {
          setResendCooldownUntil(Date.now() + 300_000);
        } else {
          setResult("error");
        }
      } finally {
        setResendLoading(false);
      }
    };

    void run();
  };

  const handleSetPassword = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setPasswordSubmitted(true);
    setErrorMessage("");
    const { isPasswordFormValid: isValidNow } = getPasswordFieldsValidation(password, confirmPassword, true);

    if (!activationId || !isValidNow) {
      return;
    }

    setIsSettingPassword(true);

    const run = async (): Promise<void> => {
      try {
        await api.auth.setActivationPassword({
          activation_id: activationId,
          password,
        });

        setResult("success");
      } catch (err: unknown) {
        interface AxiosErrorShape {
          response?: { status?: number; data?: { message?: string; detail?: string } };
        }
        const axiosErr = err && typeof err === "object" && "response" in err ? (err as AxiosErrorShape) : undefined;
        const status = axiosErr?.response?.status;
        const msg = axiosErr?.response?.data?.message ?? axiosErr?.response?.data?.detail;

        if (status === 410) {
          setErrorMessage(msg ?? "");
          setResult("expired");
        } else {
          setErrorMessage(msg ?? "");
        }
      } finally {
        setIsSettingPassword(false);
      }
    };

    void run();
  };

  const resendOnCooldown = cooldownSeconds > 0;

  const handleRoleBasedRedirect = useCallback(async (): Promise<void> => {
    try {
      const meData = await api.auth.me();

      goToApp(resolveAuthenticatedAppRedirect(meData.account_type));
    } catch {
      goToApp("admin-panel");
    }
  }, []);

  return (
    <div>
      <ContentContainer maxWidth="md">
        <div className="rounded-2xl border border-border-default bg-surface-primary p-8 text-center">
          {result === "loading" && <ActivateLoadingView />}

          {result === "success" && (
            <ActivateSuccessView
              onRedirect={() => {
                void handleRoleBasedRedirect();
              }}
            />
          )}

          {result === "already_activated" && (
            <ActivateAlreadyActivatedView
              onRedirect={() => {
                void handleRoleBasedRedirect();
              }}
            />
          )}

          {result === "expired" && (
            <ActivateExpiredView
              errorMessage={errorMessage}
              resendLoading={resendLoading}
              resendOnCooldown={resendOnCooldown}
              cooldownSeconds={cooldownSeconds}
              onResend={handleResend}
            />
          )}

          {result === "set_password" && (
            <ActivateSetPasswordView
              password={password}
              confirmPassword={confirmPassword}
              passwordChecks={passwordChecks}
              passwordError={passwordError}
              confirmPasswordError={confirmPasswordError}
              showPasswordRules={showPasswordRules}
              errorMessage={errorMessage}
              isPasswordFormValid={isPasswordFormValid}
              isSettingPassword={isSettingPassword}
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
              onSubmit={handleSetPassword}
            />
          )}

          {result === "resend_sent" && (
            <ActivateResendSentView
              resendLoading={resendLoading}
              resendOnCooldown={resendOnCooldown}
              cooldownSeconds={cooldownSeconds}
              onResend={handleResend}
            />
          )}

          {result === "error" && (
            <ActivateErrorView
              errorMessage={errorMessage}
              canResend={Boolean(activationId)}
              resendLoading={resendLoading}
              resendOnCooldown={resendOnCooldown}
              cooldownSeconds={cooldownSeconds}
              onResend={handleResend}
            />
          )}
        </div>
      </ContentContainer>
    </div>
  );
}
