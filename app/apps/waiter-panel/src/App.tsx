import { AppWrapper, RoleGuard } from "@restorio/auth";
import type { ReactElement } from "react";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { api } from "./api/client";

const WaiterTenantSelectView = lazy(async () =>
  import("./views/WaiterTenantSelectView").then((module) => ({ default: module.WaiterTenantSelectView })),
);
const FloorRestaurantView = lazy(async () =>
  import("./views/FloorRestaurantView").then((module) => ({ default: module.FloorRestaurantView })),
);

export const App = (): ReactElement => {
  return (
    <AppWrapper client={api}>
      <RoleGuard allowedRoles={["owner", "manager", "waiter", "admin", "super_admin"]}>
        <Suspense fallback={<div />}>
          <Routes>
            <Route path="/" element={<WaiterTenantSelectView />} />
            <Route path="/:restaurantId" element={<FloorRestaurantView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </RoleGuard>
    </AppWrapper>
  );
};
