import { describe, it, expect, beforeEach, vi } from "vitest";

import type {
  PublicCreateOrderPaymentRequest,
  PublicTableSessionRefreshRequest,
  PublicTableSessionReleaseRequest,
  PublicTableSessionRequest,
} from "@restorio/types";

import type { ApiClient } from "../../../src/client";
import { PublicResource } from "../../../src/resources/public";

type ApiClientMock = Pick<ApiClient, "get" | "post">;

describe("PublicResource", () => {
  let client: ApiClientMock;
  let resource: PublicResource;

  beforeEach(() => {
    vi.clearAllMocks();
    client = {
      get: vi.fn().mockResolvedValue({ data: {} }),
      post: vi.fn().mockResolvedValue({ data: {} }),
    };
    resource = new PublicResource(client as ApiClient);
  });

  it("getTenantInfo calls GET /public/:slug/info", async () => {
    client.get = vi.fn().mockResolvedValue({ data: { id: "t1" } });
    const r = await resource.getTenantInfo("acme");
    expect(r).toEqual({ id: "t1" });
    expect(client.get).toHaveBeenCalledWith("/public/acme/info", { signal: undefined });
  });

  it("getTenantMenu calls GET /public/:slug/menu", async () => {
    client.get = vi.fn().mockResolvedValue({ data: { id: "m1" } });
    const r = await resource.getTenantMenu("acme");
    expect(r).toEqual({ id: "m1" });
    expect(client.get).toHaveBeenCalledWith("/public/acme/menu", { signal: undefined });
  });

  it("getTenantTablesOverview calls GET /public/:slug/tables-overview", async () => {
    client.get = vi.fn().mockResolvedValue({ data: { canvases: [] } });
    const r = await resource.getTenantTablesOverview("acme");
    expect(r).toEqual({ canvases: [] });
    expect(client.get).toHaveBeenCalledWith("/public/acme/tables-overview", { signal: undefined });
  });

  it("createOrderPayment calls POST /public/payments/create", async () => {
    const payload: PublicCreateOrderPaymentRequest = {
      tenantSlug: "acme",
      tableNumber: 1,
      email: "a@b.co",
      items: [],
    };
    client.post = vi.fn().mockResolvedValue({ data: { id: "pay1" } });
    const r = await resource.createOrderPayment(payload);
    expect(r).toEqual({ id: "pay1" });
    expect(client.post).toHaveBeenCalledWith("/public/payments/create", payload, { signal: undefined });
  });

  it("acquireTableSession calls POST /public/table-sessions/acquire", async () => {
    const payload: PublicTableSessionRequest = {
      tenantSlug: "acme",
      tableNumber: 1,
    };
    client.post = vi.fn().mockResolvedValue({ data: { id: "s1" } });
    const r = await resource.acquireTableSession(payload);
    expect(r).toEqual({ id: "s1" });
    expect(client.post).toHaveBeenCalledWith("/public/table-sessions/acquire", payload, { signal: undefined });
  });

  it("refreshTableSession calls POST /public/table-sessions/refresh", async () => {
    const payload: PublicTableSessionRefreshRequest = { lockToken: "l1" };
    client.post = vi.fn().mockResolvedValue({ data: { id: "s1" } });
    const r = await resource.refreshTableSession(payload);
    expect(r).toEqual({ id: "s1" });
    expect(client.post).toHaveBeenCalledWith("/public/table-sessions/refresh", payload, { signal: undefined });
  });

  it("releaseTableSession calls POST /public/table-sessions/release", async () => {
    const payload: PublicTableSessionReleaseRequest = { lockToken: "l1" };
    client.post = vi.fn().mockResolvedValue({ data: { id: "s1" } });
    const r = await resource.releaseTableSession(payload);
    expect(r).toEqual({ id: "s1" });
    expect(client.post).toHaveBeenCalledWith("/public/table-sessions/release", payload, { signal: undefined });
  });

  it("syncPaymentSession encodes session id in path", async () => {
    client.post = vi.fn().mockResolvedValue({ data: { id: "pay" } });
    const r = await resource.syncPaymentSession("a/b");
    expect(r).toEqual({ id: "pay" });
    expect(client.post).toHaveBeenCalledWith("/public/payments/sessions/a%2Fb/p24-sync", {}, { signal: undefined });
  });
});
