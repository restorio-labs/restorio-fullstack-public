"use client";

import { useI18n } from "@restorio/ui";
import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";

type TranslationValues = Record<string, string | number | undefined>;
type RichTagFunction = (chunks: ReactNode) => ReactNode;
type RichValues = Record<string, RichTagFunction | string | number>;

interface TranslatorFunction {
  (key: string, values?: TranslationValues): string;
  rich: (key: string, values?: RichValues) => ReactNode;
  raw: (key: string) => unknown;
}

const resolveNestedMessage = (messages: Record<string, unknown>, key: string): unknown => {
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[part];
  }, messages);
};

export function useT(namespace?: string): TranslatorFunction {
  const { t: translate, messages } = useI18n();

  const t = useCallback(
    (key: string, values?: TranslationValues): string => {
      const fullKey = namespace ? `${namespace}.${key}` : key;

      return translate(fullKey, values);
    },
    [translate, namespace],
  );

  const rich = useCallback(
    (key: string, values?: RichValues): ReactNode => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      const message = translate(fullKey);

      if (!values) {
        return message;
      }

      const parts: ReactNode[] = [];
      let remaining = message;
      let keyIndex = 0;

      remaining = remaining.replace(/<(\w+)\s*\/>/g, (_match, tagName: string) => {
        const handler = values[tagName];

        if (typeof handler === "function") {
          return `__SELF_CLOSE_${tagName}__`;
        }

        return _match;
      });
      remaining = remaining.replace(/<(\w+)><\/\1>/g, (_match, tagName: string) => {
        const handler = values[tagName];

        if (typeof handler === "function") {
          return `__SELF_CLOSE_${tagName}__`;
        }

        return _match;
      });

      const tagRegex = /<(\w+)>(.*?)<\/\1>/g;
      let lastIndex = 0;
      let match;

      while ((match = tagRegex.exec(remaining)) !== null) {
        if (match.index > lastIndex) {
          parts.push(remaining.slice(lastIndex, match.index));
        }

        const [, tagName, content] = match;
        const handler = values[tagName];

        if (typeof handler === "function") {
          parts.push(<span key={keyIndex++}>{handler(content)}</span>);
        } else {
          parts.push(match[0]);
        }

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < remaining.length) {
        parts.push(remaining.slice(lastIndex));
      }

      const processedParts = parts.map((part, idx) => {
        if (typeof part === "string") {
          const selfCloseRegex = /__SELF_CLOSE_(\w+)__/g;
          const subParts: ReactNode[] = [];
          let subLastIndex = 0;
          let subMatch;

          while ((subMatch = selfCloseRegex.exec(part)) !== null) {
            if (subMatch.index > subLastIndex) {
              subParts.push(part.slice(subLastIndex, subMatch.index));
            }
            const tagName = subMatch[1];
            const handler = values[tagName];

            if (typeof handler === "function") {
              // eslint-disable-next-line react/no-array-index-key -- composite key with subLastIndex is unique
              subParts.push(<span key={`${idx}-${subLastIndex}`}>{handler(null)}</span>);
            }
            subLastIndex = subMatch.index + subMatch[0].length;
          }

          if (subLastIndex < part.length) {
            subParts.push(part.slice(subLastIndex));
          }

          return subParts.length > 0 ? subParts : part;
        }

        return part;
      });

      return <>{processedParts.flat()}</>;
    },
    [translate, namespace],
  );

  const raw = useCallback(
    (key: string): unknown => {
      const fullKey = namespace ? `${namespace}.${key}` : key;

      return resolveNestedMessage(messages, fullKey);
    },
    [messages, namespace],
  );

  return useMemo(() => {
    const translator = t as TranslatorFunction;

    translator.rich = rich;
    translator.raw = raw;

    return translator;
  }, [t, rich, raw]);
}

export function useTranslations(namespace?: string): TranslatorFunction {
  return useT(namespace);
}

export function useLocale(): string {
  const { locale } = useI18n();

  return locale;
}
