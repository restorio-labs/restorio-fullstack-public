export const spacingTokens = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
  40: "10rem",
  48: "12rem",
  64: "16rem",
} as const;

export const spacingScale = {
  xs: spacingTokens[1],
  sm: spacingTokens[2],
  md: spacingTokens[4],
  lg: spacingTokens[6],
  xl: spacingTokens[8],
  "2xl": spacingTokens[12],
  "3xl": spacingTokens[16],
  "4xl": spacingTokens[24],
} as const;

export type SpacingToken = keyof typeof spacingTokens;
export type SpacingScale = keyof typeof spacingScale;
