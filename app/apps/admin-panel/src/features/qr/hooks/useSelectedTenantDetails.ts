import type { Tenant } from "@restorio/types";

import { useCurrentTenant } from "../../../context/TenantContext";

interface UseSelectedTenantDetailsResult {
  tenant: Tenant | null;
  isLoading: boolean;
}

export const useSelectedTenantDetails = (): UseSelectedTenantDetailsResult => {
  const { selectedTenantDetails, isSelectedTenantLoading } = useCurrentTenant();

  return { tenant: selectedTenantDetails, isLoading: isSelectedTenantLoading };
};
