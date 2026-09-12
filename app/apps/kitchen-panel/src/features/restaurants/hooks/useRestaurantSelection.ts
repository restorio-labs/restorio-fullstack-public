import type { Restaurant } from "@restorio/types";
import { useCallback, useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RestaurantSelectionState {
  selections: Record<string, string>;
  setSelection: (tenantId: string, restaurantId: string) => void;
}

const useRestaurantSelectionStore = create<RestaurantSelectionState>()(
  persist(
    (set) => ({
      selections: {},
      setSelection: (tenantId, restaurantId): RestaurantSelectionState =>
        set((state) => ({
          selections: { ...state.selections, [tenantId]: restaurantId },
        })) as RestaurantSelectionState,
    }),
    {
      name: "kitchen-panel:restaurantSelection",
    },
  ),
);

export interface UseRestaurantSelectionReturn {
  selectedRestaurantId: string | null;
  setSelectedRestaurantId: (id: string) => void;
}

export const useRestaurantSelection = (
  tenantId: string,
  restaurants: readonly Restaurant[],
  defaultRestaurantId: string | null,
): UseRestaurantSelectionReturn => {
  const stored = useRestaurantSelectionStore((state) => state.selections[tenantId] ?? null);
  const setSelection = useRestaurantSelectionStore((state) => state.setSelection);

  const selectedRestaurantId = useMemo(() => {
    const storedIsValid = stored ? restaurants.some((restaurant) => restaurant.id === stored) : false;

    if (storedIsValid) {
      return stored;
    }

    return restaurants.length === 1 ? (restaurants[0]?.id ?? null) : defaultRestaurantId;
  }, [stored, restaurants, defaultRestaurantId]);

  const setSelectedRestaurantId = useCallback(
    (id: string): void => {
      setSelection(tenantId, id);
    },
    [tenantId, setSelection],
  );

  return {
    selectedRestaurantId,
    setSelectedRestaurantId,
  };
};
