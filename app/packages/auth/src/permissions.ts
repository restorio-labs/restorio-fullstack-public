import { UserRole } from "@restorio/types";

export const Permissions = {
  MANAGE_RESTAURANTS: "manage_restaurants",
  MANAGE_MENUS: "manage_menus",
  MANAGE_ORDERS: "manage_orders",
  VIEW_ORDERS: "view_orders",
  MANAGE_TABLES: "manage_tables",
  MANAGE_USERS: "manage_users",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_SETTINGS: "manage_settings",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permissions.MANAGE_RESTAURANTS,
    Permissions.MANAGE_MENUS,
    Permissions.MANAGE_ORDERS,
    Permissions.VIEW_ORDERS,
    Permissions.MANAGE_TABLES,
    Permissions.MANAGE_USERS,
    Permissions.VIEW_ANALYTICS,
    Permissions.MANAGE_SETTINGS,
  ],
  [UserRole.ADMIN]: [
    Permissions.MANAGE_RESTAURANTS,
    Permissions.MANAGE_MENUS,
    Permissions.MANAGE_ORDERS,
    Permissions.VIEW_ORDERS,
    Permissions.MANAGE_TABLES,
    Permissions.MANAGE_USERS,
    Permissions.VIEW_ANALYTICS,
    Permissions.MANAGE_SETTINGS,
  ],
  [UserRole.OWNER]: [
    Permissions.MANAGE_RESTAURANTS,
    Permissions.MANAGE_MENUS,
    Permissions.MANAGE_ORDERS,
    Permissions.VIEW_ORDERS,
    Permissions.MANAGE_TABLES,
    Permissions.MANAGE_USERS,
    Permissions.VIEW_ANALYTICS,
    Permissions.MANAGE_SETTINGS,
  ],
  [UserRole.MANAGER]: [
    Permissions.MANAGE_MENUS,
    Permissions.MANAGE_ORDERS,
    Permissions.VIEW_ORDERS,
    Permissions.MANAGE_TABLES,
    Permissions.VIEW_ANALYTICS,
  ],
  [UserRole.WAITER]: [Permissions.VIEW_ORDERS, Permissions.MANAGE_ORDERS],
  [UserRole.KITCHEN_STAFF]: [Permissions.VIEW_ORDERS],
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return rolePermissions[role].includes(permission);
};

export const hasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.some((permission) => hasPermission(role, permission));
};

export const hasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  return permissions.every((permission) => hasPermission(role, permission));
};
