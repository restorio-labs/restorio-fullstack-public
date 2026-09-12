import type { TenantSummary } from "@restorio/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { api } from "../api/client";

type TenantsState = "idle" | "loading" | "loaded" | "error";

export const tenantsQueryKey = ["tenants"] as const;

export const useTenants = (): {
  tenants: TenantSummary[];
  state: TenantsState;
  refresh: () => void;
} => {
  const queryClient = useQueryClient();

  const { data, status } = useQuery({
    queryKey: tenantsQueryKey,
    queryFn: () => api.tenants.list(),
  });

  const state: TenantsState = status === "pending" ? "loading" : status === "error" ? "error" : "loaded";

  const refresh = useCallback((): void => {
    void queryClient.invalidateQueries({ queryKey: tenantsQueryKey });
  }, [queryClient]);

  return { tenants: data ?? [], state, refresh };
};
