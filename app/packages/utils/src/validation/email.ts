const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmailValid = (value: string): boolean => value.trim().length > 0 && EMAIL_REGEX.test(value.trim());
