/* eslint-disable @typescript-eslint/unbound-method */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { PaymentsResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "put" | "post">;

describe("PaymentsResource", () => {
  let client: ApiClientMock;
  let resource: PaymentsResource;

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20, total_pages: 0 }),
      put: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue({ message: "ok", data: { scanned: 0, updated: 0, failed: 0 } }),
    };

    resource = new PaymentsResource(client as ApiClient);
  });

  it("getP24Config calls GET /payments/tenants/:id/p24-config", async () => {
    const payload = {
      p24Merchantid: 42,
      p24Api: "k".repeat(32),
      p24Crc: "c".repeat(16),
    };

    client.get = vi.fn().mockResolvedValueOnce(payload);

    const result = await resource.getP24Config("tenant-1");

    expect(client.get).toHaveBeenCalledWith("/payments/tenants/tenant-1/p24-config", {
      signal: undefined,
    });
    expect(result).toEqual(payload);
  });

  it("updateP24Config calls PUT /payments/tenants/:id/p24-config and returns response data", async () => {
    const payload = {
      p24_merchantid: 123456,
      p24_api: "api-key",
      p24_crc: "crc-key",
    };

    client.put = vi.fn().mockResolvedValue({ data: payload });

    const result = await resource.updateP24Config("tenant-1", payload);

    expect(client.put).toHaveBeenCalledWith("/payments/tenants/tenant-1/p24-config", payload, { signal: undefined });
    expect(result).toEqual(payload);
  });

  it("listTransactions sends tenant_public_id only when params omitted", async () => {
    await resource.listTransactions("tenant-a");

    expect(client.get).toHaveBeenCalledWith("/payments/transactions", {
      signal: undefined,
      params: { tenant_public_id: "tenant-a" },
    });
  });

  it("listTransactions merges optional query params", async () => {
    await resource.listTransactions("tenant-a", { page: 2, pagination: 20 });

    expect(client.get).toHaveBeenCalledWith("/payments/transactions", {
      signal: undefined,
      params: {
        tenant_public_id: "tenant-a",
        page: 2,
        pagination: 20,
      },
    });
  });

  it("listTransactions passes date filters when provided", async () => {
    await resource.listTransactions("tenant-a", { date_from: "2026-01-01", date_to: "2026-01-31" });

    expect(client.get).toHaveBeenCalledWith("/payments/transactions", {
      signal: undefined,
      params: {
        tenant_public_id: "tenant-a",
        date_from: "2026-01-01",
        date_to: "2026-01-31",
      },
    });
  });

  it("listTransactions forwards AbortSignal", async () => {
    const controller = new AbortController();

    await resource.listTransactions("tenant-a", { page: 1 }, controller.signal);

    expect(client.get).toHaveBeenCalledWith("/payments/transactions", {
      signal: controller.signal,
      params: { tenant_public_id: "tenant-a", page: 1 },
    });
  });

  it("listTransactions returns response data from client.get", async () => {
    const payload = {
      items: [],
      total: 3,
      page: 1,
      page_size: 20,
      total_pages: 1,
    };
    client.get = vi.fn().mockResolvedValue(payload);

    const result = await resource.listTransactions("tenant-a");

    expect(result).toEqual(payload);
  });

  it("reconcilePendingTransactions posts reconcile endpoint with tenant query param", async () => {
    const payload = { message: "Reconcile completed", data: { scanned: 2, updated: 1, failed: 0 } };
    client.post = vi.fn().mockResolvedValueOnce(payload);

    const result = await resource.reconcilePendingTransactions("tenant-a");

    expect(client.post).toHaveBeenCalledWith(
      "/payments/transactions/reconcile-pending",
      {},
      { signal: undefined, params: { tenant_public_id: "tenant-a" } },
    );
    expect(result).toEqual(payload);
  });
});
