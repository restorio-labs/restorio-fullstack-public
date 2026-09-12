interface EnvSource {
  env?: Record<string, string | undefined>;
}

const getEnvVar = (key: string): string | undefined => {
  const processEnv = (globalThis as { process?: EnvSource }).process?.env;
  const viteEnv = (import.meta as EnvSource).env;

  return processEnv?.[key] ?? viteEnv?.[key];
};

// security
export const ACCESS_TOKEN_KEY = getEnvVar("ACCESS_TOKEN_KEY") ?? "rat";
export const REFRESH_TOKEN_KEY = getEnvVar("REFRESH_TOKEN_KEY") ?? "rrt";
export const SESSION_HINT_COOKIE = getEnvVar("SESSION_HINT_COOKIE") ?? "rshc";

export const THEME_STORAGE_KEY = getEnvVar("THEME_STORAGE_KEY") ?? "rtm";

export const LANGUAGE_LOCALE_STORAGE_KEY = getEnvVar("LANGUAGE_LOCALE_STORAGE_KEY") ?? "rll";

export const LAST_VISITED_APP_STORAGE_KEY = getEnvVar("LAST_VISITED_APP_STORAGE_KEY") ?? "rlvp";

export const CROSS_APP_BACKUP_STORAGE_KEY = getEnvVar("CROSS_APP_BACKUP_STORAGE_KEY") ?? "rsinfo";

export const TENANT_STORAGE_KEY = getEnvVar("RESTORIO_SELECTED_TENANT_ID") ?? "rstid";
