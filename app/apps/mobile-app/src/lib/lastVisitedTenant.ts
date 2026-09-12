export const LAST_VISITED_TENANT_PATH_KEY = "rlvt";

export const persistLastVisitedTenantPath = (pathname: string): void => {
  if (!pathname || pathname === "/") {
    return;
  }

  if (pathname.includes("..") || !pathname.startsWith("/")) {
    return;
  }

  window.localStorage.setItem(LAST_VISITED_TENANT_PATH_KEY, pathname);
};

export const readLastVisitedTenantPath = (): string | null => {
  const raw = window.localStorage.getItem(LAST_VISITED_TENANT_PATH_KEY);

  if (!raw || raw === "/" || raw.includes("..") || !raw.startsWith("/")) {
    return null;
  }

  return raw;
};
