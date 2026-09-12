/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { TenantProfilesResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "put" | "post">;

describe("TenantProfilesResource", () => {
  let client: ApiClientMock;
  let resource: TenantProfilesResource;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
    };

    resource = new TenantProfilesResource(client as ApiClient);
  });

  it("get calls GET /tenants/:id/profile and returns data", async () => {
    client.get = vi.fn().mockResolvedValue({ data: { name: "Main" } });

    const result = await resource.get("tenant-1");

    expect(client.get).toHaveBeenCalledWith("/tenants/tenant-1/profile", { signal: undefined });
    expect(result).toEqual({ name: "Main" });
  });

  it("save calls PUT /tenants/:id/profile and returns data", async () => {
    const body = { displayName: "Main" };
    client.put = vi.fn().mockResolvedValue({ data: { id: "profile-1", ...body } });

    const result = await resource.save("tenant-1", body as never);

    expect(client.put).toHaveBeenCalledWith("/tenants/tenant-1/profile", body, { signal: undefined });
    expect(result).toEqual({ id: "profile-1", ...body });
  });

  it("createLogoUploadUrl calls POST presign endpoint and returns data", async () => {
    const body = { contentType: "image/png", key: "logo.png" };
    client.post = vi.fn().mockResolvedValue({ data: { uploadUrl: "https://upload" } });

    const result = await resource.createLogoUploadUrl("tenant-1", body as never);

    expect(client.post).toHaveBeenCalledWith("/tenants/tenant-1/profile/logo/presign", body, { signal: undefined });
    expect(result).toEqual({ uploadUrl: "https://upload" });
  });

  it("createLogoViewUrl calls GET presign endpoint and returns data", async () => {
    client.get = vi.fn().mockResolvedValue({ data: { viewUrl: "https://view" } });

    const result = await resource.createLogoViewUrl("tenant-1");

    expect(client.get).toHaveBeenCalledWith("/tenants/tenant-1/profile/logo/presign", { signal: undefined });
    expect(result).toEqual({ viewUrl: "https://view" });
  });
});
