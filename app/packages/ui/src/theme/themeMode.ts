import { getCrossAppValue, setCrossAppValue, THEME_STORAGE_KEY } from "@restorio/utils";

export const runThemeBootScript = (): void => {
  try {
    const root = document.documentElement;
    const storedMode = getCrossAppValue(THEME_STORAGE_KEY);
    const mode =
      storedMode === "light" || storedMode === "dark"
        ? storedMode
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    root.setAttribute("data-theme", mode);
    setCrossAppValue(THEME_STORAGE_KEY, mode);
    root.classList.toggle("dark", mode === "dark");
  } catch {
    // Ignore initialization failures and fall back to CSS defaults.
  }
};

export const getThemeBootScript = (): string => `
(() => {
  try {
    const root = document.documentElement;
    const key = ${JSON.stringify(THEME_STORAGE_KEY)};
    const getCookie = (k) => {
      const c = document.cookie.split(";").find((i) => i.trim().startsWith(k + "="));
      return c ? decodeURIComponent(c.slice(k.length + 2)) : null;
    };
    const storedMode = getCookie(key) || window.localStorage.getItem(key);
    const mode = storedMode === "light" || storedMode === "dark"
      ? storedMode
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.setAttribute("data-theme", mode);
    root.classList.toggle("dark", mode === "dark");
  } catch {
  }
})();
`;
