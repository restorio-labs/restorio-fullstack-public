import type { InvoiceData, PublicTenantInfo, TenantMenu } from "@restorio/types";
import { Button, EmptyState, Loader, Text, useI18n } from "@restorio/ui";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";

import { publicApi } from "../api/client";
import { CartSummary } from "../features/order/components/CartSummary";
import { CheckoutForm } from "../features/order/components/CheckoutForm";
import { MenuCategorySection } from "../features/order/components/MenuCategorySection";
import { useCart } from "../features/order/hooks/useCart";
import { useApplyPublicTenantPresentation } from "../hooks/useApplyPublicTenantPresentation";
import { isTenantNotFoundApiError } from "../lib/isTenantNotFoundApiError";
import { persistLastVisitedTenantPath } from "../lib/lastVisitedTenant";

const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = error as { response?: { data?: { detail?: unknown } } };
    const detail = response.response?.data?.detail;

    if (typeof detail === "string" && detail.trim() !== "") {
      return detail;
    }
  }

  return fallback;
};

export const OrderPage = (): ReactElement => {
  const { t } = useI18n();
  const { tenantSlug, tableNumber } = useParams<{ tenantSlug: string; tableNumber: string }>();
  const [searchParams] = useSearchParams();
  const tableNum = Number(tableNumber);
  const tableRef = searchParams.get("ref")?.trim() ?? undefined;
  const [submitError, setSubmitError] = useState("");
  const checkoutRef = useRef<HTMLDivElement>(null);
  const cart = useCart();
  const lockStorageKey = tenantSlug ? `restorio:table-lock:${tenantSlug}:${tableNum}:${tableRef ?? ""}` : "";

  const tenantQuery = useQuery<PublicTenantInfo>({
    queryKey: ["public-tenant-info", tenantSlug],
    queryFn: ({ signal }) => publicApi.getTenantInfo(tenantSlug!, signal),
    enabled: !!tenantSlug,
  });

  const menuQuery = useQuery<TenantMenu>({
    queryKey: ["public-tenant-menu", tenantSlug],
    queryFn: ({ signal }) => publicApi.getTenantMenu(tenantSlug!, signal),
    enabled: !!tenantSlug,
  });
  const tenantData = tenantQuery.data;

  useApplyPublicTenantPresentation(tenantData);

  useEffect(() => {
    if (tenantSlug && tenantQuery.data) {
      persistLastVisitedTenantPath(`/${tenantSlug}`);
    }
  }, [tenantSlug, tenantQuery.data]);

  const paymentMutation = useMutation({
    mutationFn: (data: { email: string; note: string; invoiceData?: InvoiceData }) =>
      publicApi.createOrderPayment({
        tenantSlug: tenantSlug!,
        tableNumber: tableNum,
        tableRef,
        lockToken: lockStorageKey ? (window.localStorage.getItem(lockStorageKey) ?? undefined) : undefined,
        email: data.email,
        items: cart.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        note: data.note || undefined,
        invoiceData: data.invoiceData,
      }),
    onSuccess: (data) => {
      if (lockStorageKey) {
        window.localStorage.setItem(lockStorageKey, data.lockToken);
      }
      window.location.href = data.redirectUrl;
    },
    onError: (error: unknown) => {
      setSubmitError(extractApiErrorMessage(error, t("checkout.paymentFailed")));
    },
  });

  const handleCheckout = useCallback(
    (email: string, note: string, invoiceData?: InvoiceData) => {
      setSubmitError("");
      paymentMutation.mutate({ email, note, invoiceData });
    },
    [paymentMutation],
  );

  const scrollToCheckout = useCallback(() => {
    checkoutRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (!tenantSlug || isNaN(tableNum)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <EmptyState title={t("order.invalidLinkTitle")} description={t("order.invalidLinkDescription")} />
        </div>
      </div>
    );
  }

  const isLoading = tenantQuery.isLoading || menuQuery.isLoading;
  const isError = tenantQuery.isError || menuQuery.isError;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader size="lg" />
          <Text as="p" variant="body-sm" className="text-center text-text-secondary">
            {t("order.loadingMenu")}
          </Text>
        </div>
      </div>
    );
  }

  if (isError) {
    if (tenantQuery.isError && isTenantNotFoundApiError(tenantQuery.error)) {
      return <Navigate to="/" replace />;
    }

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <EmptyState
            title={t("order.loadErrorTitle")}
            description={t("order.loadErrorDescription")}
            action={
              <Button variant="primary" onClick={() => window.location.reload()}>
                {t("order.reload")}
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const categories = menuQuery.data?.categories ?? [];
  const displayName = tenantQuery.data?.pageTitle?.trim()
    ? (tenantQuery.data.pageTitle ?? "")
    : (tenantQuery.data?.name ?? "");
  const currency = t("common.currency");

  return (
    <div className="flex min-h-screen flex-col items-center bg-background-primary">
      <header className="sticky top-0 z-10 w-full border-b border-border-default bg-surface-primary px-4 py-4 text-center">
        <Text as="h1" variant="h2" weight="bold" align="center" className="text-balance">
          {displayName}
        </Text>
        <Text as="p" variant="body-lg" weight="medium" align="center" className="mt-1 text-pretty text-text-secondary">
          {t("order.tableLabel", { number: String(tableNum) })}
        </Text>
      </header>

      <main className="w-full max-w-2xl flex-1 px-4 py-4">
        {categories.length === 0 ? (
          <div className="mx-auto max-w-md text-center">
            <EmptyState title={t("order.emptyMenuTitle")} description={t("order.emptyMenuDescription")} />
          </div>
        ) : (
          categories.map((category) => (
            <MenuCategorySection
              key={category.name}
              category={category}
              cartItems={cart.items}
              onAdd={cart.addItem}
              onRemove={cart.removeItem}
            />
          ))
        )}
      </main>

      {cart.totalItems > 0 && (
        <div className="sticky bottom-0 z-10 w-full border-t border-border-default bg-surface-primary px-4 py-3">
          <div className="mx-auto w-full max-w-2xl">
            <Button variant="primary" size="lg" fullWidth onClick={scrollToCheckout}>
              {t("order.cartButton", {
                count: String(cart.totalItems),
                amount: cart.totalAmount.toFixed(2),
                currency,
              })}
            </Button>
          </div>
        </div>
      )}

      {cart.items.length > 0 && (
        <div ref={checkoutRef} className="w-full border-t border-border-default bg-surface-secondary px-4 py-6">
          <div className="mx-auto w-full max-w-2xl">
            <Text as="h2" variant="h4" weight="semibold" className="mb-4 text-center">
              {t("order.summaryTitle")}
            </Text>

            <CartSummary
              items={cart.items}
              totalAmount={cart.totalAmount}
              onRemove={cart.removeItem}
              onUpdateQuantity={cart.updateQuantity}
            />

            <div className="mt-4">
              <CheckoutForm
                totalAmount={cart.totalAmount}
                disabled={cart.items.length === 0}
                isSubmitting={paymentMutation.isPending}
                onSubmit={handleCheckout}
              />
            </div>

            {submitError && (
              <div className="mt-3 rounded-lg bg-status-error-bg p-3 text-center">
                <Text as="p" variant="body-sm" className="text-status-error-text">
                  {submitError}
                </Text>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
