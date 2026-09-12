import { I18nProvider, ThemeProvider, ToastProvider } from "@restorio/ui";
import {
  LANGUAGE_LOCALE_STORAGE_KEY,
  LAST_VISITED_APP_STORAGE_KEY,
  setCrossAppValue,
  THEME_STORAGE_KEY,
} from "@restorio/utils";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";

import { TenantProvider } from "../context/TenantContext";
import { fallbackMessages, getMessages } from "../i18n/messages";
import { createQueryClient } from "../lib/queryClient";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps): ReactNode => {
  const [queryClient] = useState(createQueryClient);
  // const [locale, setLocale] = useState(() =>
  //   resolveLocale({
  //     supportedLocales,
  //     defaultLocale,
  //     storageKey: LANGUAGE_LOCALE_STORAGE_KEY,
  //   }),
  // );
  // const messages = useMemo(() => getMessages(locale), [locale]);
  const locale = "pl";
  const messages = getMessages(locale);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }

    setCrossAppValue(LANGUAGE_LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    setCrossAppValue(LAST_VISITED_APP_STORAGE_KEY, "admin-panel");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider
        locale={locale}
        // setLocale={setLocale}
        setLocale={() => {
          // MVP: language switching disabled, keep Polish only.
        }}
        messages={messages}
        fallbackMessages={fallbackMessages}
      >
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThemeProvider defaultMode="system" storageKey={THEME_STORAGE_KEY}>
            <ToastProvider>
              <TenantProvider>{children}</TenantProvider>
            </ToastProvider>
          </ThemeProvider>
        </BrowserRouter>
      </I18nProvider>
    </QueryClientProvider>
  );
};
