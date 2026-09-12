import { Text, Button, PasswordInput } from "@restorio/ui";
import type { FormEvent, ReactElement } from "react";

import { MIN_PASSWORD_LENGTH, type PasswordChecks } from "../../services/validation";
import { PasswordRulesPin } from "../password/RulesPin";

import { useTranslations } from "@/i18n/useT";

interface ActivateSetPasswordViewProps {
  password: string;
  confirmPassword: string;
  passwordChecks: PasswordChecks;
  passwordError?: string;
  confirmPasswordError?: string;
  showPasswordRules: boolean;
  errorMessage: string;
  isPasswordFormValid: boolean;
  isSettingPassword: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onPasswordFocus: () => void;
  onPasswordBlur: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  formCopy?: {
    title: string;
    description: string;
    submit: string;
    submitting: string;
    passwordLabel: string;
    confirmPasswordLabel: string;
  };
}

export const ActivateSetPasswordView = ({
  password,
  confirmPassword,
  passwordChecks,
  passwordError,
  confirmPasswordError,
  showPasswordRules,
  errorMessage,
  isPasswordFormValid,
  isSettingPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onPasswordFocus,
  onPasswordBlur,
  onSubmit,
  formCopy,
}: ActivateSetPasswordViewProps): ReactElement => {
  const t = useTranslations("activate");
  const titleText = formCopy?.title ?? t("setPassword.title");
  const descriptionText = formCopy?.description ?? t("setPassword.description");
  const submitText = formCopy?.submit ?? t("setPassword.submit");
  const submittingText = formCopy?.submitting ?? t("setPassword.submitting");
  const passwordLabelText = formCopy?.passwordLabel ?? "Password";
  const confirmPasswordLabelText = formCopy?.confirmPasswordLabel ?? "Repeat password";

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

  return (
    <>
      <Text variant="h2" weight="bold" className="mb-4">
        {titleText}
      </Text>
      <Text variant="body-lg" className="mb-6 text-text-secondary">
        {descriptionText}
      </Text>
      <form className="w-full space-y-4 text-left" onSubmit={onSubmit}>
        <div className="relative">
          <PasswordInput
            label={passwordLabelText}
            autoComplete="new-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            onFocus={onPasswordFocus}
            onBlur={onPasswordBlur}
            error={passwordError}
            className={passwordInputStatusClassName}
            required
          />
          {showPasswordRules && <PasswordRulesPin checks={passwordChecks} />}
        </div>
        <PasswordInput
          label={confirmPasswordLabelText}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          error={confirmPasswordError}
          className={confirmPasswordInputStatusClassName}
          required
        />
        {errorMessage && <p className="text-sm text-status-error-text">{errorMessage}</p>}
        <Button type="submit" variant="primary" fullWidth disabled={!isPasswordFormValid || isSettingPassword}>
          {isSettingPassword ? submittingText : submitText}
        </Button>
      </form>
    </>
  );
};
