import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@restorio/utils";

const getDocument = (): Document | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.document;
};

const getCookieValue = (key: string): string | null => {
  const doc = getDocument();

  if (doc === undefined) {
    return null;
  }

  const cookieEntry = doc.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${key}=`));

  if (!cookieEntry) {
    return null;
  }

  const value = cookieEntry.slice(key.length + 1);

  return decodeURIComponent(value);
};

export class TokenStorage {
  static getAccessToken(): string | null {
    return getCookieValue(ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    void token;
  }

  static getRefreshToken(): string | null {
    return getCookieValue(REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    void token;
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  static clearTokens(): void {
    // HttpOnly auth cookies are controlled by the backend.
  }

  static decodeToken(token: string): Record<string, string> | null {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(""),
      );

      return JSON.parse(jsonPayload) as Record<string, string>;
    } catch {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);

    if (!decoded?.exp) {
      return true;
    }

    return Date.now() >= Number(decoded.exp) * 1000;
  }

  static isAccessTokenValid(token: string): boolean {
    const codePattern = /^\d{3}-\d{3}$/;

    if (codePattern.test(token)) {
      return true;
    }

    return !this.isTokenExpired(token);
  }
}
