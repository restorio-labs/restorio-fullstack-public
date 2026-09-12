import type { CSSProperties, ReactElement, ReactNode } from "react";
import { useId, useMemo } from "react";
import { TbChevronDown as TbChevronDownIcon } from "react-icons/tb";

import { buildScopedThemeStyle } from "../theme/cssVariables";
import { resolveGoogleFontStylesheetHref } from "../theme/googleFonts";
import { useGoogleFontStylesheet } from "../hooks/useGoogleFontStylesheet";
import type { ThemeOverride } from "../tokens/types";
import { cn } from "../utils";

import { Dropdown } from "./overlays/Dropdown";
import { Button } from "./primitives/Button";
import { Text } from "./primitives/Text";

const TbChevronDown = TbChevronDownIcon as React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type MobileGuestPreviewAppearance = "light" | "dark";

export type MobileGuestPreviewScreen = "landing" | "tables" | "menu" | "order";

export interface MobileGuestAppPreviewTablesCopy {
  backLabel: string;
  subtitle: string;
  floorTitle: string;
  listTitle: string;
  sampleOpenTableLabel: string;
  sampleClosedTableLabel: string;
}

export interface MobileGuestAppPreviewMenuItem {
  name: string;
  description?: string;
  priceLabel: string;
  promoted?: boolean;
}

export interface MobileGuestAppPreviewMenuCopy {
  backLabel: string;
  subtitle: string;
  categoryName: string;
  items: MobileGuestAppPreviewMenuItem[];
  navHomeLabel: string;
  navTablesLabel: string;
  promotedBadgeLabel: string;
}

export interface MobileGuestAppPreviewOrderCopy {
  tableCaption: string;
  cartButtonLabel: string;
  summaryTitle: string;
  categoryName: string;
  items: { name: string; priceLabel: string }[];
  promotedBadgeLabel: string;
  subtotalLabel: string;
  subtotalPrice: string;
  serviceLabel: string;
  servicePrice: string;
  totalLabel: string;
  totalPrice: string;
}

export interface MobileGuestAppPreviewProps {
  screen: MobileGuestPreviewScreen;
  appearance: MobileGuestPreviewAppearance;
  restaurantName: string;
  pageTitle: string;
  landingHeadline: string;
  landingSubtitle: string;
  defaultSubtitle: string;
  tablesCtaLabel: string;
  menuCtaLabel: string;
  tablesCtaDefault: string;
  menuCtaDefault: string;
  navTablesLabel: string;
  navMenuLabel: string;
  navHomeLabel: string;
  quickNavAriaLabel: string;
  languageSwitcherAriaLabel: string;
  openStatusLabel: string;
  closedStatusLabel: string;
  tablesCopy: MobileGuestAppPreviewTablesCopy;
  menuCopy: MobileGuestAppPreviewMenuCopy;
  orderCopy: MobileGuestAppPreviewOrderCopy;
  themeOverride: ThemeOverride | null;
  googleFontStylesheetHref?: string;
  className?: string;
}

const previewShellClassName = (screen: MobileGuestPreviewScreen): string =>
  cn(
    "relative flex max-h-[min(1024px,112vh)] min-h-[768px] flex-col overflow-y-auto bg-background-primary px-3 pt-6 font-sans sm:px-4",
    screen === "order" ? "pb-8" : "pb-24",
  );

const PreviewLangSelect = ({
  id,
  languageSwitcherAriaLabel,
}: {
  id: string;
  languageSwitcherAriaLabel: string;
}): ReactElement => (
  <div className="flex shrink-0 items-center gap-1.5">
    <span id={id} className="sr-only">
      {languageSwitcherAriaLabel}
    </span>
    <Dropdown
      trigger={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="pointer-events-none max-w-[7.5rem] gap-1 px-2 py-1.5 text-xs font-medium"
          aria-labelledby={id}
        >
          <span className="min-w-0 truncate">EN</span>
          <TbChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
        </Button>
      }
      placement="top-center"
      className="min-w-[7.5rem] p-1"
    >
      <span className="block px-2 py-1.5 text-left text-xs text-text-secondary">English</span>
    </Dropdown>
  </div>
);

const PreviewBottomNav = ({ ariaLabel, children }: { ariaLabel: string; children: ReactNode }): ReactElement => (
  <nav
    className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 border-t border-border-default bg-surface-primary/95 px-3 py-3 backdrop-blur-sm sm:px-4"
    aria-label={ariaLabel}
  >
    <div className="mx-auto flex w-full max-w-lg flex-wrap items-center justify-center gap-x-2 gap-y-2">{children}</div>
  </nav>
);

const MenuItemPreviewCard = ({
  name,
  description,
  priceLabel,
  promoted,
  promotedBadgeLabel,
  orderMode,
}: MobileGuestAppPreviewMenuItem & {
  promotedBadgeLabel: string;
  orderMode?: boolean;
}): ReactElement => (
  <div
    className={cn(
      "flex gap-3 rounded-lg border border-border-default bg-surface-primary py-3 px-5",
      orderMode ? "items-center justify-between" : "flex-col items-center text-center",
    )}
  >
    <div className={cn("min-w-0 flex-1", !orderMode && "flex w-full flex-col items-center")}>
      <Text as="span" variant="body-md" weight="medium" className={cn("block truncate", !orderMode && "text-center")}>
        {name}
      </Text>
      {promoted ? (
        <span
          className={cn(
            "mt-1.5 inline-flex w-fit max-w-full shrink-0 items-center rounded-md border-2 border-status-promoted-border bg-status-promoted-background px-2.5 py-1 text-xs font-semibold leading-tight text-status-promoted-text shadow-sm",
            !orderMode && "mx-auto",
          )}
        >
          {promotedBadgeLabel}
        </span>
      ) : null}
      {description ? (
        <Text as="p" variant="body-sm" className="mt-0.5 line-clamp-2 text-text-secondary">
          {description}
        </Text>
      ) : null}
      <Text as="span" variant="body-md" weight="semibold" className="mt-1 block">
        {priceLabel}
      </Text>
    </div>
    {orderMode ? (
      <div className="flex shrink-0 items-center gap-1.5">
        <Button type="button" variant="secondary" size="sm" className="pointer-events-none min-w-[2.25rem] px-2">
          −
        </Button>
        <Text as="span" variant="body-sm" weight="medium" className="min-w-[1.25rem] text-center tabular-nums">
          1
        </Text>
        <Button type="button" variant="secondary" size="sm" className="pointer-events-none min-w-[2.25rem] px-2">
          +
        </Button>
      </div>
    ) : null}
  </div>
);

export const MobileGuestAppPreview = ({
  screen,
  appearance,
  restaurantName,
  pageTitle,
  landingHeadline,
  landingSubtitle,
  defaultSubtitle,
  tablesCtaLabel,
  menuCtaLabel,
  tablesCtaDefault,
  menuCtaDefault,
  navTablesLabel,
  navMenuLabel,
  navHomeLabel,
  quickNavAriaLabel,
  languageSwitcherAriaLabel,
  openStatusLabel,
  closedStatusLabel,
  tablesCopy,
  menuCopy,
  orderCopy,
  themeOverride,
  googleFontStylesheetHref,
  className,
}: MobileGuestAppPreviewProps): ReactElement => {
  const fontLinkId = useId().replace(/:/g, "");
  const langId = `mobile-preview-lang-${fontLinkId}`;

  const scopedStyle = useMemo(
    (): Record<string, string> => buildScopedThemeStyle(appearance, themeOverride),
    [appearance, themeOverride],
  );

  const resolvedFontHref = googleFontStylesheetHref?.trim() || resolveGoogleFontStylesheetHref(themeOverride);

  useGoogleFontStylesheet(resolvedFontHref);

  const displayName = pageTitle.trim() || restaurantName;
  const headline = landingHeadline.trim() || displayName;
  const subtitle = landingSubtitle.trim() || defaultSubtitle;
  const tablesCta = tablesCtaLabel.trim() || tablesCtaDefault;
  const menuCta = menuCtaLabel.trim() || menuCtaDefault;

  const surfaceStyle = scopedStyle as CSSProperties;

  const landingBody = (
    <>
      <header className="mx-auto w-full max-w-md text-center">
        <Text as="h1" variant="h3" weight="bold" className="text-balance text-center">
          {headline}
        </Text>
        <Text as="p" variant="body-md" className="mt-3 text-pretty text-center text-text-secondary">
          {subtitle}
        </Text>
      </header>
      <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3">
        <Button type="button" variant="primary" size="lg" fullWidth className="pointer-events-none">
          {tablesCta}
        </Button>
        <Button type="button" variant="secondary" size="lg" fullWidth className="pointer-events-none">
          {menuCta}
        </Button>
      </div>
      <PreviewBottomNav ariaLabel={quickNavAriaLabel}>
        <Button type="button" variant="ghost" size="sm" className="pointer-events-none">
          {navTablesLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="pointer-events-none">
          {navMenuLabel}
        </Button>
        <PreviewLangSelect id={langId} languageSwitcherAriaLabel={languageSwitcherAriaLabel} />
      </PreviewBottomNav>
    </>
  );

  const tablesBody = (
    <>
      <header className="sticky top-0 z-10 -mx-3 border-b border-border-default bg-surface-primary px-4 py-3 text-center sm:-mx-4">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="pointer-events-none my-2 px-4 py-2">
            {tablesCopy.backLabel}
          </Button>
          <Text as="h1" variant="h4" weight="bold" className="w-full text-balance text-center">
            {displayName}
          </Text>
          <Text as="p" variant="body-sm" className="text-pretty text-text-secondary">
            {tablesCopy.subtitle}
          </Text>
        </div>
      </header>
      <div className="mx-auto w-full max-w-lg py-4 text-center">
        <div className="mb-4 flex flex-wrap justify-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-success-border bg-status-success-background/50 px-3 py-1 font-medium">
            <span className="h-2 w-2 rounded-full bg-status-success-text" aria-hidden />
            {openStatusLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-error-border bg-status-error-background/50 px-3 py-1 font-medium">
            <span className="h-2 w-2 rounded-full bg-status-error-text" aria-hidden />
            {closedStatusLabel}
          </span>
        </div>
        <section className="flex flex-col items-center">
          <Text as="h2" variant="body-md" weight="semibold" className="mb-2 w-full text-center text-balance">
            {tablesCopy.floorTitle}
          </Text>
          <div className="relative mx-auto h-[140px] w-full max-w-sm overflow-hidden rounded-xl border border-border-default bg-surface-secondary shadow-inner">
            <div
              className="pointer-events-none absolute left-5 top-7 flex h-11 w-14 items-center justify-center rounded-md border-2 border-status-success-border bg-status-success-background/90 text-[10px] font-bold leading-tight text-text-primary sm:text-xs"
              title={openStatusLabel}
            >
              <span className="line-clamp-2 px-0.5 text-center">{tablesCopy.sampleOpenTableLabel}</span>
            </div>
            <div
              className="pointer-events-none absolute right-5 top-9 flex h-11 w-14 items-center justify-center rounded-md border-2 border-status-error-border bg-status-error-background/90 text-[10px] font-bold leading-tight text-text-primary sm:text-xs"
              title={closedStatusLabel}
            >
              <span className="line-clamp-2 px-0.5 text-center">{tablesCopy.sampleClosedTableLabel}</span>
            </div>
          </div>
        </section>
        <div className="mt-8 w-full rounded-xl border border-border-default bg-surface-primary p-4">
          <Text as="h2" variant="body-md" weight="semibold" className="mb-3 text-center">
            {tablesCopy.listTitle}
          </Text>
          <ul className="flex flex-col gap-2">
            <li>
              <div className="flex w-full flex-col items-center gap-2 rounded-lg border border-border-default px-3 py-2.5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <Text as="span" variant="body-sm" weight="medium" className="min-w-0 max-w-full truncate">
                  {tablesCopy.sampleOpenTableLabel}
                </Text>
                <span className="shrink-0 rounded-full bg-status-success-background px-2.5 py-0.5 text-xs font-semibold text-status-success-text">
                  {openStatusLabel}
                </span>
              </div>
            </li>
            <li>
              <div className="flex w-full flex-col items-center gap-2 rounded-lg border border-border-default px-3 py-2.5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <Text as="span" variant="body-sm" weight="medium" className="min-w-0 max-w-full truncate">
                  {tablesCopy.sampleClosedTableLabel}
                </Text>
                <span className="shrink-0 rounded-full bg-status-error-background px-2.5 py-0.5 text-xs font-semibold text-status-error-text">
                  {closedStatusLabel}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <PreviewBottomNav ariaLabel={quickNavAriaLabel}>
        <Button type="button" variant="ghost" size="sm" className="pointer-events-none">
          {navHomeLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="pointer-events-none">
          {navMenuLabel}
        </Button>
        <PreviewLangSelect id={`${langId}-t`} languageSwitcherAriaLabel={languageSwitcherAriaLabel} />
      </PreviewBottomNav>
    </>
  );

  const menuBody = (
    <>
      <header className="sticky top-0 z-10 -mx-3 border-b border-border-default bg-surface-primary px-4 py-3 text-center sm:-mx-4">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-1">
          <Button type="button" variant="ghost" size="sm" className="pointer-events-none">
            {menuCopy.backLabel}
          </Button>
          <Text as="h1" variant="h4" weight="bold" className="w-full text-balance">
            {displayName}
          </Text>
          <Text as="p" variant="body-sm" className="text-pretty text-text-secondary">
            {menuCopy.subtitle}
          </Text>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg py-4">
        <section className="mb-6">
          <Text as="h2" variant="h4" weight="semibold" className="mb-3 px-1 text-center">
            {menuCopy.categoryName}
          </Text>
          <div className="flex flex-col gap-2">
            {menuCopy.items.map((item) => (
              <MenuItemPreviewCard key={item.name} {...item} promotedBadgeLabel={menuCopy.promotedBadgeLabel} />
            ))}
          </div>
        </section>
      </main>
      <PreviewBottomNav ariaLabel={quickNavAriaLabel}>
        <Button type="button" variant="ghost" size="sm" className="pointer-events-none">
          {menuCopy.navHomeLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="pointer-events-none">
          {menuCopy.navTablesLabel}
        </Button>
        <PreviewLangSelect id={`${langId}-m`} languageSwitcherAriaLabel={languageSwitcherAriaLabel} />
      </PreviewBottomNav>
    </>
  );

  const orderBody = (
    <div className="pointer-events-none flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-10 -mx-3 border-b border-border-default bg-surface-primary px-4 py-3 text-center sm:-mx-4">
        <Text as="h1" variant="h4" weight="bold" className="text-balance">
          {displayName}
        </Text>
        <Text as="p" variant="body-sm" className="text-pretty text-text-secondary">
          {orderCopy.tableCaption}
        </Text>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 py-4">
        <section className="mb-6">
          <Text as="h2" variant="h4" weight="semibold" className="mb-3 px-1 text-center">
            {orderCopy.categoryName}
          </Text>
          <div className="flex flex-col gap-2">
            {orderCopy.items.map((item) => (
              <MenuItemPreviewCard
                key={item.name}
                name={item.name}
                priceLabel={item.priceLabel}
                promoted={false}
                promotedBadgeLabel={orderCopy.promotedBadgeLabel}
                orderMode
              />
            ))}
          </div>
        </section>
      </main>
      <div className="sticky bottom-0 z-10 -mx-3 w-auto border-t border-border-default bg-surface-primary px-4 py-3 sm:-mx-4">
        <div className="mx-auto w-full max-w-lg">
          <Button type="button" variant="primary" size="lg" fullWidth className="pointer-events-none">
            {orderCopy.cartButtonLabel}
          </Button>
        </div>
      </div>
      <div className="-mx-3 w-auto border-t border-border-default bg-surface-secondary px-4 py-6 sm:-mx-4">
        <div className="mx-auto w-full max-w-lg">
          <div className="rounded-lg border border-border-default bg-surface-primary">
            <div className="p-3">
              <Text as="h3" variant="body-md" weight="semibold" className="mb-2 text-center">
                {orderCopy.summaryTitle}
              </Text>
              <div className="flex flex-col gap-2">
                {orderCopy.items.map((item) => (
                  <div key={item.name} className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Text as="span" variant="body-sm" className="block truncate">
                        {item.name}
                      </Text>
                      <Text as="span" variant="caption" className="text-text-secondary">
                        × 1 · {item.priceLabel}
                      </Text>
                    </div>
                    <Text as="span" variant="body-sm" weight="semibold" className="shrink-0 tabular-nums">
                      {item.priceLabel}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 border-t border-border-default px-3 py-2">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>{orderCopy.subtotalLabel}</span>
                <span className="tabular-nums">{orderCopy.subtotalPrice}</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary">
                <span>{orderCopy.serviceLabel}</span>
                <span className="tabular-nums">{orderCopy.servicePrice}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border-default px-3 py-2.5">
              <Text as="span" variant="body-md" weight="semibold">
                {orderCopy.totalLabel}
              </Text>
              <Text as="span" variant="body-lg" weight="bold" className="tabular-nums">
                {orderCopy.totalPrice}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  let body: ReactElement;

  switch (screen) {
    case "tables":
      body = tablesBody;

      break;
    case "menu":
      body = menuBody;

      break;
    case "order":
      body = orderBody;

      break;
    default:
      body = landingBody;
  }

  return (
    <div
      className={cn(
        "rounded-[2.25rem] border-[10px] border-border-default bg-surface-secondary/50 p-1 shadow-lg",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[1.85rem] ring-1 ring-border-default">
        <div
          className={cn(appearance === "dark" && "dark", "pointer-events-none", previewShellClassName(screen))}
          data-theme={appearance}
          style={surfaceStyle}
        >
          {body}
        </div>
      </div>
    </div>
  );
};

export type MobileGuestLandingPreviewAppearance = MobileGuestPreviewAppearance;

export type MobileGuestLandingPreviewProps = Omit<
  MobileGuestAppPreviewProps,
  "screen" | "tablesCopy" | "menuCopy" | "orderCopy" | "navHomeLabel" | "openStatusLabel" | "closedStatusLabel"
> & {
  appearance?: MobileGuestPreviewAppearance;
};

export const MobileGuestLandingPreview = ({
  appearance = "light",
  ...rest
}: MobileGuestLandingPreviewProps): ReactElement => {
  const fallbackTables: MobileGuestAppPreviewTablesCopy = {
    backLabel: "",
    subtitle: "",
    floorTitle: "",
    listTitle: "",
    sampleOpenTableLabel: "",
    sampleClosedTableLabel: "",
  };
  const fallbackMenu: MobileGuestAppPreviewMenuCopy = {
    backLabel: "",
    subtitle: "",
    categoryName: "",
    items: [],
    navHomeLabel: "",
    navTablesLabel: "",
    promotedBadgeLabel: "",
  };
  const fallbackOrder: MobileGuestAppPreviewOrderCopy = {
    tableCaption: "",
    cartButtonLabel: "",
    summaryTitle: "",
    categoryName: "",
    items: [],
    promotedBadgeLabel: "",
    subtotalLabel: "",
    subtotalPrice: "",
    serviceLabel: "",
    servicePrice: "",
    totalLabel: "",
    totalPrice: "",
  };

  return (
    <MobileGuestAppPreview
      {...rest}
      screen="landing"
      appearance={appearance}
      navHomeLabel=""
      openStatusLabel=""
      closedStatusLabel=""
      tablesCopy={fallbackTables}
      menuCopy={fallbackMenu}
      orderCopy={fallbackOrder}
    />
  );
};
