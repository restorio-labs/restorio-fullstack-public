import { LogoutButton, AUTH_LOGIN_REDIRECT_URL } from "@restorio/auth";
import { ChooseApp, NavIcon, ThemeSwitcher, NavItem, NavSection, Sidebar, useI18n } from "@restorio/ui";
import { goToApp } from "@restorio/utils";
import type { ReactElement } from "react";
import { useCallback } from "react";
import { IoFastFoodSharp } from "react-icons/io5";
import {
  TbBuildingStore,
  TbCreditCard,
  TbDeviceMobile,
  TbLayoutDashboardFilled,
  TbQrcode,
  TbUsersGroup,
  TbTransactionDollar,
} from "react-icons/tb";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { api } from "../../api/client";
import { TenantSwitcher } from "../tenant/TenantSwitcher";

const UNSAVED_CHANGES_NAVIGATION_EVENT = "restorio:unsaved-changes-navigation-attempt";

const NAV_ITEM_ROW_CLASS =
  "flex-row-reverse justify-between text-end [&>span:last-child]:w-full [&>span:last-child]:text-end lg:flex-row lg:justify-start lg:text-start lg:[&>span:last-child]:w-auto lg:[&>span:last-child]:text-start";

const NAV_ITEM_ICON_SIZE = "8";
const NAV_ITEM_ICON_CLASS = `h-${NAV_ITEM_ICON_SIZE} w-${NAV_ITEM_ICON_SIZE}`;

export const AdminSidebar = (): ReactElement => {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string): boolean => {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(path);
  };

  const handleLogout = useCallback(async (): Promise<void> => {
    await api.auth.logout();
  }, []);

  const handleRouteNavigation = useCallback(
    (event: React.MouseEvent, path: string): void => {
      if (pathname !== path) {
        const navigationEvent = new CustomEvent(UNSAVED_CHANGES_NAVIGATION_EVENT, {
          detail: { path, sourcePath: pathname },
          cancelable: true,
        });
        const wasBlocked = !window.dispatchEvent(navigationEvent);

        if (wasBlocked) {
          event.preventDefault();

          return;
        }
      }

      navigate(path);
    },
    [navigate, pathname],
  );

  return (
    <Sidebar aria-label={t("sidebar.ariaLabel")} variant="persistent" className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-border-default">
        <TenantSwitcher />
      </div>

      <div className="flex flex-col gap-2 p-2">
        <NavSection aria-label={t("sidebar.sections")}>
          <NavItem
            as={Link}
            to="/"
            active={isActive("/")}
            role="menuitem"
            className={NAV_ITEM_ROW_CLASS}
            icon={
              <NavIcon className={NAV_ITEM_ICON_CLASS}>
                <TbLayoutDashboardFilled className={NAV_ITEM_ICON_CLASS} />
              </NavIcon>
            }
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/")}
          >
            {t("sidebar.items.floorEditor")}
          </NavItem>
          <NavItem
            as={Link}
            to="/menu-creator"
            active={isActive("/menu-creator")}
            role="menuitem"
            className={NAV_ITEM_ROW_CLASS}
            icon={
              <NavIcon className={NAV_ITEM_ICON_CLASS}>
                <IoFastFoodSharp className={NAV_ITEM_ICON_CLASS} />
              </NavIcon>
            }
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/menu-creator")}
          >
            {t("sidebar.items.menuCreator")}
          </NavItem>
          <NavItem
            as={Link}
            to="/mobile-configuration"
            active={isActive("/mobile-configuration")}
            role="menuitem"
            className={NAV_ITEM_ROW_CLASS}
            icon={
              <NavIcon className={NAV_ITEM_ICON_CLASS}>
                <TbDeviceMobile className={NAV_ITEM_ICON_CLASS} />
              </NavIcon>
            }
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/mobile-configuration")}
          >
            {t("sidebar.items.mobileConfiguration")}
          </NavItem>
          {/* <NavItem
            as={Link}
            to="/main-page-configurator"
            active={isActive("/main-page-configurator")}
            role="menuitem"
            className={NAV_ITEM_ROW_CLASS}
            icon={
              <NavIcon className={NAV_ITEM_ICON_CLASS}>
                <RiPagesFill className={NAV_ITEM_ICON_CLASS} />
              </NavIcon>
            }
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/main-page-configurator")}
          >
            {t("sidebar.items.pageConfigurator")}
          </NavItem> */}
          <NavItem
            as={Link}
            to="/profile"
            active={isActive("/profile")}
            role="menuitem"
            className={NAV_ITEM_ROW_CLASS}
            icon={
              <NavIcon className={NAV_ITEM_ICON_CLASS}>
                <TbBuildingStore className={NAV_ITEM_ICON_CLASS} />
              </NavIcon>
            }
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/profile")}
          >
            {t("sidebar.items.tenantProfile")}
          </NavItem>
          <NavItem
            as={Link}
            to="/payment-config"
            active={isActive("/payment-config")}
            role="menuitem"
            className={NAV_ITEM_ROW_CLASS}
            icon={
              <NavIcon className={NAV_ITEM_ICON_CLASS}>
                <TbCreditCard className={NAV_ITEM_ICON_CLASS} />
              </NavIcon>
            }
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/payment-config")}
          >
            {t("sidebar.items.paymentConfig")}
          </NavItem>
          <NavItem
            as={Link}
            to="/staff"
            active={isActive("/staff")}
            role="menuitem"
            className={NAV_ITEM_ROW_CLASS}
            icon={
              <NavIcon className={NAV_ITEM_ICON_CLASS}>
                <TbUsersGroup className={NAV_ITEM_ICON_CLASS} />
              </NavIcon>
            }
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/staff")}
          >
            {t("sidebar.items.staff")}
          </NavItem>
          <NavItem
            as={Link}
            to="/transactions"
            active={isActive("/transactions")}
            role="menuitem"
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/transactions")}
            className={NAV_ITEM_ROW_CLASS}
            icon={
              <NavIcon className={NAV_ITEM_ICON_CLASS}>
                <TbTransactionDollar className={NAV_ITEM_ICON_CLASS} />
              </NavIcon>
            }
          >
            {t("sidebar.items.transactions")}
          </NavItem>
          <NavItem
            as={Link}
            to="/qr-code-generator"
            active={isActive("/qr-code-generator")}
            role="menuitem"
            className={NAV_ITEM_ROW_CLASS}
            icon={
              <NavIcon className={NAV_ITEM_ICON_CLASS}>
                <TbQrcode className={NAV_ITEM_ICON_CLASS} />
              </NavIcon>
            }
            onClick={(event: React.MouseEvent) => handleRouteNavigation(event, "/qr-code-generator")}
          >
            {t("sidebar.items.qrCodeGenerator")}
          </NavItem>
        </NavSection>
      </div>
      <div className="sticky bottom-0 mt-4 flex flex-col gap-3 border-t border-border-default bg-surface-secondary/80 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary">
          <ThemeSwitcher />
          <div className="flex items-center gap-2">
            <span>{t("languageSwitcher.label")}</span>
            <span className="rounded-md border border-border-default px-2 py-1 text-xs font-semibold tracking-wide">
              PL
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span>{t("sidebar.items.label")}</span>
            <ChooseApp
              variant="dropdown"
              subvariant="large"
              value="admin-panel"
              onSelectApp={goToApp}
              ariaLabel={t("sidebar.items.label")}
              className="w-auto"
            />
          </div>
        </div>
        <LogoutButton
          variant="danger"
          fullWidth
          onLogout={handleLogout}
          redirectTo={AUTH_LOGIN_REDIRECT_URL}
          loadingLabel={t("sidebar.logoutLoading")}
        />
      </div>
    </Sidebar>
  );
};
