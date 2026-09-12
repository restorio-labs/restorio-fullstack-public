import type {
  CreateTenantProfileRequest,
  CreatedResponse,
  SuccessResponse,
  TenantLogoUploadPresignRequest,
  TenantLogoUploadResponse,
  TenantLogoViewPresignResponse,
  TenantProfile,
} from "@restorio/types";

import { BaseResource } from "./base";

export class TenantProfilesResource extends BaseResource {
  async get(tenantId: string, signal?: AbortSignal): Promise<TenantProfile> {
    const { data } = await this.client.get<SuccessResponse<TenantProfile>>(`/tenants/${tenantId}/profile`, { signal });

    return data;
  }

  async save(tenantId: string, body: CreateTenantProfileRequest, signal?: AbortSignal): Promise<TenantProfile> {
    const { data } = await this.client.put<SuccessResponse<TenantProfile> | CreatedResponse<TenantProfile>>(
      `/tenants/${tenantId}/profile`,
      body,
      { signal },
    );

    return data;
  }

  async createLogoUploadUrl(
    tenantId: string,
    body: TenantLogoUploadPresignRequest,
    signal?: AbortSignal,
  ): Promise<TenantLogoUploadResponse> {
    const { data } = await this.client.post<SuccessResponse<TenantLogoUploadResponse>, TenantLogoUploadPresignRequest>(
      `/tenants/${tenantId}/profile/logo/presign`,
      body,
      { signal },
    );

    return data;
  }

  async createLogoViewUrl(tenantId: string, signal?: AbortSignal): Promise<TenantLogoViewPresignResponse> {
    const { data } = await this.client.get<SuccessResponse<TenantLogoViewPresignResponse>>(
      `/tenants/${tenantId}/profile/logo/presign`,
      { signal },
    );

    return data;
  }
}
