import type { ValidationErrorResponse } from "@restorio/types";

interface ApiErrorDetailEntry {
  loc?: unknown;
}

interface ApiErrorWithResponse {
  response?: {
    data?: unknown;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

export const getApiErrorData = (error: unknown): unknown => {
  if (!isRecord(error)) {
    return undefined;
  }

  const typedError = error as ApiErrorWithResponse;

  return typedError.response?.data;
};

export const getApiErrorMessage = (data: unknown): string | undefined => {
  if (!isRecord(data)) {
    return undefined;
  }

  if (typeof data.detail === "string" && data.detail.trim().length > 0) {
    return data.detail;
  }

  if (typeof data.message === "string" && data.message.trim().length > 0) {
    return data.message;
  }

  return undefined;
};

export const getApiValidationFields = (data: unknown): string[] => {
  if (!isRecord(data)) {
    return [];
  }

  const fields = new Set<string>();
  const validationFields = data.fields;

  if (Array.isArray(validationFields)) {
    for (const field of validationFields as ValidationErrorResponse["fields"]) {
      if (typeof field === "string" && field.length > 0) {
        fields.add(field);
      }
    }
  }

  if (Array.isArray(data.detail)) {
    for (const detailItem of data.detail as ApiErrorDetailEntry[]) {
      if (!isRecord(detailItem) || !Array.isArray(detailItem.loc)) {
        continue;
      }

      const fieldPath = detailItem.loc
        .map((part) => (typeof part === "string" || typeof part === "number" ? String(part) : ""))
        .filter((part) => part.length > 0 && part !== "body")
        .join(".");

      if (fieldPath.length > 0) {
        fields.add(fieldPath);
      }
    }
  }

  return [...fields];
};

export const getApiValidationFieldLeafs = (data: unknown): string[] => {
  const leafs = new Set<string>();

  for (const fieldPath of getApiValidationFields(data)) {
    const leaf = fieldPath.split(".").at(-1)?.toLowerCase();

    if (leaf != null && leaf.length > 0) {
      leafs.add(leaf);
    }
  }

  return [...leafs];
};
