/* eslint-disable @typescript-eslint/unbound-method */
import type { Table } from "@restorio/types";
import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { TablesResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "put" | "delete">;

describe("TablesResource", () => {
  let client: ApiClientMock;
  let resource: TablesResource;

  const payload: Partial<Table> = { number: "5", capacity: 5 };

  beforeEach(() => {
    vi.clearAllMocks();

    client = {
      get: vi.fn().mockResolvedValue(undefined),
      post: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    resource = new TablesResource(client as ApiClient);
  });

  it("list calls GET /restaurants/:id/tables", async () => {
    await resource.list("r1");
    expect(client.get).toHaveBeenCalledWith("/restaurants/r1/tables", { signal: undefined });
  });

  it("create calls POST /restaurants/:id/tables", async () => {
    await resource.create("r1", payload);
    expect(client.post).toHaveBeenCalledWith("/restaurants/r1/tables", payload, { signal: undefined });
  });

  it("update calls PUT /restaurants/:id/tables/:tableId", async () => {
    await resource.update("r1", "t1", payload);
    expect(client.put).toHaveBeenCalledWith("/restaurants/r1/tables/t1", payload, { signal: undefined });
  });

  it("delete calls DELETE /restaurants/:id/tables/:id", async () => {
    await resource.delete("r1", "t1");
    expect(client.delete).toHaveBeenCalledWith("/restaurants/r1/tables/t1", { signal: undefined });
  });
});
