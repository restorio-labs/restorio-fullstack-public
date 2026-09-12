import { AppShell, useBreakpoint, useI18n } from "@restorio/ui";
import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
}

export const AppLayout = ({ children, header, footer, sidebar }: AppLayoutProps): ReactNode => {
  const { t } = useI18n();
  const isDesktopUp = useBreakpoint("xl");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const mobileMenuId = useId();

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname, isDesktopUp]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-interactive-primary focus:text-text-inverse focus:rounded-button focus-visible-ring focus:block focus:not-sr-only"
      >
        {t("common.skipToContent")}
      </a>
      <AppShell header={header} footer={footer} sidebar={isDesktopUp ? sidebar : undefined} sidebarPosition="left">
        <div id="main-content" className="flex min-h-0 min-w-0 flex-1 flex-col">
          {children}
        </div>
      </AppShell>

      {!isDesktopUp && sidebar && (
        <>
          <button
            type="button"
            aria-label={isMobileSidebarOpen ? t("sidebar.mobile.closeMenu") : t("sidebar.mobile.openMenu")}
            aria-expanded={isMobileSidebarOpen}
            aria-controls={mobileMenuId}
            onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
            className="fixed bottom-4 right-4 z-modal inline-flex h-14 w-14 items-center justify-center rounded-full bg-interactive-primary text-text-inverse shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            <span className="sr-only">
              {isMobileSidebarOpen ? t("sidebar.mobile.closeMenu") : t("sidebar.mobile.openMenu")}
            </span>
            {isMobileSidebarOpen ? (
              <span aria-hidden="true" className="relative block h-6 w-6">
                <span className="absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 rotate-45 rounded bg-current" />
                <span className="absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 -rotate-45 rounded bg-current" />
              </span>
            ) : (
              <span aria-hidden="true" className="grid gap-1.5">
                <span className="h-0.5 w-6 rounded bg-current" />
                <span className="h-0.5 w-6 rounded bg-current" />
                <span className="h-0.5 w-6 rounded bg-current" />
              </span>
            )}
          </button>

          {isMobileSidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 z-dropdown bg-surface-overlay"
              aria-label={t("sidebar.mobile.closeMenu")}
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          <aside
            id={mobileMenuId}
            className={[
              "fixed inset-y-0 right-0 z-sticky flex w-72 max-w-[85vw] flex-col border-s border-border-default bg-surface-secondary shadow-xl",
              "transition-transform duration-normal ease-out",
              isMobileSidebarOpen ? "translate-x-0" : "translate-x-full",
            ].join(" ")}
            aria-label={t("sidebar.ariaLabel")}
            // @ts-expect-error - inert is not yet in React 18 types
            inert={!isMobileSidebarOpen ? "" : undefined}
          >
            {sidebar}
          </aside>
        </>
      )}
    </>
  );
};
