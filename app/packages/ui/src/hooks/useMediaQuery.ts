import { useEffect, useState } from "react";

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia(query);

      setMatches(mediaQuery.matches);

      const handleChange = (event: MediaQueryListEvent): void => {
        setMatches(event.matches);
      };

      mediaQuery.addEventListener("change", handleChange);

      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    } catch {
      return;
    }
  }, [query]);

  return matches;
};
