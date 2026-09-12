import { TokenStorage } from "@restorio/auth";

interface JwtPayload {
  readonly sub?: string;
  readonly tenant_ids?: unknown;
  readonly account_type?: string;
}

export const decodeAccessTokenPayload = (): JwtPayload | null => {
  const token = TokenStorage.getAccessToken();

  if (token === null || token === "") {
    return null;
  }

  const codePattern = /^\d{3}-\d{3}$/;

  if (codePattern.test(token)) {
    return null;
  }

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
};

export const getPublicTenantIdsFromAccessToken = (): string[] => {
  const raw = decodeAccessTokenPayload()?.tenant_ids;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
};

export const isAdminPanelAccountType = (accountType: string | undefined): boolean => {
  return accountType === "owner" || accountType === "manager";
};
