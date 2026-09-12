import { useI18n } from "@restorio/ui";
import { getAppBaseUrl } from "@restorio/utils";
import { useLayoutEffect, type ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { SUPPORTED_LOCALES, resolveInitialLocale, type SupportedLocale } from "../lib/i18n";
import { readLastVisitedTenantPath } from "../lib/lastVisitedTenant";

const resolvePublicWebLocale = (locale: string): SupportedLocale => {
  if (SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    return locale as SupportedLocale;
  }

  return resolveInitialLocale();
};

export const RootRedirectPage = (): ReactElement => {
  const { locale } = useI18n();
  const to = readLastVisitedTenantPath();

  useLayoutEffect(() => {
    if (to) {
      return;
    }

    const base = getAppBaseUrl("public-web").replace(/\/$/, "");
    const pathLocale = resolvePublicWebLocale(locale);
    window.location.replace(`${base}/${pathLocale}`);
  }, [to, locale]);

  if (to) {
    return <Navigate to={to} replace />;
  }

  return <div className="min-h-[100dvh] bg-surface-primary" />;
};
