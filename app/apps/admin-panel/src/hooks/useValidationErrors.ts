import type { ValidationErrorResponse } from "@restorio/types";
import { useI18n } from "@restorio/ui";
import { snakeToCamel } from "@restorio/utils";
import { useCallback, useMemo, useState } from "react";

interface FieldError {
  field: string;
  message: string;
}

interface UseValidationErrorsReturn {
  fieldErrors: FieldError[];
  fieldErrorMap: Record<string, string>;
  hasFieldError: (field: string) => boolean;
  getFieldError: (field: string) => string | undefined;
  setFromResponse: (error: unknown, i18nPrefix: string) => boolean;
  clearErrors: () => void;
}

const isValidationResponse = (data: unknown): data is ValidationErrorResponse =>
  typeof data === "object" &&
  data !== null &&
  "fields" in data &&
  Array.isArray((data as ValidationErrorResponse).fields);

const extractResponseData = (error: unknown): { status?: number; data?: unknown } | null => {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  const err = error as { response?: { status?: number; data?: unknown } };

  return err.response ?? null;
};

export const useValidationErrors = (): UseValidationErrorsReturn => {
  const { t } = useI18n();
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  const setFromResponse = useCallback(
    (error: unknown, i18nPrefix: string): boolean => {
      const response = extractResponseData(error);

      if (!response || response.status !== 422) {
        return false;
      }

      if (!isValidationResponse(response.data) || response.data.fields.length === 0) {
        return false;
      }

      const errors: FieldError[] = response.data.fields.map((snakeField) => {
        const camelField = snakeToCamel(snakeField);
        const key = `${i18nPrefix}.${camelField}.error`;

        return { field: camelField, message: t(key) };
      });

      setFieldErrors(errors);

      return true;
    },
    [t],
  );

  const clearErrors = useCallback(() => {
    setFieldErrors([]);
  }, []);

  const fieldErrorMap = useMemo(() => {
    const map: Record<string, string> = {};

    for (const { field, message } of fieldErrors) {
      map[field] = message;
    }

    return map;
  }, [fieldErrors]);

  const hasFieldError = useCallback(
    (field: string): boolean => fieldErrors.some((e) => e.field === field),
    [fieldErrors],
  );

  const getFieldError = useCallback(
    (field: string): string | undefined => fieldErrors.find((e) => e.field === field)?.message,
    [fieldErrors],
  );

  return {
    fieldErrors,
    fieldErrorMap,
    hasFieldError,
    getFieldError,
    setFromResponse,
    clearErrors,
  };
};
