import { checkPassword, isPasswordValid, type PasswordChecks } from "./validation";

export interface PasswordFieldsValidationResult {
  passwordChecks: PasswordChecks;
  passwordValid: boolean;
  passwordError?: string;
  confirmPasswordError?: string;
  isPasswordFormValid: boolean;
}

export const getPasswordFieldsValidation = (
  password: string,
  confirmPassword: string,
  submitted: boolean,
): PasswordFieldsValidationResult => {
  const passwordChecks = checkPassword(password);
  const passwordValid = isPasswordValid(passwordChecks);
  const passwordError = submitted
    ? password.trim().length === 0
      ? "Password is required"
      : !passwordValid
        ? "Password does not meet the requirements"
        : undefined
    : undefined;
  const confirmPasswordError = submitted
    ? confirmPassword.trim().length === 0
      ? "Confirm your password"
      : confirmPassword !== password
        ? "Passwords do not match"
        : undefined
    : undefined;

  return {
    passwordChecks,
    passwordValid,
    passwordError,
    confirmPasswordError,
    isPasswordFormValid: passwordValid && confirmPassword === password && confirmPassword.length > 0,
  };
};
