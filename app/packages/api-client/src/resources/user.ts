import type {
  BulkCreateStaffUserRequest,
  BulkCreateStaffUserResponse,
  CreateStaffUserRequest,
  CreateStaffUserResponse,
  DeleteUserData,
  StaffUserData,
  SuccessResponse,
} from "@restorio/types";

import { BaseResource } from "./base";

export class UserResource extends BaseResource {
  /**
   * Create staff user (kitchen/waiter).
   */
  create(tenantId: string, data: CreateStaffUserRequest, signal?: AbortSignal): Promise<CreateStaffUserResponse> {
    return this.client.post<CreateStaffUserResponse>(`users/${encodeURIComponent(tenantId)}`, data, { signal });
  }

  bulkCreate(
    tenantId: string,
    data: BulkCreateStaffUserRequest,
    signal?: AbortSignal,
  ): Promise<BulkCreateStaffUserResponse> {
    return this.client.post<BulkCreateStaffUserResponse>(`users/${encodeURIComponent(tenantId)}/bulk`, data, {
      signal,
    });
  }

  /**
   * List current tenant staff users.
   */
  async list(tenantId: string, signal?: AbortSignal): Promise<StaffUserData[]> {
    const { data } = await this.client.get<SuccessResponse<StaffUserData[]>>(`users/${encodeURIComponent(tenantId)}`, {
      signal,
    });

    return data;
  }

  /**
   * Delete staff user by id.
   */
  async delete(tenantId: string, userId: string, signal?: AbortSignal): Promise<DeleteUserData> {
    const { data } = await this.client.delete<SuccessResponse<DeleteUserData>>(
      `users/${encodeURIComponent(tenantId)}/${encodeURIComponent(userId)}`,
      { signal },
    );

    return data;
  }
}
