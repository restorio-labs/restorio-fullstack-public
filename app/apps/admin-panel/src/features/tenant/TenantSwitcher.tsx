import type { TenantSummary } from "@restorio/types";
import { Dropdown, Loader, useI18n } from "@restorio/ui";
import { deslug } from "@restorio/utils";
import type { ReactElement } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCurrentTenant } from "../../context/TenantContext";

interface TenantSwitcherItemTextProps {
  tenant: TenantSummary;
  isSelected: boolean;
}

interface TenantSwitcherTriggerTextProps {
  tenant: TenantSummary;
}

const TenantSwitcherItemText = ({ tenant, isSelected }: TenantSwitcherItemTextProps): ReactElement => (
  <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
    <span
      className={`whitespace-normal break-words text-base ${isSelected ? "font-semibold text-interactive-primary" : "font-medium text-text-primary"}`}
    >
      {tenant.name}
    </span>
    <span
      className={`whitespace-normal break-words text-xs ${isSelected ? "text-interactive-primary/80" : "text-text-tertiary"}`}
    >
      {deslug(tenant.slug)}
    </span>
  </span>
);

const TenantSwitcherTriggerText = ({ tenant }: TenantSwitcherTriggerTextProps): ReactElement => (
  <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
    <span className="whitespace-normal break-words text-base font-medium text-text-primary">{tenant.name}</span>
    <span className="whitespace-normal break-words text-xs text-text-tertiary">{deslug(tenant.slug)}</span>
  </span>
);

export const TenantSwitcher = (): ReactElement | null => {
  const { t } = useI18n();
  const { tenants, tenantsState, selectedTenantId, selectedTenant, setSelectedTenantId } = useCurrentTenant();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  if (tenantsState === "error") {
    return <div className="text-sm text-status-error-text">{t("tenantSwitcher.loadError")}</div>;
  }

  if (tenantsState === "loading" || tenantsState === "idle") {
    return (
      <div className="flex items-center gap-2 text-sm text-text-tertiary">
        <Loader size="sm" />
        <span>{t("tenantSwitcher.loading")}</span>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm text-text-tertiary">{t("tenantSwitcher.empty")}</div>
        <button
          type="button"
          onClick={() => navigate("/restaurant-creator")}
          className="text-sm font-medium text-interactive-primary hover:underline"
        >
          {t("tenantSwitcher.addRestaurant")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full [&>div]:block [&>div]:w-full">
      <Dropdown
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="bottom-center"
        className="mr-3 w-full min-w-full max-w-[32rem]"
        trigger={
          <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-border-default bg-surface-primary px-5 py-4 text-text-primary shadow-sm transition hover:bg-surface-secondary">
            {selectedTenant ? (
              <TenantSwitcherTriggerText tenant={selectedTenant} />
            ) : (
              <span className="truncate text-base font-medium">{t("tenantSwitcher.select")}</span>
            )}
            <svg
              className="ml-3 h-5 w-5 shrink-0 text-text-secondary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        }
      >
        <div className="flex max-h-90 flex-col gap-0.5 overflow-y-auto p-2">
          {tenants.map((tenant) => (
            <button
              key={tenant.id}
              type="button"
              className="w-full whitespace-normal break-words rounded-sm px-4 py-2 text-left text-base hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-focus"
              onClick={() => {
                setSelectedTenantId(tenant.id);
                setIsOpen(false);
              }}
            >
              <TenantSwitcherItemText tenant={tenant} isSelected={tenant.id === selectedTenantId} />
            </button>
          ))}
          <div className="my-2 border-t border-border-default" />
          <button
            type="button"
            className="w-full whitespace-normal break-words rounded-sm px-4 py-2 text-left text-base font-semibold text-interactive-primary hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-focus"
            onClick={() => {
              navigate("/restaurant-creator");
              setIsOpen(false);
            }}
          >
            {t("tenantSwitcher.addRestaurant")}
          </button>
        </div>
      </Dropdown>
    </div>
  );
};
