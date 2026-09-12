import { getAppBaseUrl, PUBLIC_WEB_LOCALE_PATH_PREFIX } from "@restorio/utils";

import { decodeAccessTokenPayload, getPublicTenantIdsFromAccessToken, isAdminPanelAccountType } from "./jwtPayload";

export const buildInvalidKitchenTenantRedirectUrl = (): string => {
  const fallbackPublicTenantId = getPublicTenantIdsFromAccessToken()[0] ?? "";
  const accountType = decodeAccessTokenPayload()?.account_type;
  const tenantQuery = fallbackPublicTenantId !== "" ? `?tenant=${encodeURIComponent(fallbackPublicTenantId)}` : "";

  if (isAdminPanelAccountType(accountType)) {
    return `${getAppBaseUrl("admin-panel")}/${tenantQuery}`;
  }

  return `${getAppBaseUrl("public-web")}${PUBLIC_WEB_LOCALE_PATH_PREFIX}${tenantQuery}`;
};
