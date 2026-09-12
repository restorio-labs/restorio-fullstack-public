/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { MenusResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "put" | "delete">;

describe("MenusResource", () => {
  let client: ApiClientMock;
  let resource: MenusResource;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue({ data: null }),
      post: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    resource = new MenusResource(client as ApiClient);
  });

  it("get calls GET /tenants/:id/menu", async () => {
    await resource.get("tenant-1");
    expect(client.get).toHaveBeenCalledWith("/tenants/tenant-1/menu", { signal: undefined });
  });

  it("get returns null when API responds 404", async () => {
    vi.mocked(client.get).mockRejectedValueOnce({
      response: { status: 404 },
    });

    await expect(resource.get("tenant-1")).resolves.toBeNull();
  });

  it("save calls PUT /tenants/:id/menu", async () => {
    const payload = {
      categories: [{ name: "Mains", order: 0, items: [] }],
    };

    await resource.save("tenant-1", payload);
    expect(client.put).toHaveBeenCalledWith("/tenants/tenant-1/menu", payload, { signal: undefined });
  });
});
