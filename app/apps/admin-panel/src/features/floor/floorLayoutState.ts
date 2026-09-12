import type { ElementToAdd, FloorLayoutEditorState, FloorCanvas, FloorElement } from "@restorio/types";

const nextId = (): string => `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const renumberTables = (elements: FloorElement[]): FloorElement[] => {
  const tableIdsInOrder = elements
    .filter((element): element is Extract<FloorElement, { type: "table" }> => element.type === "table")
    .sort((left, right) => left.tableNumber - right.tableNumber)
    .map((element) => element.id);

  if (tableIdsInOrder.length === 0) {
    return elements;
  }

  const nextTableNumbers = new Map(tableIdsInOrder.map((id, index) => [id, index + 1]));

  return elements.map((element) => {
    if (element.type !== "table") {
      return element;
    }

    return {
      ...element,
      tableNumber: nextTableNumbers.get(element.id) ?? element.tableNumber,
    };
  });
};

export type FloorEditorHistoryAction =
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

export const cloneFloorElement = (element: FloorElement): FloorElement => ({
  ...element,
  id: nextId(),
});

export const createElementFromToAdd = (toAdd: ElementToAdd, _tenantId?: string): FloorElement => {
  const id = nextId();
  const base = { id, x: 0, y: 0, w: 80, h: 80, zoneId: undefined };

  switch (toAdd.type) {
    case "table":
      return {
        ...base,
        type: "table",
        tableNumber: toAdd.tableNumber ?? 0,
        seats: toAdd.seats,
        label: toAdd.label,
      };
    case "tableGroup":
      return {
        ...base,
        type: "tableGroup",
        tableNumbers: toAdd.tableNumbers,
        seats: toAdd.seats,
      };
    case "bar":
      return { ...base, type: "bar", label: toAdd.label ?? "Bar", w: 120, h: 60 };
    case "zone":
      return {
        ...base,
        type: "zone",
        name: toAdd.name,
        color: toAdd.color,
        w: 200,
        h: 120,
      };
    case "wall":
      return { ...base, type: "wall", w: 60, h: 20 };
    case "entrance":
      return { ...base, type: "entrance", label: toAdd.label ?? "Entrance", w: 80, h: 40 };
    default:
      return { ...base, type: "wall", w: 60, h: 20 };
  }
};

export const layoutHistoryReducer = (
  state: FloorLayoutEditorState,
  action: FloorEditorHistoryAction,
): FloorLayoutEditorState => {
  const maxHistory = 50;
  const pushHistory = (layout: FloorCanvas): FloorCanvas[] => {
    const next = [...state.history.slice(0, state.historyIndex + 1), layout];

    return next.length > maxHistory ? next.slice(-maxHistory) : next;
  };

  switch (action.type) {
    case "SET_LAYOUT": {
      return {
        layout: action.payload,
        history: [action.payload],
        historyIndex: 0,
      };
    }
    case "UPDATE_ELEMENT": {
      const applyElementUpdate = (): FloorCanvas => {
        const { id, bounds, recordHistory: _recordHistory, tableLabel, ...rest } = action.payload;
        const elements = state.layout.elements.map((el) => {
          if (el.id !== id) {
            return el;
          }

          const tablePatch = el.type === "table" && tableLabel !== undefined ? { label: tableLabel } : {};

          return { ...el, ...(bounds ?? {}), ...rest, ...tablePatch };
        });

        return { ...state.layout, elements };
      };

      const nextLayout = applyElementUpdate();

      if (action.payload.recordHistory === false) {
        return {
          ...state,
          layout: nextLayout,
        };
      }

      const history = pushHistory(nextLayout);

      return {
        layout: nextLayout,
        history,
        historyIndex: history.length - 1,
      };
    }
    case "ADD_ELEMENT": {
      const { element, x, y } = action.payload;
      const maxZIndex = state.layout.elements.reduce((max, el) => Math.max(max, Number(el.zIndex ?? 0)), 0);
      const placed = {
        ...element,
        x,
        y,
        w: element.w || 80,
        h: element.h || 80,
        zIndex: Number(element.zIndex ?? maxZIndex + 1),
      };
      const elements = [...state.layout.elements, placed];
      const nextLayout = { ...state.layout, elements };
      const history = pushHistory(nextLayout);

      return {
        layout: nextLayout,
        history,
        historyIndex: history.length - 1,
      };
    }
    case "REMOVE_ELEMENT": {
      const elements = renumberTables(state.layout.elements.filter((el) => el.id !== action.payload.id));
      const nextLayout = { ...state.layout, elements };
      const history = pushHistory(nextLayout);

      return {
        layout: nextLayout,
        history,
        historyIndex: history.length - 1,
      };
    }
    case "COMMIT_LAYOUT": {
      if (state.history[state.historyIndex] === state.layout) {
        return state;
      }

      const history = pushHistory(state.layout);

      return {
        ...state,
        history,
        historyIndex: history.length - 1,
      };
    }
    case "UNDO": {
      if (state.historyIndex <= 0) {
        return state;
      }
      const nextIndex = state.historyIndex - 1;

      return {
        ...state,
        layout: state.history[nextIndex],
        historyIndex: nextIndex,
      };
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) {
        return state;
      }
      const nextIndex = state.historyIndex + 1;

      return {
        ...state,
        layout: state.history[nextIndex],
        historyIndex: nextIndex,
      };
    }
    default:
      return state;
  }
};
