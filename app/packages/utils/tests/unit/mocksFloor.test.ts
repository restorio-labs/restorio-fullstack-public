import { describe, expect, it } from "vitest";

import { getActiveCanvas, getTenantById, mockTenants } from "@restorio/utils";

describe("mockTenants", () => {
  it("defines a stable set of tenants", () => {
    expect(mockTenants).toHaveLength(2);
    expect(mockTenants[0].id).toBe("venue-1");
    expect(mockTenants[1].id).toBe("venue-2");
  });

  it("creates tenants with Date createdAt fields", () => {
    expect(mockTenants[0].createdAt).toBeInstanceOf(Date);
    expect(mockTenants[1].createdAt).toBeInstanceOf(Date);
  });
});

describe("getTenantById", () => {
  it("returns the tenant when the id exists", () => {
    const tenant = getTenantById("venue-1");

    expect(tenant).toBeDefined();
    expect(tenant?.id).toBe("venue-1");
  });

  it("returns undefined when the id does not exist", () => {
    expect(getTenantById("unknown-venue")).toBeUndefined();
  });

  it("returns undefined when id is undefined", () => {
    expect(getTenantById(undefined)).toBeUndefined();
  });
});

describe("getActiveCanvas", () => {
  it("returns undefined when a tenant has no canvases", () => {
    const [first] = mockTenants;
    const tenantWithoutCanvases = {
      ...first,
      floorCanvases: [],
      activeLayoutVersionId: null,
    };

    expect(getActiveCanvas(tenantWithoutCanvases)).toBeUndefined();
  });

  it("returns the canvas matching activeLayoutVersionId when present", () => {
    const [tenant] = mockTenants;

    const active = getActiveCanvas(tenant);

    expect(active?.id).toBe(tenant.activeLayoutVersionId);
  });

  it("falls back to the first canvas when there is no activeLayoutVersionId match", () => {
    const [, secondTenant] = mockTenants;

    const active = getActiveCanvas(secondTenant);

    expect(active).toBe(secondTenant.floorCanvases[0]);
  });
});
