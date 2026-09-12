import type { FloorCanvas } from "./floorCanvas";

export type TenantStatus = "ACTIVE" | "SUSPENDED" | "INACTIVE";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  activeLayoutVersionId: string | null;
  floorCanvases: FloorCanvas[];
  createdAt: Date;
}

export interface TenantSummary extends Omit<Tenant, "floorCanvases"> {
  floorCanvasCount: number;
}

export interface TenantSettings {
  tenantId: string;
  currency: string;
  timezone: string;
  language: string;
  theme?: Record<string, string>;
}
