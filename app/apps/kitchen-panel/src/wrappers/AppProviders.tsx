import { I18nProvider, ThemeProvider, ToastProvider } from "@restorio/ui";
import { THEME_STORAGE_KEY } from "@restorio/utils";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { BrowserRouter } from "react-router-dom";

import { createQueryClient } from "../lib/queryClient";
import plMessages from "../locales/pl.json";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps): ReactNode => {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider locale="pl" messages={plMessages}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThemeProvider defaultMode="system" storageKey={THEME_STORAGE_KEY}>
            <ToastProvider position="top-left">{children}</ToastProvider>
          </ThemeProvider>
        </BrowserRouter>
      </I18nProvider>
    </QueryClientProvider>
  );
};
