import type { Restaurant, TenantSummary } from "@restorio/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { api } from "../../../api/client";

interface TenantRestaurantsResult {
  restaurants: readonly Restaurant[];
  defaultRestaurantId: string | null;
  isLoading: boolean;
}

const tenantSummaryToRestaurant = (tenant: TenantSummary): Restaurant => ({
  id: tenant.id,
  tenantId: tenant.id,
  name: tenant.name,
  address: { street: "", city: "", postalCode: "", country: "" },
  contactInfo: {},
  openingHours: [],
  createdAt: tenant.createdAt,
  updatedAt: tenant.createdAt,
});

export const useTenantRestaurants = (tenantId: string): TenantRestaurantsResult => {
  const { data, isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => api.tenants.list(),
  });

  const restaurants: readonly Restaurant[] = useMemo(() => {
    if (!data) {
      return [];
    }

    const match = data.find((tenant) => tenant.id === tenantId);

    if (!match) {
      return [];
    }

    return [tenantSummaryToRestaurant(match)];
  }, [data, tenantId]);

  const defaultRestaurantId = restaurants[0]?.id ?? null;

  return { restaurants, defaultRestaurantId, isLoading };
};
