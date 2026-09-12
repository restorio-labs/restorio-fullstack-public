import { ApiClient, RestorioApi } from "@restorio/api-client";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

const API_BASE_URL =
  typeof window !== "undefined" && LOCAL_HOSTNAMES.has(window.location.hostname)
    ? "/api/v1"
    : "https://api.restorio.org/api/v1";

const accessTokenRef: { current: string | null } = { current: null };

const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
  getAccessToken: (): string | null => accessTokenRef.current,
  refreshPath: "auth/refresh",
});

export const api = new RestorioApi(apiClient);

export const setAccessToken: (token: string | null) => void = (token) => {
  accessTokenRef.current = token;
};
