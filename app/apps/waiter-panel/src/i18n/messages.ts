import type { Messages } from "@restorio/ui";

import en from "../locales/en.json";
import pl from "../locales/pl.json";

export const supportedLocales = ["en", "pl"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "pl";

export const messagesByLocale: Record<SupportedLocale, Messages> = {
  en,
  pl,
};

export const defaultMessages = messagesByLocale[defaultLocale];
export const fallbackMessages = messagesByLocale.en;

export const getMessages = (locale: string): Messages => {
  if (locale in messagesByLocale) {
    return messagesByLocale[locale as SupportedLocale];
  }

  return defaultMessages;
};
