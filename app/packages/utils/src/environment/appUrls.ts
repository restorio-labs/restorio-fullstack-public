import { Environment, type AppSlug, type EnvironmentType } from "@restorio/types";

import { LAST_VISITED_APP_STORAGE_KEY } from "../storageKeys";

import { resolveNextEnvVar } from "./resolveNextEnvVar";

const LOCAL_PORTS: Record<AppSlug, number> = {
  "public-web": 3000,
  "admin-panel": 3001,
  "kitchen-panel": 3002,
  "waiter-panel": 3004,
  "mobile-app": 3003,
};

const PRODUCTION_DOMAIN = "restorio.org";

const PRODUCTION_SUBDOMAINS: Record<AppSlug, string> = {
  "public-web": "",
  "admin-panel": "admin",
  "kitchen-panel": "kitchen",
  "waiter-panel": "waiter",
  "mobile-app": "mobile",
};

export const getAppUrl = (environment: EnvironmentType, appSlug: AppSlug): string => {
  if (environment === Environment.PRODUCTION) {
    const subdomain = PRODUCTION_SUBDOMAINS[appSlug];

    if (subdomain.length === 0) {
      return `https://${PRODUCTION_DOMAIN}`;
    }

    return `https://${subdomain}.${PRODUCTION_DOMAIN}`;
  }

  const port = LOCAL_PORTS[appSlug];

  return `http://localhost:${port}`;
};

export const getEnvironmentFromEnv = (mode: string): EnvironmentType => {
  if (mode === "production") {
    return Environment.PRODUCTION;
  }

  if (mode === "development") {
    return Environment.DEVELOPMENT;
  }

  return Environment.LOCAL;
};

export const getEnvMode = (): string => {
  const viteMode =
    typeof import.meta !== "undefined"
      ? (import.meta as ImportMeta & { env?: { MODE?: string } }).env?.MODE
      : undefined;

  if (viteMode === "production") {
    return "production";
  }

  const processEnv = typeof process !== "undefined" ? (process.env as Record<string, unknown>) : undefined;

  return resolveNextEnvVar(processEnv ?? {}, "ENV", "NODE_ENV") ?? "development";
};

export const getAppHref = (slug: AppSlug): string => {
  const envMode = getEnvMode();

  return getAppUrl(getEnvironmentFromEnv(envMode), slug);
};

export const getMergedRuntimeEnv = (): Record<string, unknown> => {
  const viteEnv =
    typeof import.meta !== "undefined" ? (import.meta as { env?: Record<string, unknown> }).env : undefined;
  const processEnv = typeof process !== "undefined" ? (process.env as Record<string, unknown>) : undefined;

  return { ...(viteEnv ?? {}), ...(processEnv ?? {}) };
};

const APP_URL_OVERRIDE_KEYS: Partial<Record<AppSlug, readonly string[]>> = {
  "public-web": ["VITE_PUBLIC_WEB_URL", "NEXT_PUBLIC_PUBLIC_WEB_URL"],
  "admin-panel": ["VITE_ADMIN_PANEL_URL", "NEXT_PUBLIC_ADMIN_PANEL_URL"],
};

export const PUBLIC_WEB_LOCALE_PATH_PREFIX = "/pl";

export const getAppBaseUrl = (slug: AppSlug): string => {
  const keys = APP_URL_OVERRIDE_KEYS[slug];

  if (keys !== undefined && keys.length > 0) {
    const merged = getMergedRuntimeEnv();
    const override = resolveNextEnvVar(merged, ...keys);

    if (override !== undefined) {
      return override;
    }
  }

  return getAppHref(slug);
};

export const goToApp = (slug: AppSlug): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(LAST_VISITED_APP_STORAGE_KEY, slug);
  window.location.href = getAppBaseUrl(slug);
};

export interface ResolveApiBaseUrlOptions {
  readonly preferRelativeInBrowser?: boolean;
}

const DEFAULT_PRODUCTION_API_BASE = "https://api.restorio.org/api/v1";

const _isLocalhostApiUrl = (value: string): boolean => {
  try {
    return new URL(value).hostname === "localhost" || new URL(value).hostname === "127.0.0.1";
  } catch {
    return false;
  }
};

export const resolveApiBaseUrl = (options?: ResolveApiBaseUrlOptions): string => {
  const merged = getMergedRuntimeEnv();
  const fromEnv = resolveNextEnvVar(merged, "VITE_API_BASE_URL", "NEXT_PUBLIC_API_BASE_URL");

  if (typeof fromEnv === "string" && fromEnv.length > 0) {
    const envTypeEarly = getEnvironmentFromEnv(getEnvMode());

    if (!(envTypeEarly === Environment.PRODUCTION && _isLocalhostApiUrl(fromEnv))) {
      return fromEnv;
    }
  }

  const envType = getEnvironmentFromEnv(getEnvMode());

  if (
    options?.preferRelativeInBrowser === true &&
    typeof window !== "undefined" &&
    envType !== Environment.PRODUCTION
  ) {
    return "/api/v1";
  }

  const originOverride = resolveNextEnvVar(merged, "VITE_PUBLIC_API_ORIGIN", "NEXT_PUBLIC_PUBLIC_API_ORIGIN");

  if (typeof originOverride === "string" && originOverride.length > 0) {
    const trimmed = originOverride.replace(/\/$/, "");

    return `${trimmed}/api/v1`;
  }

  if (envType === Environment.PRODUCTION) {
    return DEFAULT_PRODUCTION_API_BASE;
  }

  return "http://localhost:8000/api/v1";
};
