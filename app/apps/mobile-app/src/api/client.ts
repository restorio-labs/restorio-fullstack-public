import { ApiClient, RestorioApi } from "@restorio/api-client";

import { API_BASE_URL } from "../config";

const apiClient = new ApiClient({
  baseURL: API_BASE_URL,
});

export const api = new RestorioApi(apiClient);

export const { publicApi } = api;
