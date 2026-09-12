import type { PublicTenantInfo } from "@restorio/types";
import { Button, EmptyState, Loader, Text, useI18n } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { publicApi } from "../api/client";
import { GuestBottomNav } from "../components/GuestBottomNav";
import { useApplyPublicTenantPresentation } from "../hooks/useApplyPublicTenantPresentation";
import { isTenantNotFoundApiError } from "../lib/isTenantNotFoundApiError";
import { persistLastVisitedTenantPath } from "../lib/lastVisitedTenant";

export const TenantLandingPage = (): ReactElement => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const tenantQuery = useQuery<PublicTenantInfo>({
    queryKey: ["public-tenant-info", tenantSlug],
    queryFn: ({ signal }) => publicApi.getTenantInfo(tenantSlug!, signal),
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

  if (tenantQuery.isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  if (tenantQuery.isError || !tenantQuery.data) {
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

  const { data } = tenantQuery;
  const lc = data.landingContent;
  const displayName = data.pageTitle?.trim() ? data.pageTitle : data.name;
  const headline = lc?.headline?.trim() ? lc.headline : displayName;
  const subtitle = lc?.subtitle?.trim() ? lc.subtitle : t("landing.defaultSubtitle");
  const tablesCtaTrimmed = lc?.tablesCtaLabel?.trim();
  const menuCtaTrimmed = lc?.menuCtaLabel?.trim();
  const tablesCtaLabel = tablesCtaTrimmed ? tablesCtaTrimmed : t("landing.ctaTables");
  const menuCtaLabel = menuCtaTrimmed ? menuCtaTrimmed : t("landing.ctaMenu");

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-background-primary px-4 pb-28 pt-8">
      <header className="mx-auto w-full max-w-md text-center">
        <Text as="h1" variant="h3" weight="bold" className="text-balance text-center">
          {headline}
        </Text>
        <Text as="p" variant="body-md" className="mt-3 text-pretty text-text-secondary text-center">
          {subtitle}
        </Text>
      </header>

      <div className="mx-auto mt-10 flex w-full max-w-md flex-col gap-3">
        <Button variant="primary" size="lg" fullWidth onClick={() => navigate(`/${tenantSlug}/tables`)}>
          {tablesCtaLabel}
        </Button>
        <Button variant="secondary" size="lg" fullWidth onClick={() => navigate(`/${tenantSlug}/menu`)}>
          {menuCtaLabel}
        </Button>
      </div>

      <GuestBottomNav ariaLabel={t("landing.quickNavAria")}>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/${tenantSlug}/tables`)}>
          {t("landing.navTables")}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate(`/${tenantSlug}/menu`)}>
          {t("landing.navMenu")}
        </Button>
      </GuestBottomNav>
    </div>
  );
};
