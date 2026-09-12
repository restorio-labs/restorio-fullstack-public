import { getThemeBootScript } from "@restorio/ui/theme-mode";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode, ReactElement } from "react";

import { getRootMetadata } from "../../src/i18n/metadata";
import { loadMessages, locales } from "../../src/i18n/request";
import { AppProviders } from "../../src/wrappers/AppProviders";

import "../globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export interface MetadataParams {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { locale } = await params;

  return getRootMetadata(locale);
}

interface RootLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({ children, params }: RootLayoutProps): Promise<ReactElement> {
  const themeBootScript = getThemeBootScript();
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  const messages = await loadMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Theme boot script must run before hydration - no user input */}
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-interactive-primary focus:text-text-inverse focus:rounded-button focus-visible-ring focus:block focus:not-sr-only"
        >
          {(messages.common as Record<string, string | undefined>).skipToContent ?? "Skip to content"}
        </a>
        <AppProviders locale={locale} messages={messages}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
