export type TableRuntimeState = "free" | "occupied" | "reserved" | "dirty";

export type OrderStatusDisplay =
  | "browsing"
  | "ordering"
  | "ordered"
  | "preparing"
  | "ready_to_serve"
  | "served"
  | "bill_requested"
  | "rejected";

export interface TableDisplayInfo {
  guestCount?: number;
  orderStatus?: OrderStatusDisplay;
  orderStatusLabel?: string;
  occupationTimeLabel?: string;
  needHelp?: boolean;
  servedByName?: string;
  servedBySurname?: string;
}

export interface CanvasBounds {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
}

export interface FloorElementBase extends CanvasBounds {
  id: string;
  zoneId?: string;
  zIndex?: number;
}

export interface FloorTableElement extends FloorElementBase {
  type: "table";
  tableNumber: number;
  seats: number;
  label?: string;
}

export interface FloorTableGroupElement extends FloorElementBase {
  type: "tableGroup";
  tableNumbers: string[];
  seats: number;
}

export interface FloorBarElement extends FloorElementBase {
  type: "bar";
  label?: string;
}

export interface FloorZoneElement extends FloorElementBase {
  type: "zone";
  name: string;
  color?: string;
}

export interface FloorWallElement extends FloorElementBase {
  type: "wall";
}

export interface FloorEntranceElement extends FloorElementBase {
  type: "entrance";
  label?: string;
}

export type FloorElement =
  | FloorTableElement
  | FloorTableGroupElement
  | FloorBarElement
  | FloorZoneElement
  | FloorWallElement
  | FloorEntranceElement;

export interface FloorCanvas {
  id: string;
  tenantId: string;
  name: string;
  width: number;
  height: number;
  elements: FloorElement[];
  version: number;
}

export interface FloorLayoutEditorState {
  layout: FloorCanvas;
  history: FloorCanvas[];
  historyIndex: number;
}

export type ElementToAdd =
  | { type: "table"; seats: number; tableNumber?: number; label?: string }
  | { type: "tableGroup"; tableNumbers: string[]; seats: number }
  | { type: "bar"; label?: string }
  | { type: "zone"; name: string; color?: string }
  | { type: "wall" }
  | { type: "entrance"; label?: string };

export type LayoutHistoryAction =
  | { type: "SET_LAYOUT"; payload: FloorCanvas }
  | {
      type: "UPDATE_ELEMENT";
      payload: {
        id: string;
        bounds?: { x: number; y: number; w: number; h: number; rotation?: number };
        color?: string;
        name?: string;
        tableNumbers?: string[];
        seats?: number;
        tableLabel?: string;
        label?: string;
        zIndex?: number;
        recordHistory?: boolean;
      };
    }
  | { type: "ADD_ELEMENT"; payload: { element: FloorElement; x: number; y: number } }
  | { type: "REMOVE_ELEMENT"; payload: { id: string } }
  | { type: "COMMIT_LAYOUT" }
  | { type: "UNDO" }
  | { type: "REDO" };
