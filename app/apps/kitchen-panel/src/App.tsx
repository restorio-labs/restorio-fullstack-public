import { AppWrapper, RoleGuard } from "@restorio/auth";
import { lazy, Suspense, type ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { api } from "./api/client";
import { TenantRouteGuard } from "./components/TenantRouteGuard";
import { AppLayout } from "./layouts/AppLayout";

const KitchenTenantSelectView = lazy(async () =>
  import("./views/KitchenTenantSelectView").then((module) => ({ default: module.KitchenTenantSelectView })),
);
const KitchenView = lazy(async () => import("./views/KitchenView").then((module) => ({ default: module.KitchenView })));
const MenuAvailabilityView = lazy(async () =>
  import("./views/MenuAvailabilityView").then((module) => ({ default: module.MenuAvailabilityView })),
);

export const App = (): ReactElement => {
  return (
    <AppWrapper client={api}>
      <RoleGuard allowedRoles={["owner", "manager", "kitchen", "admin", "super_admin"]}>
        <Suspense fallback={<div />}>
          <Routes>
            <Route path="/" element={<KitchenTenantSelectView />} />
            <Route
              path="/:tenantId"
              element={
                <AppLayout>
                  <TenantRouteGuard />
                </AppLayout>
              }
            >
              <Route index element={<KitchenView />} />
              <Route path="menu" element={<MenuAvailabilityView />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </RoleGuard>
    </AppWrapper>
  );
};
