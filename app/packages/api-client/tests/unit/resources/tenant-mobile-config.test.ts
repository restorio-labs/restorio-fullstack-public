import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { TenantMobileConfigResource } from "../../../src/resources/tenant-mobile-config";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "put">;

describe("TenantMobileConfigResource", () => {
  let client: ApiClientMock;
  let resource: TenantMobileConfigResource;

  beforeEach(() => {
    vi.clearAllMocks();
    client = {
      get: vi.fn().mockResolvedValue({ data: {} }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
    };
    resource = new TenantMobileConfigResource(client as ApiClient);
  });

  it("get calls GET /tenants/:id/mobile-config", async () => {
    client.get = vi.fn().mockResolvedValue({ data: { id: "t1" } });
    const r = await resource.get("tenant-1");
    expect(r).toEqual({ id: "t1" });
    expect(client.get).toHaveBeenCalledWith("/tenants/tenant-1/mobile-config", { signal: undefined });
  });

  it("update calls PUT /tenants/:id/mobile-config", async () => {
    const payload = { pageTitle: "Kitchen" };
    client.put = vi.fn().mockResolvedValue({ data: { id: "t1" } });
    const r = await resource.update("tenant-1", payload);
    expect(r).toEqual({ id: "t1" });
    expect(client.put).toHaveBeenCalledWith("/tenants/tenant-1/mobile-config", payload, { signal: undefined });
  });

  it("update sends landingContent when provided", async () => {
    const payload = {
      landingContent: {
        headline: "Hi",
        subtitle: "There",
        tablesCtaLabel: "T",
        menuCtaLabel: "M",
        openStatusLabel: "O",
        closedStatusLabel: "C",
      },
    };
    client.put = vi.fn().mockResolvedValue({ data: { ok: true } });
    await resource.update("tenant-1", payload);
    expect(client.put).toHaveBeenCalledWith("/tenants/tenant-1/mobile-config", payload, { signal: undefined });
  });

  it("presignFavicon calls POST favicon presign", async () => {
    client.post = vi.fn().mockResolvedValue({ data: { uploadUrl: "u", objectKey: "k" } });
    const r = await resource.presignFavicon("tenant-1", "image/png");
    expect(r).toEqual({ uploadUrl: "u", objectKey: "k" });
    expect(client.post).toHaveBeenCalledWith(
      "/tenants/tenant-1/mobile-config/favicon/presign",
      { contentType: "image/png" },
      { signal: undefined },
    );
  });

  it("finalizeFavicon calls POST favicon finalize", async () => {
    client.post = vi.fn().mockResolvedValue({ data: { id: "t1" } });
    const r = await resource.finalizeFavicon("tenant-1", "key-1");
    expect(r).toEqual({ id: "t1" });
    expect(client.post).toHaveBeenCalledWith(
      "/tenants/tenant-1/mobile-config/favicon/finalize",
      { objectKey: "key-1" },
      { signal: undefined },
    );
  });

  it("copyThemeFrom calls POST theme copy-from", async () => {
    client.post = vi.fn().mockResolvedValue({ data: { id: "t1" } });
    const r = await resource.copyThemeFrom("tenant-1", "src-tenant");
    expect(r).toEqual({ id: "t1" });
    expect(client.post).toHaveBeenCalledWith(
      "/tenants/tenant-1/mobile-config/theme/copy-from",
      { sourceTenantPublicId: "src-tenant" },
      { signal: undefined },
    );
  });

  it("presignMenuImage calls POST menu images presign", async () => {
    client.post = vi.fn().mockResolvedValue({ data: { uploadUrl: "u", objectKey: "k" } });
    const r = await resource.presignMenuImage("tenant-1", "image/jpeg");
    expect(r).toEqual({ uploadUrl: "u", objectKey: "k" });
    expect(client.post).toHaveBeenCalledWith(
      "/tenants/tenant-1/menu/images/presign",
      { contentType: "image/jpeg" },
      { signal: undefined },
    );
  });

  it("finalizeMenuImage calls POST menu images finalize", async () => {
    client.post = vi.fn().mockResolvedValue({ data: { imageUrl: "https://x" } });
    const r = await resource.finalizeMenuImage("tenant-1", "key-2");
    expect(r).toEqual({ imageUrl: "https://x" });
    expect(client.post).toHaveBeenCalledWith(
      "/tenants/tenant-1/menu/images/finalize",
      { objectKey: "key-2" },
      { signal: undefined },
    );
  });
});
