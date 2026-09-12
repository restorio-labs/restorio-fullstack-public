/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { TenantOrdersResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "put" | "delete">;

describe("TenantOrdersResource", () => {
  let client: ApiClientMock;
  let resource: TenantOrdersResource;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn().mockResolvedValue({ data: { id: "o1" } }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    resource = new TenantOrdersResource(client as ApiClient);
  });

  it("list calls GET /tenants/:id/orders", async () => {
    await resource.list("tenant-1");
    expect(client.get).toHaveBeenCalledWith("/tenants/tenant-1/orders", { signal: undefined });
  });

  it("create calls POST /tenants/:id/orders", async () => {
    const payload = { table_id: "t1", items: [] };
    await resource.create("tenant-1", payload);
    expect(client.post).toHaveBeenCalledWith("/tenants/tenant-1/orders", payload, { signal: undefined });
  });

  it("update calls PUT /tenants/:id/orders/:orderId", async () => {
    await resource.update("tenant-1", "order-1", { status: "paid" });
    expect(client.put).toHaveBeenCalledWith(
      "/tenants/tenant-1/orders/order-1",
      { status: "paid" },
      {
        signal: undefined,
      },
    );
  });
});
