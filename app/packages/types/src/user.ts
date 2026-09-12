export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  OWNER = "owner",
  MANAGER = "manager",
  WAITER = "waiter",
  KITCHEN_STAFF = "kitchen",
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
  exp: number;
}
