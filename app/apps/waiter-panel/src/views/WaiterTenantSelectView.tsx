import type { TenantSummary } from "@restorio/types";
import { Loader, PageLayout, Text, useI18n } from "@restorio/ui";
import { deslug, goToApp } from "@restorio/utils";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";

import { api } from "../api/client";

export const WaiterTenantSelectView = (): ReactElement => {
  const { t } = useI18n();
  const {
    data: tenants = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["waiter-panel", "tenants"],
    queryFn: () => api.tenants.list(),
  });

  useEffect(() => {
    if (!isLoading && !isError && tenants.length === 0) {
      goToApp("admin-panel");
    }
  }, [isLoading, isError, tenants.length]);

  if (!isLoading && !isError && tenants.length === 1) {
    return <Navigate to={`/${tenants[0].id}`} replace />;
  }

  return (
    <PageLayout title={t("tenantSelect.title")} description={t("tenantSelect.description")}>
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
        {isLoading && (
          <div className="flex items-center gap-2">
            <Loader size="sm" />
            <Text as="p" variant="body-sm" className="text-text-tertiary">
              {t("tenantSelect.loading")}
            </Text>
          </div>
        )}
        {isError && (
          <div className="rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
            {error instanceof Error && error.message.trim() !== "" ? error.message : t("tenantSelect.loadError")}
          </div>
        )}
        {!isLoading && !isError && tenants.length === 0 && (
          <div className="rounded-lg border border-border-default bg-surface-primary px-4 py-3 text-sm text-text-secondary">
            {t("tenantSelect.none")}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {tenants.map((tenant: TenantSummary) => (
            <Link
              key={tenant.id}
              to={`/${tenant.id}`}
              className="rounded-lg border border-border-default bg-surface-primary p-5 shadow-card transition-colors hover:border-border-strong"
            >
              <div className="text-base font-semibold text-text-primary">{tenant.name}</div>
              <div className="mt-1 text-sm text-text-secondary">{deslug(tenant.slug)}</div>
            </Link>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};
