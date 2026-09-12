import { getCrossAppValue, setCrossAppValue } from "@restorio/utils";
import { createContext, useContext, useEffect, useState, useMemo } from "react";

import { colorTokens } from "../tokens/colors";
import type { ThemeMode, ThemeOverride, Direction } from "../tokens/types";

import { generateCSSVariables, resolveThemeOverrideForMode } from "./cssVariables";

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setMode: (mode: ThemeMode) => void;
  override: ThemeOverride | null;
  setOverride: (override: ThemeOverride | null) => void;
  colors: typeof colorTokens.light | typeof colorTokens.dark;
  direction: "ltr" | "rtl";
  setDirection: (direction: Direction) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  initialOverride?: ThemeOverride;
  defaultDirection?: Direction;
  storageKey?: string;
}

const isStoredMode = (value: string | null): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

const getInitialMode = (defaultMode: ThemeMode, storageKey: string): ThemeMode => {
  if (typeof window === "undefined" || storageKey.trim() === "") {
    return defaultMode;
  }

  try {
    const storedMode = getCrossAppValue(storageKey);

    if (storedMode === "light" || storedMode === "dark") {
      return storedMode;
    }

    const fallbackMode = defaultMode === "system" ? getSystemTheme() : defaultMode;

    if (!isStoredMode(storedMode) || storedMode === "system") {
      setCrossAppValue(storageKey, fallbackMode);
    }

    return fallbackMode;
  } catch {
    return defaultMode === "system" ? getSystemTheme() : defaultMode;
  }
};

export const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    return mediaQuery.matches ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const getSystemDirection = (): "ltr" | "rtl" => {
  if (typeof window === "undefined") {
    return "ltr";
  }

  try {
    const lang = document.documentElement.lang || navigator.language;
    const rtlLanguages = ["he", "fa", "ur", "yi"];
    const langCode = lang.split("-")[0].toLowerCase();

    return rtlLanguages.includes(langCode) ? "rtl" : "ltr";
  } catch {
    return "ltr";
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = "system",
  initialOverride = null,
  defaultDirection = "auto",
  storageKey = "",
}) => {
  const [mode, setModeState] = useState<ThemeMode>(() => getInitialMode(defaultMode, storageKey));
  const [override, setOverrideState] = useState<ThemeOverride | null>(initialOverride);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme());
  const [directionState, setDirectionState] = useState<Direction>(defaultDirection);
  const [systemDirection, setSystemDirection] = useState<"ltr" | "rtl">(getSystemDirection());

  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined") {
      return;
    }

    try {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent): void => {
        setSystemTheme(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);

      return (): void => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    } catch {
      // Ignore errors in SSR or unsupported environments
    }
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined" || storageKey.trim() === "") {
      return;
    }

    try {
      const storedMode = mode === "system" ? getSystemTheme() : mode;

      setCrossAppValue(storageKey, storedMode);
    } catch {
      // Ignore storage errors in unsupported environments
    }
  }, [mode, storageKey]);

  const resolvedMode = useMemo(() => {
    if (mode === "system") {
      return systemTheme;
    }

    return mode;
  }, [mode, systemTheme]);

  const direction = useMemo(() => {
    if (directionState === "auto") {
      return systemDirection;
    }

    return directionState;
  }, [directionState, systemDirection]);

  useEffect(() => {
    try {
      const root = document.documentElement;

      root.setAttribute("data-theme", resolvedMode);
      root.classList.toggle("dark", resolvedMode === "dark");
      root.setAttribute("dir", direction);

      const applied = resolveThemeOverrideForMode(override, resolvedMode);

      if (applied) {
        const cssVars = generateCSSVariables(applied);

        for (const [key, value] of Object.entries(cssVars)) {
          root.style.setProperty(key, value);
        }
      }
    } catch {
      // Ignore errors in SSR or unsupported environments
    }
  }, [resolvedMode, override, direction]);

  const setMode = (newMode: ThemeMode): void => {
    setModeState(newMode);
  };

  const setOverride = (newOverride: ThemeOverride | null): void => {
    setOverrideState(newOverride);
  };

  const setDirection = (newDirection: Direction): void => {
    setDirectionState(newDirection);

    if (newDirection === "auto") {
      setSystemDirection(getSystemDirection());
    }
  };

  const colors = useMemo(() => {
    const baseColors = resolvedMode === "dark" ? colorTokens.dark : colorTokens.light;
    const applied = resolveThemeOverrideForMode(override, resolvedMode);

    if (!applied?.colors) {
      return baseColors;
    }

    const merged = {
      background: { ...baseColors.background },
      surface: { ...baseColors.surface },
      border: { ...baseColors.border },
      text: { ...baseColors.text },
      interactive: { ...baseColors.interactive },
      status: {
        error: { ...baseColors.status.error },
        success: { ...baseColors.status.success },
        warning: { ...baseColors.status.warning },
        info: { ...baseColors.status.info },
        promoted: { ...baseColors.status.promoted },
      },
    };

    if (applied.colors.background) {
      Object.assign(merged.background, applied.colors.background);
    }

    if (applied.colors.surface) {
      Object.assign(merged.surface, applied.colors.surface);
    }

    if (applied.colors.border) {
      Object.assign(merged.border, applied.colors.border);
    }

    if (applied.colors.text) {
      Object.assign(merged.text, applied.colors.text);
    }

    if (applied.colors.interactive) {
      Object.assign(merged.interactive, applied.colors.interactive);
    }

    if (applied.colors.status) {
      const patch = applied.colors.status;

      for (const sub of ["error", "success", "warning", "info", "promoted"] as const) {
        const partial = patch[sub];

        if (partial && typeof partial === "object") {
          Object.assign(merged.status[sub], partial);
        }
      }
    }

    return merged as typeof baseColors;
  }, [resolvedMode, override]);

  const value: ThemeContextValue = useMemo(
    () => ({
      mode,
      resolvedMode,
      setMode,
      override,
      setOverride,
      colors,
      direction,
      setDirection,
    }),
    [mode, resolvedMode, override, colors, direction],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
