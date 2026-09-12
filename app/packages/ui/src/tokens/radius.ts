export const radiusTokens = {
  none: "0",
  sm: "0.5rem",
  default: "1rem",
  md: "1.5rem",
  lg: "2rem",
  xl: "3rem",
  "2xl": "4rem",
  "3xl": "5rem",
  full: "9999px",
} as const;

export const radiusSemantic = {
  button: radiusTokens.xl,
  card: radiusTokens.default,
  modal: radiusTokens.lg,
  input: radiusTokens.md,
  badge: radiusTokens.full,
  tooltip: radiusTokens.sm,
} as const;

export type RadiusToken = keyof typeof radiusTokens;
export type RadiusSemantic = keyof typeof radiusSemantic;
