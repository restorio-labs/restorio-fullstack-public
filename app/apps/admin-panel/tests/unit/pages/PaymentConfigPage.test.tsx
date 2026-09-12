/* eslint-disable @typescript-eslint/no-unsafe-call */
import { fireEvent, render, screen, waitFor, type RenderResult } from "@testing-library/react";
import { I18nProvider } from "@restorio/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

import { ROUTER_FUTURE_FLAGS } from "../routerFutureFlags";

vi.mock("../../../src/api/client", () => ({
  api: {
    payments: {
      getP24Config: vi.fn(),
      updateP24Config: vi.fn(),
    },
  },
}));

vi.mock("../../../src/context/TenantContext", () => ({
  useCurrentTenant: vi.fn(),
}));

import { api } from "../../../src/api/client";
import { useCurrentTenant } from "../../../src/context/TenantContext";
import { fallbackMessages, getMessages } from "../../../src/i18n/messages";
import { PaymentConfigPage } from "../../../src/pages/PaymentConfigPage";

// eslint-disable-next-line @typescript-eslint/unbound-method
const mockUpdateP24Config = api.payments.updateP24Config as Mock;
const mockGetP24Config = api.payments.getP24Config as Mock;
const mockUseCurrentTenant = useCurrentTenant as Mock;
const API_KEY = "a".repeat(32);
const CRC_KEY = "b".repeat(16);

const awaitInitialP24Query = async (): Promise<void> => {
  await waitFor(() => {
    expect(mockGetP24Config).toHaveBeenCalled();
  });
};

const renderPage = (): RenderResult =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <I18nProvider locale="en" messages={getMessages("en")} fallbackMessages={fallbackMessages}>
        <MemoryRouter future={ROUTER_FUTURE_FLAGS}>
          <PaymentConfigPage />
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>,
  );

const fillPaymentForm = (merchantId: string, apiKey: string, crcKey: string): void => {
  fireEvent.change(screen.getByLabelText(/merchant id/i), { target: { value: merchantId } });
  fireEvent.change(screen.getByLabelText(/p24 api key/i), { target: { value: apiKey } });
  fireEvent.change(screen.getByLabelText(/p24 crc key/i), { target: { value: crcKey } });
};

const clickSaveConfiguration = (): void => {
  const form = document.getElementById("payment-config-form");

  if (!form) {
    throw new Error("payment form not found");
  }

  fireEvent.submit(form);
};

describe("PaymentConfigPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetP24Config.mockResolvedValue({
      p24Merchantid: null,
      p24Api: null,
      p24Crc: null,
    });
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: "550e8400-e29b-41d4-a716-446655440000",
      selectedTenant: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Main Restaurant",
      },
      tenants: [],
      tenantsState: "loaded",
      setSelectedTenantId: vi.fn(),
    });
  });

  it("loads saved P24 config into the form", async () => {
    mockGetP24Config.mockResolvedValueOnce({
      p24Merchantid: 123456,
      p24Api: API_KEY,
      p24Crc: CRC_KEY,
    });
    renderPage();

    await waitFor(() => {
      expect(mockGetP24Config).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000", expect.any(AbortSignal));
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save configuration/i })).toBeEnabled();
    });

    expect(screen.getByLabelText(/merchant id/i)).toHaveValue(123456);
    expect(screen.getByLabelText(/p24 api key/i)).toHaveValue(API_KEY);
    expect(screen.getByLabelText(/p24 crc key/i)).toHaveValue(CRC_KEY);
  });

  it("renders selected restaurant details and payment fields", () => {
    renderPage();

    expect(screen.getByText(/payment configurations/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/merchant id/i)).toBeDefined();
    expect(screen.getByLabelText(/p24 api key/i)).toBeDefined();
    expect(screen.getByLabelText(/p24 crc key/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /save configuration/i })).toBeDefined();
  });

  it("disables submit button when form is empty", async () => {
    renderPage();

    await awaitInitialP24Query();

    expect(screen.getByRole("button", { name: /save configuration/i })).toBeDisabled();
  });

  it("enables submit button when all fields are filled", async () => {
    renderPage();

    await awaitInitialP24Query();

    fillPaymentForm("123456", API_KEY, CRC_KEY);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save configuration/i })).toBeEnabled();
    });
  });

  it("calls API with selected tenant on submit", async () => {
    mockUpdateP24Config.mockResolvedValueOnce(undefined);
    renderPage();

    await awaitInitialP24Query();

    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(mockUpdateP24Config).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000", {
        p24_merchantid: 123456,
        p24_api: API_KEY,
        p24_crc: CRC_KEY,
      });
    });
  });

  it("shows success message after successful submit", async () => {
    mockUpdateP24Config.mockResolvedValueOnce(undefined);
    renderPage();

    await awaitInitialP24Query();

    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(screen.getByText(/p24 configuration updated successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error message when API call fails", async () => {
    mockUpdateP24Config.mockRejectedValueOnce(new Error("Network error"));
    renderPage();

    await awaitInitialP24Query();

    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it("shows validation feedback when API returns 422 fields", async () => {
    mockUpdateP24Config.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          fields: ["p24_api"],
        },
      },
    });
    renderPage();

    await awaitInitialP24Query();

    fillPaymentForm("123456", "", CRC_KEY);
    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(screen.getByText(/please fix the highlighted fields and try again/i)).toBeInTheDocument();
      expect(screen.getByText(/api key is required/i)).toBeInTheDocument();
    });
  });

  it("disables submit while update request is in flight", async () => {
    let resolveSave!: (value: void) => void;

    mockUpdateP24Config.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    renderPage();

    await awaitInitialP24Query();

    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(mockUpdateP24Config).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();

    resolveSave();

    await waitFor(() => {
      expect(screen.getByText(/p24 configuration updated successfully/i)).toBeInTheDocument();
    });
  });

  it("keeps success message visible when user edits fields after submit", async () => {
    mockUpdateP24Config.mockResolvedValueOnce(undefined);
    renderPage();

    await awaitInitialP24Query();

    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(screen.getByText(/p24 configuration updated successfully/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/p24 api key/i), { target: { value: "c".repeat(32) } });

    expect(screen.getByText(/p24 configuration updated successfully/i)).toBeInTheDocument();
  });

  it("trims whitespace from tenant id before sending", async () => {
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: "  some-id  ",
      selectedTenant: {
        id: "some-id",
        name: "Main Restaurant",
      },
      tenants: [],
      tenantsState: "loaded",
      setSelectedTenantId: vi.fn(),
    });
    mockUpdateP24Config.mockResolvedValueOnce(undefined);
    renderPage();

    await awaitInitialP24Query();

    fillPaymentForm("100", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(mockUpdateP24Config).toHaveBeenCalledWith("some-id", {
        p24_merchantid: 100,
        p24_api: API_KEY,
        p24_crc: CRC_KEY,
      });
    });
  });

  it("shows a clear state when no tenant is selected", async () => {
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: null,
      selectedTenant: null,
      tenants: [],
      tenantsState: "loaded",
      setSelectedTenantId: vi.fn(),
    });
    renderPage();

    expect(screen.getByRole("button", { name: /save configuration/i })).toBeDisabled();
    expect(mockUpdateP24Config).not.toHaveBeenCalled();
  });

  it("shows load restaurants error when tenant state fails", async () => {
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: null,
      selectedTenant: null,
      tenants: [],
      tenantsState: "error",
      setSelectedTenantId: vi.fn(),
    });
    renderPage();

    expect(screen.getByRole("button", { name: /save configuration/i })).toBeDisabled();
  });

  it("shows select restaurant error when submit runs without selected tenant", async () => {
    mockUseCurrentTenant.mockReturnValue({
      selectedTenantId: null,
      selectedTenant: null,
      tenants: [],
      tenantsState: "loaded",
      setSelectedTenantId: vi.fn(),
    });
    renderPage();

    fillPaymentForm("123456", API_KEY, CRC_KEY);
    clickSaveConfiguration();

    await waitFor(() => {
      expect(screen.getByText(/select a restaurant from the header dropdown/i)).toBeInTheDocument();
    });
  });
});
