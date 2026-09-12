const readHttpResponseStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return undefined;
  }

  const response = (error as { response?: unknown }).response;

  if (typeof response !== "object" || response === null || !("status" in response)) {
    return undefined;
  }

  const status = (response as { status?: unknown }).status;

  return typeof status === "number" ? status : undefined;
};

export const isTenantNotFoundApiError = (error: unknown): boolean => {
  return readHttpResponseStatus(error) === 404;
};
