import { APP_SLUGS, type AppSlug } from "@restorio/types";

const APP_ALLOWED_ROLES: Partial<Record<AppSlug, readonly string[]>> = {
  "admin-panel": ["super_admin", "admin", "owner", "manager"],
  "waiter-panel": ["super_admin", "admin", "owner", "manager", "waiter"],
  "kitchen-panel": ["super_admin", "admin", "owner", "manager", "kitchen"],
};

const isAppSlug = (value: string): value is AppSlug => {
  return (APP_SLUGS as readonly string[]).includes(value);
};

export const canAccessApp = (accountType: string | null, appSlug: AppSlug): boolean => {
  const allowedRoles = APP_ALLOWED_ROLES[appSlug];

  if (allowedRoles === undefined) {
    return false;
  }

  if (accountType === null || accountType === "") {
    return appSlug === "admin-panel";
  }

  return allowedRoles.includes(accountType);
};

export const resolveDefaultAppForAccountType = (accountType: string | null): AppSlug => {
  if (accountType === "kitchen") {
    return "kitchen-panel";
  }

  if (accountType === "waiter") {
    return "waiter-panel";
  }

  return "admin-panel";
};

export const resolveAuthenticatedAppRedirect = (
  accountType: string | null,
  lastVisitedApp?: string | null,
): AppSlug => {
  if (
    typeof lastVisitedApp === "string" &&
    isAppSlug(lastVisitedApp) &&
    lastVisitedApp !== "public-web" &&
    canAccessApp(accountType, lastVisitedApp)
  ) {
    return lastVisitedApp;
  }

  return resolveDefaultAppForAccountType(accountType);
};
