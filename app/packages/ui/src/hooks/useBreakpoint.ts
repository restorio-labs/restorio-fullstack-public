import { useMediaQuery } from "./useMediaQuery";

export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

const breakpointQueries: Record<Breakpoint, string> = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
};

export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  return useMediaQuery(breakpointQueries[breakpoint]);
};

export const useBreakpointUp = (): Breakpoint | null => {
  const is2xl = useMediaQuery(breakpointQueries["2xl"]);
  const isXl = useMediaQuery(breakpointQueries.xl);
  const isLg = useMediaQuery(breakpointQueries.lg);
  const isMd = useMediaQuery(breakpointQueries.md);
  const isSm = useMediaQuery(breakpointQueries.sm);

  if (is2xl) {
    return "2xl";
  }

  if (isXl) {
    return "xl";
  }

  if (isLg) {
    return "lg";
  }

  if (isMd) {
    return "md";
  }

  if (isSm) {
    return "sm";
  }

  return null;
};
