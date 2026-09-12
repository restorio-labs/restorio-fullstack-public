export const locales = ["en", "pl"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pl";

export async function loadMessages(locale: string): Promise<Record<string, unknown>> {
  try {
    const messagesModule = (await import(`../locales/${locale}.json`)) as { default: Record<string, unknown> };

    return messagesModule.default;
  } catch {
    return {};
  }
}
