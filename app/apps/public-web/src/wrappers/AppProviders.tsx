"use client";

import { checkPublicWebAuth } from "@restorio/auth";
import {
  AuthRouteProvider,
  I18nProvider,
  ThemeProvider,
  type AuthCheckContext,
  type AuthRouteResolvedStatus,
} from "@restorio/ui";
import { SESSION_HINT_COOKIE, THEME_STORAGE_KEY } from "@restorio/utils";
import type { ReactNode } from "react";
import { useCallback } from "react";

import { api } from "@/api/client";

interface AppProvidersProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}

export const AppProviders = ({ children, locale, messages }: AppProvidersProps): ReactNode => {
  const checkAuth = useCallback(async ({ onReconnecting }: AuthCheckContext): Promise<AuthRouteResolvedStatus> => {
    return checkPublicWebAuth(() => api.auth.me(), {
      requireSessionHintCookie: SESSION_HINT_COOKIE,
      isBackendReachable: () => api.health.isReachable(),
      onReconnecting,
    });
  }, []);

  return (
    <I18nProvider locale={locale} messages={messages}>
      <ThemeProvider defaultMode="system" storageKey={THEME_STORAGE_KEY}>
        <AuthRouteProvider checkAuth={checkAuth}>{children}</AuthRouteProvider>
      </ThemeProvider>
    </I18nProvider>
  );
};
