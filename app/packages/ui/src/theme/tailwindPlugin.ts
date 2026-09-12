import type { PluginCreator } from "tailwindcss/types/config";

import { colorTokens } from "../tokens/colors";
import { typographyTokens } from "../tokens/typography";

import { flattenColorTokensToCSSVariables } from "./cssVariables";

export const themePlugin: PluginCreator = ({ addBase }) => {
  const lightVars = flattenColorTokensToCSSVariables(colorTokens.light as unknown as Record<string, unknown>);
  const darkVars = flattenColorTokensToCSSVariables(colorTokens.dark as unknown as Record<string, unknown>);
  const fontFamilyVars = {
    "--font-family-sans": typographyTokens.fontFamily.sans,
    "--font-family-mono": typographyTokens.fontFamily.mono,
  };

  addBase({
    ":root": { ...lightVars, ...fontFamilyVars },
    '[data-theme="dark"]': darkVars,
    ".dark": darkVars,
  });
};
