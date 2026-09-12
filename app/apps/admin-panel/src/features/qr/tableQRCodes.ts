import type { FloorTableElement, Tenant } from "@restorio/types";
import { getAppHref } from "@restorio/utils";

export interface TenantFloorTableInfo {
  tableNumber: number;
  elementId: string;
}

export interface TenantFloorTablesGroup {
  canvasId: string;
  floorName: string;
  tables: TenantFloorTableInfo[];
}

export interface TenantFloorTableEntry {
  canvasId: string;
  floorName: string;
  tableId: number;
  elementId: string;
}

export const getTenantTablesByFloor = (tenant: Tenant): TenantFloorTablesGroup[] => {
  return tenant.floorCanvases.map((canvas) => {
    const tableElements = canvas.elements.filter((element): element is FloorTableElement => element.type === "table");
    const tables: TenantFloorTableInfo[] = tableElements
      .map((element) => ({ tableNumber: element.tableNumber, elementId: element.id }))
      .sort((a, b) => a.tableNumber - b.tableNumber);

    return {
      canvasId: canvas.id,
      floorName: canvas.name,
      tables,
    };
  });
};

export const getTenantTableEntries = (tenant: Tenant): TenantFloorTableEntry[] => {
  return getTenantTablesByFloor(tenant).flatMap((floor) =>
    floor.tables.map((row) => ({
      canvasId: floor.canvasId,
      floorName: floor.floorName,
      tableId: row.tableNumber,
      elementId: row.elementId,
    })),
  );
};

export const getTableQrUrl = (tenantSlug: string, tableNumber: number, elementId?: string): string => {
  const base = `${getAppHref("mobile-app")}/${tenantSlug}/table/${tableNumber}`;
  const trimmed = elementId?.trim();

  if (trimmed) {
    return `${base}?ref=${encodeURIComponent(trimmed)}`;
  }

  return base;
};
