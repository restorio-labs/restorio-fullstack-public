import { resolveApiBaseUrl } from "@restorio/utils";

const ENV = import.meta.env as unknown as Record<string, unknown>;

const apiBaseUrlEnv =
  typeof ENV.VITE_API_BASE_URL === "string" && ENV.VITE_API_BASE_URL.length > 0 ? ENV.VITE_API_BASE_URL : undefined;

const defaultApiBaseUrl = import.meta.env.PROD ? resolveApiBaseUrl() : "http://localhost:8000/api/v1";

export const API_BASE_URL = apiBaseUrlEnv ?? defaultApiBaseUrl;
