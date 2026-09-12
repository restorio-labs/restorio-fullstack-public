import type { CreatedResponse, FloorCanvas, SuccessResponse } from "@restorio/types";

import { BaseResource } from "./base";

export class FloorCanvasesResource extends BaseResource {
  async list(tenantId: string, signal?: AbortSignal): Promise<FloorCanvas[]> {
    const res = await this.client.get<SuccessResponse<FloorCanvas[]>>(`/tenants/${tenantId}/canvases`, { signal });

    return res.data;
  }

  async get(tenantId: string, canvasId: string, signal?: AbortSignal): Promise<FloorCanvas> {
    const res = await this.client.get<SuccessResponse<FloorCanvas>>(`/tenants/${tenantId}/canvases/${canvasId}`, {
      signal,
    });

    return res.data;
  }

  async create(
    tenantId: string,
    data: Omit<FloorCanvas, "id" | "tenantId" | "version">,
    signal?: AbortSignal,
  ): Promise<FloorCanvas> {
    const res = await this.client.post<CreatedResponse<FloorCanvas>>(`/tenants/${tenantId}/canvases`, data, { signal });

    return res.data;
  }

  async update(
    tenantId: string,
    canvasId: string,
    data: Partial<Pick<FloorCanvas, "name" | "width" | "height" | "elements">>,
    signal?: AbortSignal,
  ): Promise<FloorCanvas> {
    const res = await this.client.put<SuccessResponse<FloorCanvas>>(`/tenants/${tenantId}/canvases/${canvasId}`, data, {
      signal,
    });

    return res.data;
  }

  delete(tenantId: string, canvasId: string, signal?: AbortSignal): Promise<void> {
    return this.client.delete(`/tenants/${tenantId}/canvases/${canvasId}`, { signal });
  }
}
