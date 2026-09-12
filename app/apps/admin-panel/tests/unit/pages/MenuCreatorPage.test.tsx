/* eslint-disable @typescript-eslint/no-unsafe-call */
import { act, fireEvent, render, screen, waitFor, within, type RenderResult } from "@testing-library/react";
import { I18nProvider } from "@restorio/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { ROUTER_FUTURE_FLAGS } from "../routerFutureFlags";

vi.mock("@restorio/ui", async () => {
  const actual = await vi.importActual<typeof import("@restorio/ui")>("@restorio/ui");

  return {
    ...actual,
    useToast: () => ({ showToast: vi.fn() }),
  };
});

vi.mock("../../../src/api/client", () => ({
  api: {
    menus: {
      get: vi.fn(),
      save: vi.fn(),
    },
  },
}));

vi.mock("../../../src/context/TenantContext", () => ({
  useCurrentTenant: vi.fn(),
}));

import { api } from "../../../src/api/client";
import { useCurrentTenant } from "../../../src/context/TenantContext";
import { fallbackMessages, getMessages } from "../../../src/i18n/messages";
import { MenuCreatorPage } from "../../../src/pages/MenuCreatorPage";
import React from "react";

const TENANT_ID = "550e8400-e29b-41d4-a716-446655440000";
const mockMenusGet = api.menus.get as Mock;
const mockMenusSave = api.menus.save as Mock;
const mockUseCurrentTenant = useCurrentTenant as Mock;

const renderPage = (): RenderResult =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <I18nProvider locale="en" messages={getMessages("en")} fallbackMessages={fallbackMessages}>
        <MemoryRouter future={ROUTER_FUTURE_FLAGS}>
          <MenuCreatorPage />
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>,
  );

const baseMenuResponse = {
  tenantId: TENANT_ID,
  tenantID: TENANT_ID,
  menu: {},
  categories: [
    {
      name: "First",
      order: 0,
      items: [{ name: "Soup", price: 12, promoted: false, isAvailable: true, desc: "Hot soup", tags: ["vegan"] }],
    },
    {
      name: "Second",
      order: 1,
      items: [{ name: "Steak", price: 45, promoted: true, isAvailable: true, desc: "Premium", tags: [] }],
    },
  ],
};

describe("MenuCreatorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: TENANT_ID,
      selectedTenant: {
        id: TENANT_ID,
        name: "Main Restaurant",
      },
      tenants: [],
      tenantsState: "loaded",
      setSelectedTenantId: vi.fn(),
    });
    const freshMenu = (): typeof baseMenuResponse => JSON.parse(JSON.stringify(baseMenuResponse));
    mockMenusGet.mockImplementation(() => Promise.resolve(freshMenu()));
    mockMenusSave.mockImplementation(() => Promise.resolve(freshMenu()));
  });

  it("renders remove item as icon button", async () => {
    renderPage();

    const removeButton = (await screen.findAllByRole("button", { name: /remove item/i }))[0];
    expect(removeButton.querySelector("svg")).toBeTruthy();
    // @ts-expect-error - toHaveTextContent is not a valid assertion
    expect(removeButton).not.toHaveTextContent(/^x$/i);
  });

  it("marks item as inactive when active checkbox is unchecked", async () => {
    renderPage();

    await screen.findByDisplayValue("Soup");
    const firstCategorySection = screen.getAllByPlaceholderText(/e\.g\. Starters/i)[0].closest("section");
    if (!firstCategorySection) {
      throw new Error("category section not found");
    }
    const activeCheckbox = within(firstCategorySection).getByRole("checkbox", { name: /^Active$/ });
    await act(async () => {
      fireEvent.click(activeCheckbox);
    });
    await waitFor(
      () => {
        expect(activeCheckbox).not.toBeChecked();
      },
      { timeout: 10_000 },
    );
    fireEvent.click(screen.getByRole("button", { name: /save menu/i }));

    await waitFor(
      () => {
        expect(mockMenusSave).toHaveBeenCalledWith(
          TENANT_ID,
          expect.objectContaining({
            categories: expect.arrayContaining([
              expect.objectContaining({
                items: expect.arrayContaining([expect.objectContaining({ name: "Soup", isAvailable: false })]),
              }),
            ]),
          }),
        );
      },
      { timeout: 5000 },
    );
  });

  it("renders tag controls and removes tags using minus control", async () => {
    renderPage();

    await screen.findAllByPlaceholderText(/type a tag and click \+/i);
    expect(screen.getAllByText("+").length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getAllByText("-").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText("-")[0]);

    await waitFor(() => {
      // @ts-expect-error - toBeInTheDocument is not a valid assertion
      expect(screen.queryByText("vegan")).not.toBeInTheDocument();
    });
  });

  it("reorders categories with arrows and saves correct order", async () => {
    renderPage();

    await screen.findByDisplayValue("First");

    fireEvent.click(screen.getAllByRole("button", { name: /move category down/i })[0]);
    await waitFor(() => {
      // @ts-expect-error - toHaveValue is not a valid assertion
      expect(screen.getAllByDisplayValue(/First|Second/)[0]).toHaveValue("Second");
    });
    fireEvent.click(screen.getByRole("button", { name: /save menu/i }));

    await waitFor(() => {
      expect(mockMenusSave).toHaveBeenCalledWith(
        TENANT_ID,
        expect.objectContaining({
          categories: [
            expect.objectContaining({ name: "Second", order: 0 }),
            expect.objectContaining({ name: "First", order: 1 }),
          ],
        }),
      );
    });
  });
});
