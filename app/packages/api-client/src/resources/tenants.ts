import type { CreatedResponse, SuccessResponse, Tenant, TenantSummary, UpdatedResponse } from "@restorio/types";

import { BaseResource } from "./base";

export class TenantsResource extends BaseResource {
  async list(signal?: AbortSignal): Promise<TenantSummary[]> {
    const { data } = await this.client.get<SuccessResponse<TenantSummary[]>>("/tenants", { signal });

    return data;
  }

  async get(tenantId: string, signal?: AbortSignal): Promise<Tenant> {
    const { data } = await this.client.get<SuccessResponse<Tenant>>(`/tenants/${tenantId}`, {
      signal,
    });

    return data;
  }

  async create(body: { name: string; slug: string; status?: string }, signal?: AbortSignal): Promise<Tenant> {
    const { data } = await this.client.post<CreatedResponse<Tenant>>("/tenants", body, { signal });

    return data;
  }

  async update(
    tenantId: string,
    body: Partial<Pick<Tenant, "name" | "slug" | "status" | "activeLayoutVersionId">>,
    signal?: AbortSignal,
  ): Promise<Tenant> {
    const { data } = await this.client.put<UpdatedResponse<Tenant>>(`/tenants/${tenantId}`, body, {
      signal,
    });

    return data;
  }

  async delete(tenantId: string, signal?: AbortSignal): Promise<void> {
    await this.client.delete(`/tenants/${tenantId}`, { signal });
  }
}
