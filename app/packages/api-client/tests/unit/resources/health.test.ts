import { describe, it, expect, beforeEach, vi } from "vitest";

import type { ApiClient } from "../../../src/client";
import { HealthResource } from "../../../src/resources/health";

type ApiClientMock = Pick<ApiClient, "getHttpStatus">;

describe("HealthResource", () => {
  let client: ApiClientMock;
  let resource: HealthResource;

  beforeEach(() => {
    vi.clearAllMocks();
    client = {
      getHttpStatus: vi.fn(),
    };
    resource = new HealthResource(client as ApiClient);
  });

  it("returns true when health returns 200", async () => {
    client.getHttpStatus = vi.fn().mockResolvedValue(200);
    await expect(resource.isReachable()).resolves.toBe(true);
    expect(client.getHttpStatus).toHaveBeenCalledWith("health");
  });

  it("returns false when health is not 200", async () => {
    client.getHttpStatus = vi.fn().mockResolvedValue(503);
    await expect(resource.isReachable()).resolves.toBe(false);
  });
});
