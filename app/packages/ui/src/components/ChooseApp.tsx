import type { AppSlug } from "@restorio/types";
import type { ReactElement } from "react";

import { useI18n } from "../providers";
import { cn } from "../utils";

import { Dropdown } from "./overlays";
import { Button, Text } from "./primitives";

const CHOOSE_APP_SLUGS: AppSlug[] = ["admin-panel", "kitchen-panel", "waiter-panel"];

export interface ChooseAppProps {
  onSelectApp: (slug: AppSlug) => void;
  variant?: "buttons" | "dropdown";
  subvariant?: "default" | "large";
  value?: AppSlug;
  ariaLabel?: string;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const ChooseApp = ({
  onSelectApp,
  variant = "buttons",
  subvariant = "default",
  value,
  ariaLabel,
  className,
  title,
  subtitle,
}: ChooseAppProps): ReactElement => {
  const { t } = useI18n();

  const chooseAppLabels = {
    adminPanel: t("chooseApp.labels.adminPanel"),
    kitchenPanel: t("chooseApp.labels.kitchenPanel"),
    waiterPanel: t("chooseApp.labels.waiterPanel"),
  };

  const items = CHOOSE_APP_SLUGS.map((slug) => ({
    slug,
    label:
      slug === "admin-panel"
        ? chooseAppLabels.adminPanel
        : slug === "kitchen-panel"
          ? chooseAppLabels.kitchenPanel
          : chooseAppLabels.waiterPanel,
  }));

  if (variant === "dropdown") {
    const isLarge = subvariant === "large";
    const buttonSize = isLarge ? "text-sm px-3 py-2 max-w-[400px]" : "text-xs px-2 py-1 max-w-[300px]";
    const dropdownMinWidth = isLarge ? "min-w-[180px]" : "min-w-[100px]";
    const itemPadding = isLarge ? "px-4 text-sm" : "px-3 text-xs";
    const itemYPadding = isLarge
      ? (isFirst: boolean, isLast: boolean): string =>
          isFirst && isLast ? "py-3" : isFirst ? "pt-3 pb-2" : isLast ? "pt-2 pb-3" : "py-2.5"
      : (isFirst: boolean, isLast: boolean): string =>
          isFirst && isLast ? "py-2.5" : isFirst ? "pt-2.5 pb-1.5" : isLast ? "pt-1.5 pb-2.5" : "py-2";

    return (
      <div className={cn("flex w-full justify-end", className)}>
        <Dropdown
          trigger={
            <Button variant="primary" size="sm" className={cn("min-w-0 truncate", buttonSize)} aria-label={ariaLabel}>
              {items.find(({ slug }) => slug === value)?.label}
            </Button>
          }
          placement="bottom-end"
          className={dropdownMinWidth}
        >
          <div className="flex flex-col gap-0">
            {items
              .filter(({ slug }) => slug !== value)
              .map(({ slug, label }, index, arr) => {
                const isFirst = index === 0;
                const isLast = index === arr.length - 1;
                const yPadding = itemYPadding(isFirst, isLast);

                return (
                  <button
                    key={slug}
                    type="button"
                    className={cn(
                      "w-full rounded-none text-left text-text-primary hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-focus",
                      itemPadding,
                      yPadding,
                    )}
                    onClick={() => onSelectApp(slug)}
                    aria-label={ariaLabel}
                  >
                    {label}
                  </button>
                );
              })}
          </div>
        </Dropdown>
      </div>
    );
  }

  return (
    <div className={cn("text-center", className)}>
      <Text variant="h2" weight="bold" className="mt-4 mb-3 text-center">
        {title}
      </Text>
      <Text variant="body-lg" className="mb-5 text-text-secondary text-center">
        {subtitle}
      </Text>

      <div className="mx-auto grid max-w-md grid-cols-1 gap-3">
        {items.map(({ slug, label }) => (
          <Button
            key={slug}
            size="lg"
            variant={slug === "admin-panel" ? "primary" : "secondary"}
            onClick={() => onSelectApp(slug)}
            aria-label={ariaLabel}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
