import { useMediaQuery } from "./useMediaQuery";

export const usePrefersReducedMotion = (): boolean => {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
};
