import { Loader } from "@restorio/ui";
import type { ReactElement } from "react";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { MobileDeviceGate } from "./components/MobileDeviceGate";
import { AppLayout } from "./layouts/AppLayout";

const RootRedirectPage = lazy(async () =>
  import("./pages/RootRedirectPage").then((module) => ({ default: module.RootRedirectPage })),
);
const PaymentReturnPage = lazy(async () =>
  import("./pages/PaymentReturnPage").then((module) => ({ default: module.PaymentReturnPage })),
);
const OrderPage = lazy(async () => import("./pages/OrderPage").then((module) => ({ default: module.OrderPage })));
const TablesLookupPage = lazy(async () =>
  import("./pages/TablesLookupPage").then((module) => ({ default: module.TablesLookupPage })),
);
const TenantMenuPage = lazy(async () =>
  import("./pages/TenantMenuPage").then((module) => ({ default: module.TenantMenuPage })),
);
const TenantLandingPage = lazy(async () =>
  import("./pages/TenantLandingPage").then((module) => ({ default: module.TenantLandingPage })),
);

const routeFallback = (
  <div className="flex min-h-[40vh] items-center justify-center">
    <Loader size="md" aria-hidden />
  </div>
);

export const App = (): ReactElement => {
  return (
    <MobileDeviceGate>
      <AppLayout>
        <Suspense fallback={routeFallback}>
          <Routes>
            <Route path="/" element={<RootRedirectPage />} />
            <Route path="/payment/return" element={<PaymentReturnPage />} />
            <Route path="/:tenantSlug/table/:tableNumber" element={<OrderPage />} />
            <Route path="/:tenantSlug/tables" element={<TablesLookupPage />} />
            <Route path="/:tenantSlug/menu" element={<TenantMenuPage />} />
            <Route path="/:tenantSlug" element={<TenantLandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </MobileDeviceGate>
  );
};
