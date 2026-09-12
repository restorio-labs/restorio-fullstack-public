import type { TransactionListData } from "@restorio/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import React, { type PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/api/client", () => ({
  api: {
    payments: {
      listTransactions: vi.fn(),
    },
  },
}));

vi.mock("../../../src/context/TenantContext", () => ({
  useCurrentTenant: vi.fn(),
}));

import { api } from "../../../src/api/client";
import { useCurrentTenant } from "../../../src/context/TenantContext";
import { useTransactions } from "../../../src/features/transactions/hooks/useTransactions";

const mockListTransactions = api.payments.listTransactions as ReturnType<typeof vi.fn>;
const mockUseCurrentTenant = useCurrentTenant as ReturnType<typeof vi.fn>;

const emptyPage: TransactionListData = {
  items: [],
  total: 0,
  page: 1,
  page_size: 20,
  total_pages: 0,
};

const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: PropsWithChildren): React.JSX.Element {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };

describe("useTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentTenant.mockReturnValue({ selectedTenantId: null });
  });

  it("does not fetch when no tenant is selected", async () => {
    mockListTransactions.mockResolvedValue(emptyPage);

    const queryClient = createQueryClient();
    renderHook(() => useTransactions(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(mockListTransactions).not.toHaveBeenCalled();
    });
  });

  it("loads transactions for the selected tenant with pagination", async () => {
    mockUseCurrentTenant.mockReturnValue({ selectedTenantId: "tenant-1" });
    const data: TransactionListData = {
      items: [
        {
          session_id: "550e8400-e29b-41d4-a716-446655440000",
          p24_order_id: 1,
          amount: 1000,
          email: "a@b.c",
          status: 2,
          description: "Test",
          order: null,
          note: null,
          created_at: "2026-01-01T12:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
    };
    mockListTransactions.mockResolvedValue(data);

    const queryClient = createQueryClient();
    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockListTransactions).toHaveBeenCalledWith("tenant-1", { page: 1, pagination: 20 }, expect.any(AbortSignal));
    expect(result.current.transactions).toEqual(data.items);
    expect(result.current.total).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.page).toBe(1);
  });

  it("requests the next page when setPage is used", async () => {
    mockUseCurrentTenant.mockReturnValue({ selectedTenantId: "tenant-1" });
    mockListTransactions.mockResolvedValue(emptyPage);

    const queryClient = createQueryClient();
    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockListTransactions.mockClear();
    mockListTransactions.mockResolvedValue({ ...emptyPage, page: 2, total: 40, total_pages: 2 });

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => {
      expect(mockListTransactions).toHaveBeenCalledWith(
        "tenant-1",
        { page: 2, pagination: 20 },
        expect.any(AbortSignal),
      );
    });

    expect(result.current.page).toBe(2);
  });

  it("resets page to 1 when selected tenant changes", async () => {
    mockUseCurrentTenant.mockReturnValue({ selectedTenantId: "tenant-a" });
    mockListTransactions.mockResolvedValue(emptyPage);

    const queryClient = createQueryClient();
    const { result, rerender } = renderHook(() => useTransactions(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPage(3);
    });

    await waitFor(() => {
      expect(result.current.page).toBe(3);
    });

    mockUseCurrentTenant.mockReturnValue({ selectedTenantId: "tenant-b" });
    rerender();

    await waitFor(() => {
      expect(result.current.page).toBe(1);
    });
  });

  it("sets isError when the list request fails", async () => {
    mockUseCurrentTenant.mockReturnValue({ selectedTenantId: "tenant-1" });
    mockListTransactions.mockRejectedValue(new Error("network"));

    const queryClient = createQueryClient();
    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.transactions).toEqual([]);
  });
});
