/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen, type RenderResult } from "@testing-library/react";
import { I18nProvider } from "@restorio/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { ROUTER_FUTURE_FLAGS } from "../routerFutureFlags";

vi.mock("@restorio/ui", async () => {
  const actual = await vi.importActual<typeof import("@restorio/ui")>("@restorio/ui");

  return {
    ...actual,
    useMediaQuery: () => true,
    useToast: () => ({ showToast: vi.fn() }),
  };
});

vi.mock("../../../src/context/TenantContext", () => ({
  useCurrentTenant: vi.fn(),
  tenantDetailsQueryKey: (tenantId: string) => ["tenant", tenantId] as const,
}));

import { useCurrentTenant } from "../../../src/context/TenantContext";
import { fallbackMessages, getMessages } from "../../../src/i18n/messages";
import { FloorEditorPage } from "../../../src/pages/FloorEditorPage";

const mockUseCurrentTenant = useCurrentTenant as Mock;

const renderPage = (): RenderResult =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <I18nProvider locale="en" messages={getMessages("en")} fallbackMessages={fallbackMessages}>
        <MemoryRouter future={ROUTER_FUTURE_FLAGS}>
          <FloorEditorPage />
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>,
  );

describe("FloorEditorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows no-restaurant message only when there is no selected tenant id", () => {
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: null,
      selectedTenantDetails: null,
      tenantsState: "loaded",
      isSelectedTenantLoading: false,
      tenants: [],
      selectedTenant: null,
      setSelectedTenantId: vi.fn(),
      refreshTenants: vi.fn(),
    });

    renderPage();

    expect(screen.getByText(/select a restaurant from the sidebar/i)).toBeInTheDocument();
  });

  it("shows error state when tenant id is selected but tenant details cannot be resolved", () => {
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: "tenant-new",
      selectedTenantDetails: null,
      tenantsState: "loaded",
      isSelectedTenantLoading: false,
      tenants: [{ id: "tenant-new", name: "New Restaurant", slug: "new", status: "ACTIVE", floorCanvasCount: 0 }],
      selectedTenant: { id: "tenant-new", name: "New Restaurant", slug: "new", status: "ACTIVE", floorCanvasCount: 0 },
      setSelectedTenantId: vi.fn(),
      refreshTenants: vi.fn(),
    });

    renderPage();

    expect(screen.getByText(/failed to load restaurant/i)).toBeInTheDocument();
    expect(screen.queryByText(/select a restaurant from the sidebar/i)).not.toBeInTheDocument();
  });

  it("checks canvases on the current tenant details and shows empty-state for selected tenant with none", () => {
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: "tenant-empty",
      selectedTenantDetails: {
        id: "tenant-empty",
        name: "Brand New",
        slug: "brand-new",
        status: "ACTIVE",
        floorCanvases: [],
        activeLayoutVersionId: null,
        createdAt: new Date().toISOString(),
      },
      tenantsState: "loaded",
      isSelectedTenantLoading: false,
      tenants: [
        { id: "tenant-empty", name: "Brand New", slug: "brand-new", status: "ACTIVE", floorCanvasCount: 0 },
        { id: "tenant-old", name: "Old", slug: "old", status: "ACTIVE", floorCanvasCount: 3 },
      ],
      selectedTenant: {
        id: "tenant-empty",
        name: "Brand New",
        slug: "brand-new",
        status: "ACTIVE",
        floorCanvasCount: 0,
      },
      setSelectedTenantId: vi.fn(),
      refreshTenants: vi.fn(),
    });

    renderPage();

    expect(screen.getByText(/no floor layout exists for this restaurant yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create floor layout/i })).toBeInTheDocument();
  });
});
