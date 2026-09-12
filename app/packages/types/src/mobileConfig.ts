import type { TenantMobileLandingContent } from "./payment";

export interface TenantMobileConfig {
  pageTitle: string | null;
  themeOverride: Record<string, unknown> | null;
  landingContent: TenantMobileLandingContent | null;
  hasFavicon: boolean;
}

export interface UpdateTenantMobileConfigPayload {
  pageTitle?: string | null;
  themeOverride?: Record<string, unknown> | null;
  landingContent?: TenantMobileLandingContent | null;
}
