import { createContext, useCallback, useContext, useMemo } from "react";
import type { ReactElement, ReactNode } from "react";

export type TranslationValues = Record<string, string | number | undefined>;
export type Messages = Record<string, unknown>;

interface I18nContextValue {
  locale: string;
  messages: Messages;
  t: (key: string, defaultMessageOrValues?: string | TranslationValues, values?: TranslationValues) => string;
  setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const resolveMessage = (messages: Messages, key: string): unknown => {
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    const record = current as Record<string, unknown>;

    return record[part];
  }, messages);
};

const formatMessage = (message: string, values?: TranslationValues): string => {
  if (!values) {
    return message;
  }

  return message.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    const replacement = values[key];

    return replacement === undefined ? "" : String(replacement);
  });
};

export const createTranslator = (messages: Messages, fallbackMessages?: Messages) => {
  return (key: string, defaultMessageOrValues?: string | TranslationValues, values?: TranslationValues): string => {
    let defaultMessage: string | undefined;
    let actualValues: TranslationValues | undefined;

    if (typeof defaultMessageOrValues === "string") {
      defaultMessage = defaultMessageOrValues;
      actualValues = values;
    } else {
      actualValues = defaultMessageOrValues;
    }

    const message = resolveMessage(messages, key);
    const fallbackMessage = fallbackMessages ? resolveMessage(fallbackMessages, key) : undefined;

    if (typeof message === "string") {
      return formatMessage(message, actualValues);
    }

    if (typeof fallbackMessage === "string") {
      return formatMessage(fallbackMessage, actualValues);
    }

    return defaultMessage ?? key;
  };
};

interface I18nProviderProps {
  locale: string;
  messages: Messages;
  fallbackMessages?: Messages;
  setLocale?: (locale: string) => void;
  children: ReactNode;
}

export const I18nProvider = ({
  locale,
  messages,
  fallbackMessages,
  setLocale: setLocaleProp,
  children,
}: I18nProviderProps): ReactElement => {
  const t = useMemo(() => createTranslator(messages, fallbackMessages), [fallbackMessages, messages]);
  const setLocale = useCallback(
    (nextLocale: string): void => {
      if (typeof nextLocale === "string" && nextLocale.trim() !== "") {
        setLocaleProp?.(nextLocale);
      }
    },
    [setLocaleProp],
  );
  const value = useMemo(() => ({ locale, messages, t, setLocale }), [locale, messages, t, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("I18nProvider is missing");
  }

  return context;
};
