import type {
  Order,
  OrderFilters,
  OrderStatus,
  PaginatedResponse,
  RestaurantKitchenConfig,
  SuccessResponse,
  TableSession,
} from "@restorio/types";

import { BaseResource } from "./base";

interface UpdateStatusPayload {
  status: OrderStatus;
  rejectionReason?: string;
}

export interface ArchivedOrderRow {
  id: string;
  originalOrderId: string;
  restaurantId: string;
  tenantId: string;
  tableId: string | null;
  tableLabel: string;
  status: string;
  paymentStatus: string;
  total: string | number;
  currency: string;
  notes: string | null;
  createdAt: string;
  archivedAt: string;
}

export interface ListArchivedOrdersParams {
  page?: number;
  pageSize?: number;
  sinceHours?: number | null;
}

export class OrdersResource extends BaseResource {
  list(restaurantId: string, filters?: OrderFilters, signal?: AbortSignal): Promise<SuccessResponse<Order[]>> {
    return this.client.get(`/restaurants/${restaurantId}/orders`, {
      params: filters as Record<string, string | number | Date>,
      signal,
    });
  }

  get(restaurantId: string, orderId: string, signal?: AbortSignal): Promise<SuccessResponse<Order>> {
    return this.client.get(`/restaurants/${restaurantId}/orders/${orderId}`, { signal });
  }

  async listArchivedPage(
    restaurantId: string,
    params?: ListArchivedOrdersParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<ArchivedOrderRow>> {
    return this.client.get<PaginatedResponse<ArchivedOrderRow>>(`/restaurants/${restaurantId}/orders/archived`, {
      params: {
        page: params?.page,
        page_size: params?.pageSize,
        sinceHours: params?.sinceHours ?? undefined,
      },
      signal,
    });
  }

  async listArchived(
    restaurantId: string,
    params?: Omit<ListArchivedOrdersParams, "page">,
    signal?: AbortSignal,
  ): Promise<ArchivedOrderRow[]> {
    const page = await this.listArchivedPage(
      restaurantId,
      {
        page: 1,
        pageSize: params?.pageSize,
        sinceHours: params?.sinceHours,
      },
      signal,
    );

    return page.items;
  }

  create(restaurantId: string, data: Partial<Order>, signal?: AbortSignal): Promise<Order> {
    return this.client.post(`/restaurants/${restaurantId}/orders`, data, { signal });
  }

  update(restaurantId: string, orderId: string, data: Partial<Order>, signal?: AbortSignal): Promise<Order> {
    return this.client.put(`/restaurants/${restaurantId}/orders/${orderId}`, data, { signal });
  }

  updateStatus(
    restaurantId: string,
    orderId: string,
    status: OrderStatus,
    rejectionReason?: string,
    signal?: AbortSignal,
  ): Promise<SuccessResponse<Order>> {
    const payload: UpdateStatusPayload = { status };

    if (rejectionReason) {
      payload.rejectionReason = rejectionReason;
    }

    return this.client.patch(`/restaurants/${restaurantId}/orders/${orderId}/status`, payload, { signal });
  }

  archive(
    restaurantId: string,
    orderId: string,
    signal?: AbortSignal,
  ): Promise<SuccessResponse<{ id: string; originalOrderId: string }>> {
    return this.client.post(`/restaurants/${restaurantId}/orders/${orderId}/archive`, {}, { signal });
  }

  async listTableSessions(restaurantId: string, signal?: AbortSignal): Promise<TableSession[]> {
    const response = await this.client.get<SuccessResponse<TableSession[]>>(
      `/restaurants/${restaurantId}/table-sessions`,
      { signal },
    );

    return response.data;
  }

  unlockTableSession(
    restaurantId: string,
    tableRef: string,
    signal?: AbortSignal,
  ): Promise<SuccessResponse<{ released: boolean; tableRef: string }>> {
    return this.client.post(
      `/restaurants/${restaurantId}/table-sessions/${encodeURIComponent(tableRef)}/unlock`,
      {},
      { signal },
    );
  }

  getKitchenConfig(restaurantId: string, signal?: AbortSignal): Promise<SuccessResponse<RestaurantKitchenConfig>> {
    return this.client.get(`/restaurants/${restaurantId}/kitchen-config`, { signal });
  }

  refund(
    restaurantId: string,
    orderId: string,
    signal?: AbortSignal,
  ): Promise<SuccessResponse<{ orderId: string; status: string }>> {
    return this.client.post(`/restaurants/${restaurantId}/orders/${orderId}/refund`, {}, { signal });
  }

  delete(restaurantId: string, orderId: string, signal?: AbortSignal): Promise<SuccessResponse<{ message: string }>> {
    return this.client.delete(`/restaurants/${restaurantId}/orders/${orderId}`, { signal });
  }
}
