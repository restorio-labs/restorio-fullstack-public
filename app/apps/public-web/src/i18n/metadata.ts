import type { Metadata } from "next";

import { loadMessages, locales } from "./request";

const resolveMetadataBaseUrl = (): string => {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL;

  if (typeof explicit === "string" && explicit.length > 0) {
    return explicit;
  }

  const vercel = process.env.VERCEL_URL;

  if (typeof vercel === "string" && vercel.length > 0) {
    if (vercel.startsWith("http://") || vercel.startsWith("https://")) {
      return vercel;
    }

    return `https://${vercel}`;
  }

  return "http://localhost:3000";
};

const OPEN_GRAPH_LOCALE_MAP: Record<string, string> = {
  en: "en_US",
  pl: "pl_PL",
};

const PAGE_KEYS = ["home", "about", "login", "register", "activate", "forgotPassword", "resetPassword"] as const;

type PageKey = (typeof PAGE_KEYS)[number];

const isPageKey = (value: string): value is PageKey => PAGE_KEYS.includes(value as PageKey);

const resolveLocale = (locale: string): string => {
  if (locales.includes(locale as (typeof locales)[number])) {
    return locale;
  }

  return "en";
};

interface NestedMessages {
  [key: string]: string | NestedMessages;
}

const getNestedValue = (obj: NestedMessages, path: string): string => {
  const keys = path.split(".");
  let current: string | NestedMessages = obj;

  for (const key of keys) {
    if (typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return path;
    }
  }

  return typeof current === "string" ? current : path;
};

export const getRootMetadata = async (locale: string): Promise<Metadata> => {
  const safeLocale = resolveLocale(locale);
  const messages = await loadMessages(safeLocale);
  const metadata = messages.metadata as NestedMessages;
  const siteTitle = getNestedValue(metadata, "title");
  const siteDescription = getNestedValue(metadata, "description");
  const appVersion = process.env.VITE_APP_VERSION ?? process.env.PUBLIC_WEB_VERSION ?? "dev";

  return {
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`,
    },
    description: siteDescription,
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/favicon.ico",
    },
    metadataBase: new URL(resolveMetadataBaseUrl()),
    other: {
      "restorio-app-version": appVersion,
    },
    openGraph: {
      type: "website",
      siteName: siteTitle,
      locale: OPEN_GRAPH_LOCALE_MAP[safeLocale] ?? OPEN_GRAPH_LOCALE_MAP.en,
      title: siteTitle,
      description: siteDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
    },
  };
};

export const getPageMetadata = async (locale: string, pageKey: string): Promise<Metadata> => {
  const safeLocale = resolveLocale(locale);
  const safePageKey: PageKey = isPageKey(pageKey) ? pageKey : "home";
  const messages = await loadMessages(safeLocale);
  const metadata = messages.metadata as NestedMessages;

  const title = getNestedValue(metadata, `pages.${safePageKey}.title`);
  const description = getNestedValue(metadata, `pages.${safePageKey}.description`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
};
