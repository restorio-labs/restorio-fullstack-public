import type { ThemeOverride } from "../tokens/types";

export const parseGoogleFontFamiliesFromStylesheetUrl = (url: string): string[] => {
  try {
    const parsed = new URL(url.trim());

    if (parsed.hostname !== "fonts.googleapis.com") {
      return [];
    }

    const families: string[] = [];

    parsed.searchParams.forEach((value, key) => {
      if (key !== "family") {
        return;
      }

      const name = value.split(":")[0]?.replace(/\+/g, " ").trim();

      if (name) {
        families.push(name);
      }
    });

    return families;
  } catch {
    return [];
  }
};

export const buildSansFontFamilyFromGoogleFontUrl = (url: string): string | null => {
  const families = parseGoogleFontFamiliesFromStylesheetUrl(url);

  if (families.length === 0) {
    return null;
  }

  const quoted = families.map((family) => (family.includes(" ") ? `"${family}"` : family));

  return [...quoted, "sans-serif"].join(", ");
};

export const resolveGoogleFontStylesheetHref = (override: ThemeOverride | null): string | undefined => {
  const fontFamily = override?.typography?.fontFamily as Record<string, string | undefined> | undefined;
  const url = fontFamily?.googleFontUrl?.trim();

  return url || undefined;
};
