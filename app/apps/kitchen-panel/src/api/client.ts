import { ApiClient, RestorioApi } from "@restorio/api-client";
import { AUTH_LOGIN_REDIRECT_URL, TokenStorage } from "@restorio/auth";
import { resolveApiBaseUrl } from "@restorio/utils";

const apiClient = new ApiClient({
  baseURL: resolveApiBaseUrl({ preferRelativeInBrowser: true }),
  refreshPath: "auth/refresh",
  getAccessToken: (): string | null => TokenStorage.getAccessToken(),
  onUnauthorized: (): void => {
    window.location.href = AUTH_LOGIN_REDIRECT_URL;
  },
});

export const api = new RestorioApi(apiClient);
