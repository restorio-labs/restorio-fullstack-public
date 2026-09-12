import type { Restaurant } from "@restorio/types";

import { BaseResource } from "./base";

export class RestaurantsResource extends BaseResource {
  /**
   * List restaurants.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the restaurants are listed.
   */
  list(signal?: AbortSignal): Promise<Restaurant[]> {
    return this.client.get("/restaurants", { signal });
  }

  /**
   * Get a restaurant.
   * @param id - The ID of the restaurant to get.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the restaurant is retrieved.
   */
  get(id: string, signal?: AbortSignal): Promise<Restaurant> {
    return this.client.get(`/restaurants/${id}`, { signal });
  }

  /**
   * Create a restaurant.
   * @param data - The data to create the restaurant with.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the restaurant is created.
   */
  create(data: Partial<Restaurant>, signal?: AbortSignal): Promise<Restaurant> {
    return this.client.post("/restaurants", data, { signal });
  }

  /**
   * Update a restaurant.
   * @param id - The ID of the restaurant to update.
   * @param data - The data to update the restaurant with.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the restaurant is updated.
   */
  update(id: string, data: Partial<Restaurant>, signal?: AbortSignal): Promise<Restaurant> {
    return this.client.put(`/restaurants/${id}`, data, { signal });
  }

  /**
   * Delete a restaurant.
   * @param id - The ID of the restaurant to delete.
   * @param signal - The abort signal to cancel the request.
   * @returns A promise that resolves when the restaurant is deleted.
   */
  delete(id: string, signal?: AbortSignal): Promise<void> {
    return this.client.delete(`/restaurants/${id}`, { signal });
  }
}
