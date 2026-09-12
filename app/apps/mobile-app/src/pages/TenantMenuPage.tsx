import type { PublicTenantInfo, TenantMenu } from "@restorio/types";
import { Button, EmptyState, Loader, Text, useI18n } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useCallback, useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { publicApi } from "../api/client";
import { GuestBottomNav } from "../components/GuestBottomNav";
import { MenuCategorySection } from "../features/order/components/MenuCategorySection";
import { useApplyPublicTenantPresentation } from "../hooks/useApplyPublicTenantPresentation";
import { isTenantNotFoundApiError } from "../lib/isTenantNotFoundApiError";
import { persistLastVisitedTenantPath } from "../lib/lastVisitedTenant";

export const TenantMenuPage = (): ReactElement => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const noopAdd = useCallback((_name: string, _unitPrice: number): void => {
    return;
  }, []);
  const noopRemove = useCallback((_name: string): void => {
    return;
  }, []);

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

  useApplyPublicTenantPresentation(tenantQuery.data);

  useEffect(() => {
    if (tenantSlug && tenantQuery.data) {
      persistLastVisitedTenantPath(`/${tenantSlug}`);
    }
  }, [tenantSlug, tenantQuery.data]);

  if (!tenantSlug) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
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
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader size="lg" />
          <Text as="p" variant="body-sm" className="text-center text-text-secondary">
            {t("order.loadingMenu")}
          </Text>
        </div>
      </div>
    );
  }

  if (isError || !tenantQuery.data) {
    if (tenantQuery.isError && isTenantNotFoundApiError(tenantQuery.error)) {
      return <Navigate to="/" replace />;
    }

    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
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
  const displayName = tenantQuery.data.pageTitle?.trim() ? tenantQuery.data.pageTitle : tenantQuery.data.name;

  return (
    <div className="min-h-[100dvh] bg-background-primary pb-24">
      <header className="sticky top-0 z-10 border-b border-border-default bg-surface-primary px-4 py-3 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-1">
          <Button variant="ghost" size="sm" type="button" onClick={() => navigate(`/${tenantSlug}`)}>
            {t("menuBrowse.back")}
          </Button>
          <Text as="h1" variant="h4" weight="bold" className="w-full text-balance text-center">
            {displayName}
          </Text>
          <Text as="h2" variant="body-sm" className="text-pretty text-text-secondary">
            {t("menuBrowse.subtitle")}
          </Text>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-4">
        {categories.length === 0 ? (
          <div className="mx-auto max-w-md text-center">
            <EmptyState title={t("order.emptyMenuTitle")} description={t("order.emptyMenuDescription")} />
          </div>
        ) : (
          categories.map((category) => (
            <MenuCategorySection
              key={category.name}
              category={category}
              cartItems={[]}
              onAdd={noopAdd}
              onRemove={noopRemove}
              browseOnly
            />
          ))
        )}
      </main>

      <GuestBottomNav ariaLabel={t("landing.quickNavAria")}>
        <Button variant="ghost" size="sm" type="button" onClick={() => navigate(`/${tenantSlug}`)}>
          {t("landing.navHome")}
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={() => navigate(`/${tenantSlug}/tables`)}>
          {t("landing.navTables")}
        </Button>
      </GuestBottomNav>
    </div>
  );
};
