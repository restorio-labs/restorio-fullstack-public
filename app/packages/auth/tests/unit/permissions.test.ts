import { UserRole } from "@restorio/types";
import { describe, it, expect } from "vitest";

import { hasAllPermissions, hasAnyPermission, hasPermission, Permissions } from "@restorio/auth";

describe("Permissions", () => {
  it("hasAnyPermission", () => {
    expect(hasAnyPermission(UserRole.SUPER_ADMIN, [Permissions.MANAGE_RESTAURANTS, Permissions.MANAGE_MENUS])).toBe(
      true,
    );
  });

  it("hasAllPermissions", () => {
    expect(hasAllPermissions(UserRole.SUPER_ADMIN, [Permissions.MANAGE_RESTAURANTS, Permissions.MANAGE_MENUS])).toBe(
      true,
    );
  });

  it("should allow super admin to manage restaurants", () => {
    expect(hasPermission(UserRole.SUPER_ADMIN, Permissions.MANAGE_RESTAURANTS)).toBe(true);
  });

  it("should allow owner to manage menus", () => {
    expect(hasPermission(UserRole.OWNER, Permissions.MANAGE_MENUS)).toBe(true);
  });

  it("should not allow waiter to manage users", () => {
    expect(hasPermission(UserRole.WAITER, Permissions.MANAGE_USERS)).toBe(false);
  });

  it("should allow kitchen staff to view orders", () => {
    expect(hasPermission(UserRole.KITCHEN_STAFF, Permissions.VIEW_ORDERS)).toBe(true);
  });

  it("should not allow kitchen staff to manage orders", () => {
    expect(hasPermission(UserRole.KITCHEN_STAFF, Permissions.MANAGE_ORDERS)).toBe(false);
  });
});
