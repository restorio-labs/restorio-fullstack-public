import { describe, it, expect, vi, beforeEach } from "vitest";

import type { ApiClient } from "../../src/client";
import { RestorioApi } from "../../src/endpoints";

describe("RestorioApi", () => {
  let mockClient: ApiClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      get: vi.fn(),
      getHttpStatus: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as ApiClient;
  });

  it("exposes all resources when constructed with a client", () => {
    const api = new RestorioApi(mockClient);

    expect(api.auth).toBeDefined();
    expect(api.health).toBeDefined();
    expect(api.payments).toBeDefined();
    expect(api.tenantProfiles).toBeDefined();
    expect(api.restaurants).toBeDefined();
    expect(api.menus).toBeDefined();
    expect(api.orders).toBeDefined();
    expect(api.tables).toBeDefined();
    expect(api.tenants).toBeDefined();
    expect(api.tenantOrders).toBeDefined();
    expect(api.floorCanvases).toBeDefined();
    expect(api.users).toBeDefined();
  });

  it("uses the same client instance for all resources", () => {
    const api = new RestorioApi(mockClient);

    vi.mocked(mockClient.get).mockResolvedValue({ data: { id: "tenant-1" } });

    void api.tenants.get("tenant-1");

    expect(mockClient.get).toHaveBeenCalledWith("/tenants/tenant-1", { signal: undefined });
  });
});
