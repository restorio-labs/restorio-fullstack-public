import type {
  CreatedResponse,
  PublicCreateOrderPaymentData,
  PublicCreateOrderPaymentRequest,
  PublicP24TransactionSyncData,
  PublicTableSessionData,
  PublicTableSessionRefreshRequest,
  PublicTableSessionReleaseRequest,
  PublicTableSessionRequest,
  PublicTablesOverview,
  PublicTenantInfo,
  SuccessResponse,
  TenantMenu,
} from "@restorio/types";

import { BaseResource } from "./base";

export class PublicResource extends BaseResource {
  async getTenantInfo(tenantSlug: string, signal?: AbortSignal): Promise<PublicTenantInfo> {
    const body = await this.client.get<SuccessResponse<PublicTenantInfo>>(`/public/${tenantSlug}/info`, { signal });

    return body.data;
  }

  async getTenantMenu(tenantSlug: string, signal?: AbortSignal): Promise<TenantMenu> {
    const body = await this.client.get<SuccessResponse<TenantMenu>>(`/public/${tenantSlug}/menu`, { signal });

    return body.data;
  }

  async getTenantTablesOverview(tenantSlug: string, signal?: AbortSignal): Promise<PublicTablesOverview> {
    const body = await this.client.get<SuccessResponse<PublicTablesOverview>>(`/public/${tenantSlug}/tables-overview`, {
      signal,
    });

    return body.data;
  }

  async createOrderPayment(
    data: PublicCreateOrderPaymentRequest,
    signal?: AbortSignal,
  ): Promise<PublicCreateOrderPaymentData> {
    const body = await this.client.post<CreatedResponse<PublicCreateOrderPaymentData>, PublicCreateOrderPaymentRequest>(
      "/public/payments/create",
      data,
      { signal },
    );

    return body.data;
  }

  async acquireTableSession(data: PublicTableSessionRequest, signal?: AbortSignal): Promise<PublicTableSessionData> {
    const body = await this.client.post<CreatedResponse<PublicTableSessionData>, PublicTableSessionRequest>(
      "/public/table-sessions/acquire",
      data,
      { signal },
    );

    return body.data;
  }

  async refreshTableSession(
    data: PublicTableSessionRefreshRequest,
    signal?: AbortSignal,
  ): Promise<PublicTableSessionData> {
    const body = await this.client.post<SuccessResponse<PublicTableSessionData>, PublicTableSessionRefreshRequest>(
      "/public/table-sessions/refresh",
      data,
      { signal },
    );

    return body.data;
  }

  async releaseTableSession(
    data: PublicTableSessionReleaseRequest,
    signal?: AbortSignal,
  ): Promise<PublicTableSessionData> {
    const body = await this.client.post<SuccessResponse<PublicTableSessionData>, PublicTableSessionReleaseRequest>(
      "/public/table-sessions/release",
      data,
      { signal },
    );

    return body.data;
  }

  async syncPaymentSession(sessionId: string, signal?: AbortSignal): Promise<PublicP24TransactionSyncData> {
    const body = await this.client.post<SuccessResponse<PublicP24TransactionSyncData>>(
      `/public/payments/sessions/${encodeURIComponent(sessionId)}/p24-sync`,
      {},
      { signal },
    );

    return body.data;
  }
}
