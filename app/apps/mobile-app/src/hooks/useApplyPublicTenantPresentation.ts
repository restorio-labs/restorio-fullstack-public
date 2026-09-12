import type { PublicTenantInfo } from "@restorio/types";
import { resolveGoogleFontStylesheetHref, useGoogleFontStylesheet, useI18n, useTheme, type ThemeOverride } from "@restorio/ui";
import { useEffect, useMemo } from "react";

import { API_BASE_URL } from "../config";
import { readStoredLocale, resolveInitialLocale, SUPPORTED_LOCALES, type SupportedLocale } from "../lib/i18n";

const FAVICON_LINK_ID = "tenant-favicon";

export const useApplyPublicTenantPresentation = (tenantData: PublicTenantInfo | undefined): void => {
  const { setOverride } = useTheme();
  const { setLocale } = useI18n();
  const themeOverride = useMemo((): ThemeOverride | null => {
    const raw = tenantData?.themeOverride;

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return null;
    }

    return raw as ThemeOverride;
  }, [tenantData?.themeOverride]);

  useGoogleFontStylesheet(resolveGoogleFontStylesheetHref(themeOverride));

  useEffect(() => {
    if (!tenantData) {
      return;
    }

    const title = tenantData.pageTitle?.trim() ? tenantData.pageTitle : tenantData.name;

    document.title = title;

    const path = tenantData.faviconPath;

    if (path) {
      const href = `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
      let link = document.querySelector<HTMLLinkElement>(`link#${FAVICON_LINK_ID}`);

      if (!link) {
        link = document.createElement("link");
        link.id = FAVICON_LINK_ID;
        link.rel = "icon";
        document.head.appendChild(link);
      }

      link.href = href;
    } else {
      document.querySelector(`link#${FAVICON_LINK_ID}`)?.remove();
    }
  }, [tenantData]);

  useEffect(() => {
    setOverride(themeOverride);

    return (): void => {
      setOverride(null);
    };
  }, [themeOverride, setOverride]);

  useEffect(() => {
    if (!tenantData) {
      return;
    }

    const stored = readStoredLocale();

    if (stored) {
      setLocale(stored);

      return;
    }

    const raw = tenantData.landingContent?.uiLocale?.trim().toLowerCase();

    if (raw && SUPPORTED_LOCALES.includes(raw as SupportedLocale)) {
      setLocale(raw);

      return;
    }

    setLocale(resolveInitialLocale());
  }, [tenantData, setLocale]);
};
