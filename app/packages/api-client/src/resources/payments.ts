import type {
  P24ConfigData,
  SuccessResponse,
  TransactionListData,
  TransactionListParams,
  TransactionsReconcileResult,
  UpdateP24ConfigData,
  UpdateP24ConfigRequest,
  UpdatedResponse,
} from "@restorio/types";

import { BaseResource } from "./base";

export class PaymentsResource extends BaseResource {
  async getP24Config(tenantId: string, signal?: AbortSignal): Promise<P24ConfigData> {
    return this.client.get<P24ConfigData>(`/payments/tenants/${tenantId}/p24-config`, { signal });
  }

  async updateP24Config(
    tenantId: string,
    data: UpdateP24ConfigRequest,
    signal?: AbortSignal,
  ): Promise<UpdateP24ConfigData> {
    const response = await this.client.put<UpdatedResponse<UpdateP24ConfigData>>(
      `/payments/tenants/${tenantId}/p24-config`,
      data,
      { signal },
    );

    return response.data;
  }

  // async createPayment(
  //   data: CreateTransactionRequest,
  //   signal?: AbortSignal,
  // ): Promise<CreateTransactionData> {
  //   const response = await this.client.post<CreatedResponse<CreateTransactionData>>(
  //     `/payments/create`,
  //     data,
  //     { signal },
  //   );

  //   return response.data;
  // }

  listTransactions(
    tenantId: string,
    params?: TransactionListParams,
    signal?: AbortSignal,
  ): Promise<TransactionListData> {
    return this.client.get<TransactionListData>("/payments/transactions", {
      signal,
      params: {
        tenant_public_id: tenantId,
        ...(params ?? {}),
      },
    });
  }

  reconcilePendingTransactions(
    tenantId: string,
    signal?: AbortSignal,
  ): Promise<SuccessResponse<TransactionsReconcileResult>> {
    return this.client.post<SuccessResponse<TransactionsReconcileResult>, Record<string, never>>(
      "/payments/transactions/reconcile-pending",
      {},
      {
        signal,
        params: { tenant_public_id: tenantId },
      },
    );
  }
}
