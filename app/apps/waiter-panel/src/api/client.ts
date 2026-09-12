import { ApiClient, RestorioApi, type OrdersResource, type TenantOrdersResource } from "@restorio/api-client";
import { AUTH_LOGIN_REDIRECT_URL, TokenStorage } from "@restorio/auth";
import { resolveApiBaseUrl } from "@restorio/utils";

const apiClient = new ApiClient({
  baseURL: resolveApiBaseUrl({ preferRelativeInBrowser: true }),
  refreshPath: "auth/refresh",
  getAccessToken: (): string | null => TokenStorage.getAccessToken(),
  onUnauthorized: (): void => {
    window.location.replace(AUTH_LOGIN_REDIRECT_URL);
  },
});

export const api: RestorioApi = new RestorioApi(apiClient);

export const tenantOrdersApi: TenantOrdersResource = api.tenantOrders;

export const ordersApi: OrdersResource = api.orders;
