import { fireEvent, render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { ActivateAlreadyActivatedView } from "../../../../src/components/activation/ActivateAlreadyActivatedView";
import { ActivateErrorView } from "../../../../src/components/activation/ActivateErrorView";
import { ActivateExpiredView } from "../../../../src/components/activation/ActivateExpiredView";
import { ActivateLoadingView } from "../../../../src/components/activation/ActivateLoadingView";
import { ActivateResendSentView } from "../../../../src/components/activation/ActivateResendSentView";
import { ActivateSetPasswordView } from "../../../../src/components/activation/ActivateSetPassword";
import { ActivateSuccessView } from "../../../../src/components/activation/ActivateSuccessView";
import type { PasswordChecks } from "../../../../src/services/validation";

type TranslationFn = (key: string, values?: Record<string, number | string>) => string;
type UseTranslationsFn = (namespace?: string) => TranslationFn;

const { useTranslationsMock } = vi.hoisted(() => {
  const translate: TranslationFn = (key, values) => (values ? `${key}-${JSON.stringify(values)}` : key);

  const useTranslationsMockInner: UseTranslationsFn = () => translate;

  return {
    useTranslationsMock: vi.fn<UseTranslationsFn>().mockImplementation(useTranslationsMockInner),
  };
});

vi.mock("@/i18n/useT", () => ({
  useTranslations: useTranslationsMock,
}));

describe("Activation views", () => {
  beforeEach((): void => {
    useTranslationsMock.mockClear();
    vi.useFakeTimers();
  });

  afterEach((): void => {
    vi.useRealTimers();
  });

  it("renders loading view with expected texts", () => {
    render(<ActivateLoadingView />);

    expect(screen.getByText("loading.title")).toBeInTheDocument();
    expect(screen.getByText("loading.subtitle")).toBeInTheDocument();
    expect(useTranslationsMock).toHaveBeenCalledWith("activate");
  });

  it("renders already activated view and triggers redirect after 2s", async () => {
    const handleRedirect = vi.fn();

    render(<ActivateAlreadyActivatedView onRedirect={handleRedirect} />);

    expect(screen.getByText("alreadyActivated.title")).toBeInTheDocument();
    expect(screen.getByText("success.redirecting")).toBeInTheDocument();
    expect(handleRedirect).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(handleRedirect).toHaveBeenCalledTimes(1);
    expect(useTranslationsMock).toHaveBeenCalledWith("activate");
  });

  it("renders success view and triggers redirect after 2s", async () => {
    const handleRedirect = vi.fn();

    render(<ActivateSuccessView onRedirect={handleRedirect} />);

    expect(screen.getByText("success.title")).toBeInTheDocument();
    expect(screen.getByText("success.description")).toBeInTheDocument();
    expect(screen.getByText("success.redirecting")).toBeInTheDocument();
    expect(handleRedirect).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(handleRedirect).toHaveBeenCalledTimes(1);
    expect(useTranslationsMock).toHaveBeenCalledWith("activate");
  });

  it("renders error view with provided message and resend disabled state", () => {
    const handleResend = vi.fn();

    render(
      <ActivateErrorView
        errorMessage="Custom error"
        canResend={false}
        resendLoading={false}
        resendOnCooldown={false}
        cooldownSeconds={60}
        onResend={handleResend}
      />,
    );

    expect(screen.getByText("error.title")).toBeInTheDocument();
    expect(screen.getByText("Custom error")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resend/i })).not.toBeInTheDocument();
    expect(handleResend).not.toHaveBeenCalled();
    expect(useTranslationsMock).toHaveBeenCalledWith("activate");
  });

  it("renders error view with resend button and handles cooldown label", () => {
    const handleResend = vi.fn();

    render(
      <ActivateErrorView
        errorMessage=""
        canResend
        resendLoading={false}
        resendOnCooldown
        cooldownSeconds={30}
        onResend={handleResend}
      />,
    );

    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('buttons.resendWithCooldown-{"seconds":30}');
  });

  it("renders expired view and disables button while loading", () => {
    const handleResend = vi.fn();

    render(
      <ActivateExpiredView
        errorMessage="Expired error"
        resendLoading
        resendOnCooldown={false}
        cooldownSeconds={15}
        onResend={handleResend}
      />,
    );

    expect(screen.getByText("expired.title")).toBeInTheDocument();
    expect(screen.getByText("Expired error")).toBeInTheDocument();

    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("buttons.resendLoading");
  });

  it("renders expired view with cooldown label and disabled button", () => {
    const handleResend = vi.fn();

    render(
      <ActivateExpiredView
        errorMessage=""
        resendLoading={false}
        resendOnCooldown
        cooldownSeconds={10}
        onResend={handleResend}
      />,
    );

    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('buttons.resendWithCooldown-{"seconds":10}');
  });

  it("renders resend sent view and respects cooldown and loading flags", () => {
    const handleResend = vi.fn();

    const { rerender } = render(
      <ActivateResendSentView
        resendLoading={false}
        resendOnCooldown={false}
        cooldownSeconds={20}
        onResend={handleResend}
      />,
    );

    const activeButton = screen.getByRole("button", { name: "resendSent.resendAgain" });

    expect(activeButton).toBeEnabled();

    fireEvent.click(activeButton);
    expect(handleResend).toHaveBeenCalledTimes(1);

    rerender(
      <ActivateResendSentView resendLoading={false} resendOnCooldown cooldownSeconds={20} onResend={handleResend} />,
    );

    const cooldownButton = screen.getByRole("button");

    expect(cooldownButton).toBeDisabled();
    expect(cooldownButton).toHaveTextContent('buttons.resendWithCooldown-{"seconds":20}');
  });

  it("renders set password view with password rules when enabled", () => {
    const passwordChecks: PasswordChecks = {
      minLength: true,
      lowercase: true,
      uppercase: false,
      number: false,
      special: true,
    };
    const handlePasswordChange = vi.fn();
    const handleConfirmPasswordChange = vi.fn();
    const handlePasswordFocus = vi.fn();
    const handlePasswordBlur = vi.fn();
    const handleSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
    });

    render(
      <ActivateSetPasswordView
        password="Password1!"
        confirmPassword="Password1!"
        passwordChecks={passwordChecks}
        passwordError={undefined}
        confirmPasswordError={undefined}
        showPasswordRules
        errorMessage=""
        isPasswordFormValid
        isSettingPassword={false}
        onPasswordChange={handlePasswordChange}
        onConfirmPasswordChange={handleConfirmPasswordChange}
        onPasswordFocus={handlePasswordFocus}
        onPasswordBlur={handlePasswordBlur}
        onSubmit={handleSubmit}
      />,
    );

    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Repeat password");

    fireEvent.focus(passwordInput);
    fireEvent.blur(passwordInput);
    fireEvent.change(passwordInput, { target: { value: "NewPassword1!" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "NewPassword1!" } });

    expect(handlePasswordFocus).toHaveBeenCalledTimes(1);
    expect(handlePasswordBlur).toHaveBeenCalledTimes(1);
    expect(handlePasswordChange).toHaveBeenCalledWith("NewPassword1!");
    expect(handleConfirmPasswordChange).toHaveBeenCalledWith("NewPassword1!");

    const submitButton = screen.getByRole("button", { name: "setPassword.submit" });

    expect(submitButton).toBeEnabled();

    fireEvent.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(useTranslationsMock).toHaveBeenCalledWith("activate");
  });

  it("disables submit button and shows error message when form is invalid", () => {
    const passwordChecks: PasswordChecks = {
      minLength: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false,
    };

    render(
      <ActivateSetPasswordView
        password=""
        confirmPassword=""
        passwordChecks={passwordChecks}
        passwordError="Password error"
        confirmPasswordError="Confirm error"
        showPasswordRules={false}
        errorMessage="Form error"
        isPasswordFormValid={false}
        isSettingPassword={false}
        onPasswordChange={() => {}}
        onConfirmPasswordChange={() => {}}
        onPasswordFocus={() => {}}
        onPasswordBlur={() => {}}
        onSubmit={() => {}}
      />,
    );

    expect(screen.getByText("Form error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "setPassword.submit" })).toBeDisabled();
  });
});
