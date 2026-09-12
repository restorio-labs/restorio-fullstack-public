import { colorTokens } from "../tokens/colors";
import type { ThemeColorOverrideSlice, ThemeOverride } from "../tokens/types";

import { buildSansFontFamilyFromGoogleFontUrl } from "./googleFonts";

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const mergeStatusOverrideSlices = (
  a?: Record<string, unknown>,
  b?: Record<string, unknown>,
): Record<string, unknown> | undefined => {
  if (!a && !b) {
    return undefined;
  }

  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  const out: Record<string, unknown> = {};

  for (const k of keys) {
    const av = a?.[k];
    const bv = b?.[k];

    if (isPlainRecord(av) && isPlainRecord(bv)) {
      out[k] = { ...av, ...bv };
    } else if (bv !== undefined) {
      out[k] = bv;
    } else if (av !== undefined) {
      out[k] = av;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
};

export const mergeColorOverrideSlices = (
  legacy?: ThemeColorOverrideSlice,
  modeSpecific?: ThemeColorOverrideSlice,
): ThemeColorOverrideSlice | undefined => {
  if (!legacy && !modeSpecific) {
    return undefined;
  }

  const keys = [
    ...new Set([...Object.keys(legacy ?? {}), ...Object.keys(modeSpecific ?? {})]),
  ] as (keyof ThemeColorOverrideSlice)[];

  const out: Record<string, unknown> = {};

  for (const key of keys) {
    const a = legacy?.[key];
    const b = modeSpecific?.[key];

    if (a === undefined && b === undefined) {
      continue;
    }

    if (key === "status" && (isPlainRecord(a) || isPlainRecord(b))) {
      const merged = mergeStatusOverrideSlices(
        a as Record<string, unknown> | undefined,
        b as Record<string, unknown> | undefined,
      );

      if (merged) {
        out.status = merged;
      }

      continue;
    }

    if (isPlainRecord(a) && isPlainRecord(b)) {
      out[key as string] = { ...a, ...b };
    } else if (b !== undefined) {
      out[key as string] = b;
    } else if (a !== undefined) {
      out[key as string] = a;
    }
  }

  return Object.keys(out).length > 0 ? (out as ThemeColorOverrideSlice) : undefined;
};

export const resolveThemeOverrideForMode = (
  override: ThemeOverride | null,
  mode: "light" | "dark",
): ThemeOverride | null => {
  if (!override) {
    return null;
  }

  const modeSlice = mode === "light" ? override.colorsLight : override.colorsDark;
  const mergedColors = mergeColorOverrideSlices(override.colors, modeSlice);
  const { colorsLight: _colorsLight, colorsDark: _colorsDark, colors: _legacyColors, ...rest } = override;
  const next: ThemeOverride = { ...rest };

  if (mergedColors) {
    next.colors = mergedColors;
  }

  const hasColors = !!(next.colors && Object.keys(next.colors).length > 0);
  const hasRest = [next.typography, next.spacing, next.radius, next.shadows, next.zIndex].some(Boolean);

  if (!hasColors && !hasRest) {
    return null;
  }

  if (!hasColors) {
    delete next.colors;
  }

  return next;
};

export const flattenColorTokensToCSSVariables = (
  obj: Record<string, unknown>,
  prefix = "",
  result: Record<string, string> = {},
): Record<string, string> => {
  for (const [key, value] of Object.entries(obj)) {
    const cssKey = `--color-${prefix ? `${prefix}-` : ""}${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;

    if (typeof value === "string") {
      result[cssKey] = value;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      flattenColorTokensToCSSVariables(value as Record<string, unknown>, prefix ? `${prefix}-${key}` : key, result);
    }
  }

  return result;
};

export const getBaseColorCSSVariables = (mode: "light" | "dark"): Record<string, string> => {
  const theme = mode === "dark" ? colorTokens.dark : colorTokens.light;

  return flattenColorTokensToCSSVariables(theme as unknown as Record<string, unknown>);
};

export const flattenToCSSVariables = (
  obj: Record<string, unknown>,
  prefix = "",
  result: Record<string, string> = {},
): Record<string, string> => {
  for (const [key, value] of Object.entries(obj)) {
    const cssKey = prefix
      ? `--${prefix}-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`
      : `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;

    if (typeof value === "string") {
      result[cssKey] = value;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      flattenToCSSVariables(value as Record<string, unknown>, prefix ? `${prefix}-${key}` : key, result);
    }
  }

  return result;
};

export const generateCSSVariables = (override: ThemeOverride): Record<string, string> => {
  const variables: Record<string, string> = {};

  if (override.colors) {
    Object.assign(variables, flattenToCSSVariables(override.colors, "color"));
  }

  if (override.spacing) {
    Object.assign(variables, flattenToCSSVariables(override.spacing, "spacing"));
  }

  if (override.radius) {
    Object.assign(variables, flattenToCSSVariables(override.radius, "radius"));
  }

  if (override.typography) {
    if (override.typography.fontFamily) {
      const { googleFontUrl, sans, mono, ...rest } = override.typography.fontFamily;
      const fontFamilyVars: Record<string, string> = {};
      const sansFromGoogle =
        typeof googleFontUrl === "string" ? buildSansFontFamilyFromGoogleFontUrl(googleFontUrl) : null;
      const resolvedSans = sans ?? sansFromGoogle;

      if (resolvedSans) {
        fontFamilyVars.sans = resolvedSans;
      }

      if (mono) {
        fontFamilyVars.mono = mono;
      }

      for (const [key, value] of Object.entries(rest)) {
        if (typeof value === "string" && value.length > 0) {
          fontFamilyVars[key] = value;
        }
      }

      Object.assign(variables, flattenToCSSVariables(fontFamilyVars, "font-family"));
    }

    if (override.typography.fontSize) {
      Object.assign(variables, flattenToCSSVariables(override.typography.fontSize, "font-size"));
    }

    if (override.typography.fontWeight) {
      Object.assign(variables, flattenToCSSVariables(override.typography.fontWeight, "font-weight"));
    }
  }

  if (override.shadows) {
    Object.assign(variables, flattenToCSSVariables(override.shadows, "shadow"));
  }

  if (override.zIndex) {
    Object.assign(variables, flattenToCSSVariables(override.zIndex, "z-index"));
  }

  return variables;
};

export const buildScopedThemeStyle = (
  mode: "light" | "dark",
  override: ThemeOverride | null,
): Record<string, string> => {
  const base = getBaseColorCSSVariables(mode);
  const resolved = resolveThemeOverrideForMode(override, mode);

  if (!resolved) {
    return base;
  }

  return { ...base, ...generateCSSVariables(resolved) };
};
