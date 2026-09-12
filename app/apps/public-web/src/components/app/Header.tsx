"use client";

import { AUTH_LOGIN_REDIRECT_URL, LogoutButton } from "@restorio/auth";
import type { AppSlug } from "@restorio/types";
import { Button, Icon, Loader, ThemeSwitcher, Topbar, cn, useAuthRoute, type AuthRouteStatus } from "@restorio/ui";
import { goToApp } from "@restorio/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { IoLogOutOutline } from "react-icons/io5";

import { api } from "@/api/client";
import { useTranslations, useLocale } from "@/i18n/useT";

export const Header = (): ReactElement => {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { authStatus }: { authStatus: AuthRouteStatus } = useAuthRoute();

  const handleLogout = useCallback(async (): Promise<void> => {
    await api.auth.logout();
  }, []);

  const appSlugs = useMemo((): { slug: AppSlug; label: string }[] => {
    return [
      { slug: "admin-panel", label: t("chooseApp.labels.adminPanel") },
      { slug: "kitchen-panel", label: t("chooseApp.labels.kitchenPanel") },
      { slug: "waiter-panel", label: t("chooseApp.labels.waiterPanel") },
    ];
  }, [t]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const renderCtaSlot = (): ReactElement => {
    if (authStatus === "authenticated") {
      return (
        <>
          <div className="hidden flex-wrap items-center justify-end gap-2 md:flex">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-full border-border-default/70 bg-surface-primary/60 px-3 py-2 text-xs font-medium shadow-sm sm:text-sm"
              onClick={() => goToApp("kitchen-panel")}
            >
              {t("chooseApp.labels.kitchenPanel")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-full border-border-default/70 bg-surface-primary/60 px-3 py-2 text-xs font-medium shadow-sm sm:text-sm"
              onClick={() => goToApp("waiter-panel")}
            >
              {t("chooseApp.labels.waiterPanel")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="primary"
              className="rounded-full px-4 py-2 text-xs font-semibold shadow-md shadow-primary/25 sm:text-sm"
              onClick={() => goToApp("admin-panel")}
            >
              {t("chooseApp.labels.adminPanel")}
            </Button>
          </div>
          <LogoutButton
            variant="outline"
            aria-label={t("navigation.logout")}
            onLogout={handleLogout}
            redirectTo={AUTH_LOGIN_REDIRECT_URL}
            loadingLabel={t("navigation.logoutLoading")}
            loadingContent={
              <>
                <Loader size="sm" className="text-current md:hidden" aria-label={t("navigation.logoutLoading")} />
                <span className="hidden md:inline">{t("navigation.logoutLoading")}</span>
              </>
            }
            className="h-9 w-9 shrink-0 justify-center gap-0 overflow-hidden rounded-full p-0 text-base md:h-auto md:w-auto md:min-h-10 md:shrink md:gap-2 md:overflow-visible md:px-4 md:py-2 md:text-sm md:font-semibold"
          >
            <span className="inline-flex items-center gap-0 md:gap-2">
              <IoLogOutOutline className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden font-medium md:inline">{t("navigation.logout")}</span>
            </span>
          </LogoutButton>
        </>
      );
    }

    return (
      <>
        <div className="hidden items-center gap-2 md:flex">
          <Link href={`/${locale}/login`}>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full border-border-default/70 bg-surface-primary/60 px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-surface-secondary"
            >
              {t("navigation.login")}
            </Button>
          </Link>
          <Link href={`/${locale}/register`}>
            <Button
              size="sm"
              variant="primary"
              className="rounded-full px-5 py-2 text-sm font-semibold shadow-md shadow-primary/25 md:text-base"
            >
              {t("navigation.register")}
            </Button>
          </Link>
        </div>
      </>
    );
  };

  return (
    <>
      <Topbar
        aria-label="Main navigation"
        sticky
        contentMaxWidth="2xl"
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuOpenChange={setMobileMenuOpen}
        className="border-b border-border-default/70 bg-surface-primary/85 shadow-[0_10px_40px_-24px_rgba(16,24,40,0.7)] supports-[backdrop-filter]:backdrop-blur-xl"
        brandSlot={
          <Link href={`/${locale}`} className="flex h-16 items-center gap-2 transition-opacity hover:opacity-90">
            <Icon isLogo size="full" logoBackground="transparent" wink />
          </Link>
        }
        ctaSlot={
          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3 md:min-h-10 md:min-w-[26rem]">
            {authStatus !== "authenticated" ? (
              <span className="inline-block h-9 w-9 shrink-0 md:hidden" aria-hidden />
            ) : null}
            {renderCtaSlot()}
            <ThemeSwitcher className="h-9 w-9 shrink-0 rounded-full" />
          </div>
        }
      >
        {authStatus === "authenticated"
          ? appSlugs.map(({ slug, label }) => (
              <Button
                key={slug}
                type="button"
                variant={slug === "admin-panel" ? "primary" : "secondary"}
                size="lg"
                fullWidth
                className="min-h-14 rounded-full text-lg font-semibold shadow-sm md:hidden"
                onClick={() => goToApp(slug)}
              >
                {label}
              </Button>
            ))
          : null}
        {authStatus === "anonymous" || authStatus === "unavailable" || authStatus === "reconnecting" ? (
          <>
            <Link
              href={`/${locale}/login`}
              className={cn(
                "inline-flex min-h-14 w-full items-center justify-center rounded-full border border-border-default/70 bg-interactive-secondary px-6 py-3 text-lg font-semibold text-text-primary shadow-sm transition-colors duration-200 hover:bg-interactive-secondaryHover active:bg-interactive-secondaryActive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                pathname === `/${locale}/login` && "ring-2 ring-border-focus ring-offset-2 ring-offset-surface-primary",
                "md:hidden",
              )}
            >
              {t("navigation.login")}
            </Link>
            <Link
              href={`/${locale}/register`}
              className={cn(
                "inline-flex min-h-14 w-full items-center justify-center rounded-full bg-interactive-primary px-6 py-3 text-lg font-semibold text-text-inverse shadow-md shadow-primary/25 transition-colors duration-200 hover:bg-interactive-primaryHover active:bg-interactive-primaryActive focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                pathname === `/${locale}/register` &&
                  "ring-2 ring-border-focus ring-offset-2 ring-offset-surface-primary",
                "md:hidden",
              )}
            >
              {t("navigation.register")}
            </Link>
          </>
        ) : null}
      </Topbar>
    </>
  );
};
