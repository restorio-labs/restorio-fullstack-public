import { AUTH_LOGIN_REDIRECT_URL, AppWrapper, useCurrentRole, type UserRole } from "@restorio/auth";
import { lazy, Suspense, type ReactElement, useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate, useLocation } from "react-router-dom";

import { api } from "./api/client";
import { useCurrentTenant } from "./context/TenantContext";
import { AdminSidebar } from "./features/sidebar/AdminSidebar";
import { AppLayout } from "./layouts/AppLayout";
import { OnboardingPage } from "./pages/OnboardingPage";

const PublicWebLoginRedirect = (): null => {
  useEffect(() => {
    window.location.replace(AUTH_LOGIN_REDIRECT_URL);
  }, []);

  return null;
};

const FloorEditorPage = lazy(async () =>
  import("./pages/FloorEditorPage").then((module) => ({ default: module.FloorEditorPage })),
);
const RestaurantCreatorPage = lazy(async () =>
  import("./pages/RestaurantCreatorPage").then((module) => ({ default: module.RestaurantCreatorPage })),
);
const MenuCreatorPage = lazy(async () =>
  import("./pages/MenuCreatorPage").then((module) => ({ default: module.MenuCreatorPage })),
);
const MobileConfigurationPage = lazy(async () =>
  import("./pages/MobileConfigurationPage").then((module) => ({ default: module.MobileConfigurationPage })),
);
const QRCodeGeneratorPage = lazy(async () =>
  import("./pages/QRCodeGeneratorPage").then((module) => ({ default: module.QRCodeGeneratorPage })),
);
const PaymentConfigPage = lazy(async () =>
  import("./pages/PaymentConfigPage").then((module) => ({ default: module.PaymentConfigPage })),
);
const TenantProfilePage = lazy(async () =>
  import("./pages/TenantProfilePage").then((module) => ({ default: module.TenantProfilePage })),
);
const StaffPage = lazy(async () => import("./pages/StaffPage").then((module) => ({ default: module.StaffPage })));
const TableQRCodePage = lazy(async () =>
  import("./pages/TableQRCodePage").then((module) => ({ default: module.TableQRCodePage })),
);
const RestaurantQRCodePage = lazy(async () =>
  import("./pages/RestaurantQRCodePage").then((module) => ({ default: module.RestaurantQRCodePage })),
);
const QRCodePrintPage = lazy(async () =>
  import("./pages/QRCodePrintPage").then((module) => ({ default: module.QRCodePrintPage })),
);
const TransactionListPage = lazy(async () =>
  import("./pages/TransactionListPage").then((module) => ({ default: module.TransactionListPage })),
);

const AdminShell = (): ReactElement => {
  const { tenants, tenantsState } = useCurrentTenant();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const showOnboarding = tenantsState === "loaded" && tenants.length === 0;

    if (showOnboarding && location.pathname !== "/onboarding") {
      navigate("/onboarding", { replace: true });
    }
  }, [tenantsState, tenants.length, location.pathname, navigate]);

  return (
    <AppLayout sidebar={<AdminSidebar />}>
      <Outlet />
    </AppLayout>
  );
};

const ADMIN_ALLOWED_ROLES: UserRole[] = ["owner", "manager", "admin", "super_admin"];

const AdminRoleGate = (): ReactElement => {
  const role = useCurrentRole();

  if (role === null) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!ADMIN_ALLOWED_ROLES.includes(role)) {
    return <PublicWebLoginRedirect />;
  }

  return <AdminShell />;
};

export const App = (): ReactElement => {
  return (
    <AppWrapper client={api}>
      <Suspense fallback={<div />}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<AdminRoleGate />}>
            <Route index element={<FloorEditorPage />} />
            <Route path="restaurant-creator" element={<RestaurantCreatorPage />} />
            <Route path="menu-creator" element={<MenuCreatorPage />} />
            <Route path="mobile-configuration" element={<MobileConfigurationPage />} />
            {/* <Route path="main-page-configurator" element={<MenuPageConfiguratorPage />} /> */}
            <Route path="qr-code-generator" element={<QRCodeGeneratorPage />} />
            <Route path="payment-config" element={<PaymentConfigPage />} />
            <Route path="profile" element={<TenantProfilePage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="transactions" element={<TransactionListPage />} />
          </Route>
          <Route path="/qr-code/table/:tableId" element={<TableQRCodePage />} />
          <Route path="/qr-code/restaurant" element={<RestaurantQRCodePage />} />
          <Route path="/qr-code/tables" element={<QRCodePrintPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppWrapper>
  );
};
