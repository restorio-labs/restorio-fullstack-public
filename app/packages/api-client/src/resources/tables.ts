import type { Table } from "@restorio/types";

import { BaseResource } from "./base";

export class TablesResource extends BaseResource {
  /**
   * List tables.
   * @param restaurantId - The ID of the restaurant to list tables for.
   * @returns A promise that resolves when the tables are listed.
   */
  list(restaurantId: string, signal?: AbortSignal): Promise<Table[]> {
    return this.client.get(`/restaurants/${restaurantId}/tables`, { signal });
  }

  /**
   * Create a table.
   * @param restaurantId - The ID of the restaurant to create the table for.
   * @param data - The data to create the table with.
   * @returns A promise that resolves when the table is created.
   */
  create(restaurantId: string, data: Partial<Table>, signal?: AbortSignal): Promise<Table> {
    return this.client.post(`/restaurants/${restaurantId}/tables`, data, { signal });
  }

  /**
   * Update a table.
   * @param restaurantId - The ID of the restaurant to update the table for.
   * @param tableId - The ID of the table to update.
   * @param data - The data of type Table to update the table with.
   * @returns A promise that resolves when the table is updated.
   */
  update(restaurantId: string, tableId: string, data: Partial<Table>, signal?: AbortSignal): Promise<Table> {
    return this.client.put(`/restaurants/${restaurantId}/tables/${tableId}`, data, { signal });
  }

  /**
   * Delete a table.
   * @param restaurantId - The ID of the restaurant to delete the table for.
   * @param tableId - The ID of the table to delete.
   * @returns A promise that resolves when the table is deleted.
   */
  delete(restaurantId: string, tableId: string, signal?: AbortSignal): Promise<void> {
    return this.client.delete(`/restaurants/${restaurantId}/tables/${tableId}`, { signal });
  }
}
