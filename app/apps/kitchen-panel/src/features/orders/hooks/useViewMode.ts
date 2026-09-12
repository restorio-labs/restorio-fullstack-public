import { useCallback } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "sliding" | "all";

interface ViewModeState {
  viewModes: Record<string, ViewMode>;
  setViewMode: (tenantId: string, mode: ViewMode) => void;
}

const useViewModeStore = create<ViewModeState>()(
  persist(
    (set): ViewModeState => ({
      viewModes: {},
      setViewMode: (tenantId: string, mode: ViewMode): void => {
        set(
          (state): Pick<ViewModeState, "viewModes"> => ({
            viewModes: { ...state.viewModes, [tenantId]: mode },
          }),
        );
      },
    }),
    {
      name: "kitchen-panel:viewMode",
    },
  ),
);

export interface UseViewModeReturn {
  viewMode: ViewMode;
  toggleViewMode: () => void;
}

export const useViewMode = (tenantId: string): UseViewModeReturn => {
  const viewMode = useViewModeStore((state) => state.viewModes[tenantId] ?? "sliding");
  const setViewMode = useViewModeStore((state) => state.setViewMode);

  const toggleViewMode = useCallback((): void => {
    const nextMode: ViewMode = viewMode === "sliding" ? "all" : "sliding";

    setViewMode(tenantId, nextMode);
  }, [viewMode, tenantId, setViewMode]);

  return {
    viewMode,
    toggleViewMode,
  };
};
