import { getCrossAppValue } from "../storage";

interface ResolveLocaleOptions {
  supportedLocales: readonly string[];
  defaultLocale: string;
  storageKey?: string;
}

const normalizeLocale = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  return value.split("-")[0].toLowerCase();
};

export const resolveLocale = ({ supportedLocales, defaultLocale, storageKey }: ResolveLocaleOptions): string => {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  const storedLocale = storageKey ? getCrossAppValue(storageKey) : null;
  const documentLocale = document.documentElement.lang;
  const browserLocale = navigator.language;

  const candidate = normalizeLocale(storedLocale) ?? normalizeLocale(documentLocale) ?? normalizeLocale(browserLocale);

  if (candidate && supportedLocales.includes(candidate)) {
    return candidate;
  }

  return defaultLocale;
};
