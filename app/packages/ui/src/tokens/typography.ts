export const typographyTokens = {
  fontFamily: {
    sans: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(", "),
    mono: ["ui-monospace", "SFMono-Regular", '"SF Mono"', "Menlo", "Consolas", '"Liberation Mono"', "monospace"].join(
      ", ",
    ),
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],
    sm: ["0.875rem", { lineHeight: "1.25rem" }],
    base: ["1rem", { lineHeight: "1.5rem" }],
    lg: ["1.125rem", { lineHeight: "1.75rem" }],
    xl: ["1.25rem", { lineHeight: "1.75rem" }],
    "2xl": ["1.5rem", { lineHeight: "2rem" }],
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
    "5xl": ["3rem", { lineHeight: "1" }],
    "6xl": ["3.75rem", { lineHeight: "1" }],
  },
  fontWeight: {
    light: "300",
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },
} as const;

export const typographySemantic = {
  heading: {
    h1: {
      fontSize: typographyTokens.fontSize["4xl"][0],
      lineHeight: typographyTokens.fontSize["4xl"][1].lineHeight,
      fontWeight: typographyTokens.fontWeight.bold,
      letterSpacing: typographyTokens.letterSpacing.tight,
    },
    h2: {
      fontSize: typographyTokens.fontSize["3xl"][0],
      lineHeight: typographyTokens.fontSize["3xl"][1].lineHeight,
      fontWeight: typographyTokens.fontWeight.bold,
      letterSpacing: typographyTokens.letterSpacing.tight,
    },
    h3: {
      fontSize: typographyTokens.fontSize["2xl"][0],
      lineHeight: typographyTokens.fontSize["2xl"][1].lineHeight,
      fontWeight: typographyTokens.fontWeight.semibold,
      letterSpacing: typographyTokens.letterSpacing.normal,
    },
    h4: {
      fontSize: typographyTokens.fontSize.xl[0],
      lineHeight: typographyTokens.fontSize.xl[1].lineHeight,
      fontWeight: typographyTokens.fontWeight.semibold,
      letterSpacing: typographyTokens.letterSpacing.normal,
    },
    h5: {
      fontSize: typographyTokens.fontSize.lg[0],
      lineHeight: typographyTokens.fontSize.lg[1].lineHeight,
      fontWeight: typographyTokens.fontWeight.medium,
      letterSpacing: typographyTokens.letterSpacing.normal,
    },
    h6: {
      fontSize: typographyTokens.fontSize.base[0],
      lineHeight: typographyTokens.fontSize.base[1].lineHeight,
      fontWeight: typographyTokens.fontWeight.medium,
      letterSpacing: typographyTokens.letterSpacing.normal,
    },
  },
  body: {
    large: {
      fontSize: typographyTokens.fontSize.lg[0],
      lineHeight: typographyTokens.fontSize.lg[1].lineHeight,
      fontWeight: typographyTokens.fontWeight.normal,
    },
    base: {
      fontSize: typographyTokens.fontSize.base[0],
      lineHeight: typographyTokens.fontSize.base[1].lineHeight,
      fontWeight: typographyTokens.fontWeight.normal,
    },
    small: {
      fontSize: typographyTokens.fontSize.sm[0],
      lineHeight: typographyTokens.fontSize.sm[1].lineHeight,
      fontWeight: typographyTokens.fontWeight.normal,
    },
  },
  label: {
    fontSize: typographyTokens.fontSize.sm[0],
    lineHeight: typographyTokens.fontSize.sm[1].lineHeight,
    fontWeight: typographyTokens.fontWeight.medium,
  },
  caption: {
    fontSize: typographyTokens.fontSize.xs[0],
    lineHeight: typographyTokens.fontSize.xs[1].lineHeight,
    fontWeight: typographyTokens.fontWeight.normal,
  },
} as const;

export type TypographyToken = keyof typeof typographyTokens;

export type TypographySemantic = keyof typeof typographySemantic;
