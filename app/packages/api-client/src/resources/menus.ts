import type { SaveTenantMenuPayload, SuccessResponse, TenantMenu, UpdatedResponse } from "@restorio/types";

import { BaseResource } from "./base";

interface ErrorWithStatusCode {
  response?: {
    status?: number;
  };
}

export interface MenuImagePresignResponse {
  uploadUrl: string;
  objectKey: string;
}

export interface MenuImageFinalizeResponse {
  imageUrl: string;
}

export class MenusResource extends BaseResource {
  async get(tenantId: string, signal?: AbortSignal): Promise<TenantMenu | null> {
    try {
      const response = await this.client.get<SuccessResponse<TenantMenu | null>>(`/tenants/${tenantId}/menu`, {
        signal,
      });

      return response.data;
    } catch (error) {
      if ((error as ErrorWithStatusCode).response?.status === 404) {
        return null;
      }

      throw error;
    }
  }

  async save(tenantId: string, data: SaveTenantMenuPayload, signal?: AbortSignal): Promise<TenantMenu> {
    const response = await this.client.put<UpdatedResponse<TenantMenu>>(`/tenants/${tenantId}/menu`, data, { signal });

    return response.data;
  }

  async toggleItemAvailability(
    tenantId: string,
    categoryOrder: number,
    itemName: string,
    isAvailable: boolean,
    signal?: AbortSignal,
  ): Promise<TenantMenu> {
    const response = await this.client.patch<UpdatedResponse<TenantMenu>>(
      `/tenants/${tenantId}/menu/categories/${categoryOrder}/items/${encodeURIComponent(itemName)}/availability`,
      { isAvailable },
      { signal },
    );

    return response.data;
  }

  async presignImage(tenantId: string, contentType: string, signal?: AbortSignal): Promise<MenuImagePresignResponse> {
    const response = await this.client.post<SuccessResponse<MenuImagePresignResponse>, { contentType: string }>(
      `/tenants/${tenantId}/menu/images/presign`,
      { contentType },
      { signal },
    );

    return response.data;
  }

  async finalizeImage(tenantId: string, objectKey: string, signal?: AbortSignal): Promise<MenuImageFinalizeResponse> {
    const response = await this.client.post<SuccessResponse<MenuImageFinalizeResponse>, { objectKey: string }>(
      `/tenants/${tenantId}/menu/images/finalize`,
      { objectKey },
      { signal },
    );

    return response.data;
  }
}
