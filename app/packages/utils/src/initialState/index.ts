import type { FloorCanvas } from "@restorio/types";

export const createInitialLayout = (tenantId: string, name: string, width: number, height: number): FloorCanvas => ({
  id: `canvas-${tenantId}-1`,
  tenantId,
  name,
  width,
  height,
  elements: [],
  version: 1,
});
