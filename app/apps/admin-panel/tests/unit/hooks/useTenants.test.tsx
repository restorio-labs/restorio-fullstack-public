import type { TenantSummary } from "@restorio/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React, { type PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../src/api/client", () => ({
  api: {
    tenants: {
      list: vi.fn(),
    },
  },
}));

import { api } from "../../../src/api/client";
import { useTenants } from "../../../src/hooks/useTenants";

const mockListTenants = api.tenants.list as ReturnType<typeof vi.fn>;

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

describe("useTenants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns loaded tenants after successful query", async () => {
    const tenants: TenantSummary[] = [
      {
        id: "tenant-1",
        name: "Balans",
        slug: "balans",
        status: "ACTIVE",
        activeLayoutVersionId: null,
        floorCanvasCount: 1,
        createdAt: new Date(),
      },
    ];
    mockListTenants.mockResolvedValueOnce(tenants);

    const queryClient = createQueryClient();
    const { result } = renderHook(() => useTenants(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.state).toBe("loaded");
    });

    expect(result.current.tenants).toEqual(tenants);
  });

  it("returns error state when query fails", async () => {
    mockListTenants.mockRejectedValueOnce(new Error("request failed"));

    const queryClient = createQueryClient();
    const { result } = renderHook(() => useTenants(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.state).toBe("error");
    });
    expect(result.current.tenants).toEqual([]);
  });

  it("invalidates tenants query on refresh", async () => {
    mockListTenants.mockResolvedValue([]);

    const queryClient = createQueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useTenants(), { wrapper: createWrapper(queryClient) });

    await waitFor(() => {
      expect(result.current.state).toBe("loaded");
    });

    result.current.refresh();

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["tenants"],
    });
  });
});
