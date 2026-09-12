export enum Environment {
  PRODUCTION = "production",
  DEVELOPMENT = "development",
  LOCAL = "local",
}

export type EnvironmentType = (typeof Environment)[keyof typeof Environment];

export const APP_SLUGS = ["public-web", "admin-panel", "kitchen-panel", "waiter-panel", "mobile-app"] as const;

export type AppSlug = (typeof APP_SLUGS)[number];
