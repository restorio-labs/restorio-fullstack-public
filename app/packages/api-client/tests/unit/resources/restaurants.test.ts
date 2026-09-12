/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { RestaurantsResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "put" | "delete">;

describe("RestaurantsResource", () => {
  let client: ApiClientMock;
  let resource: RestaurantsResource;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    resource = new RestaurantsResource(client as ApiClient);
  });

  it("list calls GET /restaurants", async () => {
    await resource.list();
    expect(client.get).toHaveBeenCalledWith("/restaurants", { signal: undefined });
  });

  it("get calls GET /restaurants/:id", async () => {
    await resource.get("123");
    expect(client.get).toHaveBeenCalledWith("/restaurants/123", { signal: undefined });
  });

  it("create calls POST /restaurants", async () => {
    const payload = { name: "New Resto" };

    await resource.create(payload);
    expect(client.post).toHaveBeenCalledWith("/restaurants", payload, { signal: undefined });
  });

  it("update calls PUT /restaurants/:id", async () => {
    const payload = { name: "Updated Name" };

    await resource.update("123", payload);
    expect(client.put).toHaveBeenCalledWith("/restaurants/123", payload, { signal: undefined });
  });

  it("delete calls DELETE /restaurants/:id", async () => {
    await resource.delete("123");
    expect(client.delete).toHaveBeenCalledWith("/restaurants/123", { signal: undefined });
  });
});
