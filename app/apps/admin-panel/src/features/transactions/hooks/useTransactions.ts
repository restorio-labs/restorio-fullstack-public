import type { TransactionListData, TransactionListItem } from "@restorio/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { api } from "../../../api/client";
import { useCurrentTenant } from "../../../context/TenantContext";

const TRANSACTIONS_PAGE_SIZE = 20;

interface UseTransactionsResult {
  selectedTenantId: string | null;
  transactions: TransactionListItem[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  total: number;
  totalPages: number;
  pageSize: number;
}

export const useTransactions = (): UseTransactionsResult => {
  const { selectedTenantId } = useCurrentTenant();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(1);
  }, [selectedTenantId]);

  useEffect(() => {
    if (selectedTenantId === null) {
      return;
    }

    let cancelled = false;

    void (async (): Promise<void> => {
      try {
        await api.payments.reconcilePendingTransactions(selectedTenantId);
      } catch {
        // stale listing still loads below
      }
      if (!cancelled) {
        await queryClient.invalidateQueries({ queryKey: ["transactions", selectedTenantId], exact: false });
      }
    })();

    return (): void => {
      cancelled = true;
    };
  }, [queryClient, selectedTenantId]);

  const { data, isPending, isFetching, isError } = useQuery<TransactionListData>({
    queryKey: ["transactions", selectedTenantId ?? "", page],
    queryFn: ({ signal }) =>
      api.payments.listTransactions(selectedTenantId!, { page, pagination: TRANSACTIONS_PAGE_SIZE }, signal),
    enabled: selectedTenantId !== null,
  });

  return {
    selectedTenantId,
    transactions: data?.items ?? [],
    isLoading: isPending,
    isFetching,
    isError,
    page,
    setPage,
    total: data?.total ?? 0,
    totalPages: data?.total_pages ?? 0,
    pageSize: data?.page_size ?? TRANSACTIONS_PAGE_SIZE,
  };
};
