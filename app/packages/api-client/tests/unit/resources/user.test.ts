/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { UserResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "delete">;

describe("UserResource", () => {
  let client: ApiClientMock;
  let resource: UserResource;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    resource = new UserResource(client as ApiClient);
  });

  it("create calls POST users/:tenantId", async () => {
    const body = {
      email: "staff@example.com",
      password: "secret",
      role: "waiter",
    };

    await resource.create("tenant-pub-id", body as never);

    expect(client.post).toHaveBeenCalledWith("users/tenant-pub-id", body, { signal: undefined });
  });

  it("list calls encoded GET users/:tenantId and returns data", async () => {
    client.get = vi.fn().mockResolvedValue({ data: [{ id: "1" }] });

    const result = await resource.list("tenant/id");

    expect(client.get).toHaveBeenCalledWith("users/tenant%2Fid", { signal: undefined });
    expect(result).toEqual([{ id: "1" }]);
  });

  it("delete calls encoded DELETE users/:tenantId/:userId and returns data", async () => {
    client.delete = vi.fn().mockResolvedValue({ data: { deleted: true } });

    const result = await resource.delete("tenant/id", "user/id");

    expect(client.delete).toHaveBeenCalledWith("users/tenant%2Fid/user%2Fid", { signal: undefined });
    expect(result).toEqual({ deleted: true });
  });
});
