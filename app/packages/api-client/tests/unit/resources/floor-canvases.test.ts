/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { FloorCanvasesResource } from "../../../src/resources";

type ApiClientMock = Pick<ApiClient, "get" | "post" | "put" | "delete">;

describe("FloorCanvasesResource", () => {
  let client: ApiClientMock;
  let resource: FloorCanvasesResource;

  beforeEach(() => {
    client = {
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn().mockResolvedValue({ data: {} }),
      put: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    resource = new FloorCanvasesResource(client as ApiClient);
  });

  it("list calls GET /tenants/:tenantId/canvases", async () => {
    await resource.list("tenant-1");

    expect(client.get).toHaveBeenCalledWith("/tenants/tenant-1/canvases", { signal: undefined });
  });

  it("get calls GET /tenants/:tenantId/canvases/:canvasId", async () => {
    await resource.get("tenant-1", "canvas-1");

    expect(client.get).toHaveBeenCalledWith("/tenants/tenant-1/canvases/canvas-1", { signal: undefined });
  });

  it("create calls POST /tenants/:tenantId/canvases", async () => {
    await resource.create("tenant-1", {
      name: "Dining Floor",
      width: 1200,
      height: 800,
      elements: [],
    });

    expect(client.post).toHaveBeenCalledWith(
      "/tenants/tenant-1/canvases",
      {
        name: "Dining Floor",
        width: 1200,
        height: 800,
        elements: [],
      },
      { signal: undefined },
    );
  });

  it("update calls PUT /tenants/:tenantId/canvases/:canvasId", async () => {
    await resource.update("tenant-1", "canvas-1", {
      name: "Dining Floor v2",
      width: 1000,
    });

    expect(client.put).toHaveBeenCalledWith(
      "/tenants/tenant-1/canvases/canvas-1",
      { name: "Dining Floor v2", width: 1000 },
      { signal: undefined },
    );
  });

  it("delete calls DELETE /tenants/:tenantId/canvases/:canvasId", async () => {
    await resource.delete("tenant-1", "canvas-1");

    expect(client.delete).toHaveBeenCalledWith("/tenants/tenant-1/canvases/canvas-1", { signal: undefined });
  });
});
