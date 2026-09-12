export const getEnvSource = (viteEnv?: Record<string, unknown>): Record<string, unknown> =>
  viteEnv ?? (typeof process !== "undefined" ? (process.env as Record<string, unknown>) : undefined) ?? {};
