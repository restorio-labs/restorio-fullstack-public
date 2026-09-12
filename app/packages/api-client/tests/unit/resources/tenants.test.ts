/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { TenantsResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "put" | "delete">;

describe("TenantsResource", () => {
  let client: ApiClientMock;
  let resource: TenantsResource;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    resource = new TenantsResource(client as ApiClient);
  });

  it("list calls GET /tenants and returns data", async () => {
    client.get = vi.fn().mockResolvedValue({ data: [{ id: "1", name: "Main" }] });

    const result = await resource.list();

    expect(client.get).toHaveBeenCalledWith("/tenants", { signal: undefined });
    expect(result).toEqual([{ id: "1", name: "Main" }]);
  });

  it("get calls GET /tenants/:id and returns data", async () => {
    client.get = vi.fn().mockResolvedValue({ data: { id: "tenant-1", name: "Main" } });

    const result = await resource.get("tenant-1");

    expect(client.get).toHaveBeenCalledWith("/tenants/tenant-1", { signal: undefined });
    expect(result).toEqual({ id: "tenant-1", name: "Main" });
  });

  it("create calls POST /tenants and returns data", async () => {
    const body = { name: "New", slug: "new" };
    client.post = vi.fn().mockResolvedValue({ data: { id: "tenant-2", ...body } });

    const result = await resource.create(body);

    expect(client.post).toHaveBeenCalledWith("/tenants", body, { signal: undefined });
    expect(result).toEqual({ id: "tenant-2", ...body });
  });

  it("update calls PUT /tenants/:id and returns data", async () => {
    const body = { name: "Updated" };
    client.put = vi.fn().mockResolvedValue({ data: { id: "tenant-1", ...body } });

    const result = await resource.update("tenant-1", body);

    expect(client.put).toHaveBeenCalledWith("/tenants/tenant-1", body, { signal: undefined });
    expect(result).toEqual({ id: "tenant-1", ...body });
  });

  it("delete calls DELETE /tenants/:id", async () => {
    await resource.delete("tenant-1");

    expect(client.delete).toHaveBeenCalledWith("/tenants/tenant-1", { signal: undefined });
  });
});
