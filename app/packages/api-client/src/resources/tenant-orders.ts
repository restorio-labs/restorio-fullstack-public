import type { CreatedResponse, SuccessResponse, UpdatedResponse } from "@restorio/types";

import { BaseResource } from "./base";

export interface TenantOrderRow {
  id: string;
  table_id: string | null;
  table_ref: string | null;
  status: string;
  waiter_name: string | null;
  waiter_surname: string | null;
  notes: string | null;
  created_at: string;
  total_amount?: string | number;
  currency?: string;
}

export interface TenantOrderItemInput {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  modifiers: string[];
}

export interface CreateTenantOrderBody {
  table_id: string;
  items: TenantOrderItemInput[];
}

export interface UpdateTenantOrderBody {
  items?: TenantOrderItemInput[];
  status?: string;
  notes?: string;
}

export interface TenantOrderDetail {
  id: string;
  waiter_name?: string | null;
  waiter_surname?: string | null;
}

export class TenantOrdersResource extends BaseResource {
  async list(tenantId: string, signal?: AbortSignal): Promise<TenantOrderRow[]> {
    const { data } = await this.client.get<SuccessResponse<TenantOrderRow[]>>(`/tenants/${tenantId}/orders`, {
      signal,
    });

    return data;
  }

  async create(tenantId: string, body: CreateTenantOrderBody, signal?: AbortSignal): Promise<TenantOrderDetail> {
    const { data } = await this.client.post<CreatedResponse<TenantOrderDetail>>(`/tenants/${tenantId}/orders`, body, {
      signal,
    });

    return data;
  }

  async update(tenantId: string, orderId: string, body: UpdateTenantOrderBody, signal?: AbortSignal): Promise<void> {
    await this.client.put<UpdatedResponse<TenantOrderDetail>>(`/tenants/${tenantId}/orders/${orderId}`, body, {
      signal,
    });
  }
}
