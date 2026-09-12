export const FLOOR_EDITOR_SHOW_GRID_STORAGE_KEY = "restorio:floorEditor:showGrid";

export const readFloorEditorShowGrid = (): boolean => {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const raw = window.localStorage.getItem(FLOOR_EDITOR_SHOW_GRID_STORAGE_KEY);

    if (raw === null) {
      return true;
    }

    return raw === "true";
  } catch {
    return true;
  }
};

export const writeFloorEditorShowGrid = (value: boolean): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FLOOR_EDITOR_SHOW_GRID_STORAGE_KEY, String(value));
  } catch {
    // ignore quota / private mode
  }
};
