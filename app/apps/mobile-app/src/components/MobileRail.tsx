import { Icon, NavIcon, NavItem, NavRail, useI18n } from "@restorio/ui";
import type { ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";

const homeIcon = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
  />
);

export const MobileRail = (): ReactElement => {
  const { t } = useI18n();
  const location = useLocation();
  const { pathname } = location;

  return (
    <NavRail aria-label={t("nav.railAria")} orientation="horizontal">
      <NavItem
        as={Link}
        to="/"
        href="/"
        active={pathname === "/"}
        touchTarget
        aria-label={t("nav.homeAria")}
        role="menuitem"
        icon={
          <NavIcon>
            <Icon size="lg">{homeIcon}</Icon>
          </NavIcon>
        }
      />
    </NavRail>
  );
};
