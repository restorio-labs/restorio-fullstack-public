import type {
  SuccessResponse,
  TenantMobileConfig,
  UpdatedResponse,
  UpdateTenantMobileConfigPayload,
} from "@restorio/types";

import { BaseResource } from "./base";

export interface TenantMobileFaviconPresignResponse {
  uploadUrl: string;
  objectKey: string;
}

export interface TenantMobileMenuImageFinalizeResponse {
  imageUrl: string;
}

export class TenantMobileConfigResource extends BaseResource {
  async get(tenantId: string, signal?: AbortSignal): Promise<TenantMobileConfig> {
    const body = await this.client.get<SuccessResponse<TenantMobileConfig>>(`/tenants/${tenantId}/mobile-config`, {
      signal,
    });

    return body.data;
  }

  async update(
    tenantId: string,
    data: UpdateTenantMobileConfigPayload,
    signal?: AbortSignal,
  ): Promise<TenantMobileConfig> {
    const body = await this.client.put<UpdatedResponse<TenantMobileConfig>>(
      `/tenants/${tenantId}/mobile-config`,
      data,
      { signal },
    );

    return body.data;
  }

  async presignFavicon(
    tenantId: string,
    contentType: string,
    signal?: AbortSignal,
  ): Promise<TenantMobileFaviconPresignResponse> {
    const body = await this.client.post<SuccessResponse<TenantMobileFaviconPresignResponse>, { contentType: string }>(
      `/tenants/${tenantId}/mobile-config/favicon/presign`,
      { contentType },
      { signal },
    );

    return body.data;
  }

  async finalizeFavicon(tenantId: string, objectKey: string, signal?: AbortSignal): Promise<TenantMobileConfig> {
    const body = await this.client.post<UpdatedResponse<TenantMobileConfig>, { objectKey: string }>(
      `/tenants/${tenantId}/mobile-config/favicon/finalize`,
      { objectKey },
      { signal },
    );

    return body.data;
  }

  async copyThemeFrom(
    tenantId: string,
    sourceTenantPublicId: string,
    signal?: AbortSignal,
  ): Promise<TenantMobileConfig> {
    const body = await this.client.post<UpdatedResponse<TenantMobileConfig>, { sourceTenantPublicId: string }>(
      `/tenants/${tenantId}/mobile-config/theme/copy-from`,
      { sourceTenantPublicId },
      { signal },
    );

    return body.data;
  }

  async presignMenuImage(
    tenantId: string,
    contentType: string,
    signal?: AbortSignal,
  ): Promise<TenantMobileFaviconPresignResponse> {
    const body = await this.client.post<SuccessResponse<TenantMobileFaviconPresignResponse>, { contentType: string }>(
      `/tenants/${tenantId}/menu/images/presign`,
      { contentType },
      { signal },
    );

    return body.data;
  }

  async finalizeMenuImage(
    tenantId: string,
    objectKey: string,
    signal?: AbortSignal,
  ): Promise<TenantMobileMenuImageFinalizeResponse> {
    const body = await this.client.post<SuccessResponse<TenantMobileMenuImageFinalizeResponse>, { objectKey: string }>(
      `/tenants/${tenantId}/menu/images/finalize`,
      { objectKey },
      { signal },
    );

    return body.data;
  }
}
