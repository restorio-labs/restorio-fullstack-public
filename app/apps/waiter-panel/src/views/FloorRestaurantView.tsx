import { AUTH_LOGIN_REDIRECT_URL, LogoutButton } from "@restorio/auth";
import { Button, Dropdown, PageLayout, ThemeSwitcher, useI18n } from "@restorio/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RiArrowGoBackFill } from "react-icons/ri";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { api } from "../api/client";
import { OrdersSidebar } from "../components/OrdersSidebar";

import { FloorRuntimeView } from "./FloorRuntimeView";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return fallback;
};

export const FloorRestaurantView = (): ReactElement => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { restaurantId = "" } = useParams<{ restaurantId: string }>();
  const tenantIdReady = restaurantId.trim() !== "";

  const { data: tenants = [] } = useQuery({
    queryKey: ["waiter-panel", "tenants"],
    queryFn: () => api.tenants.list(),
  });

  const showSwitchRestaurant = tenants.length > 1;

  const {
    data: venue,
    isLoading: isVenueLoading,
    isError: isVenueError,
    error: venueError,
  } = useQuery({
    queryKey: ["waiter-panel", "tenant", restaurantId],
    queryFn: () => api.tenants.get(restaurantId),
    enabled: tenantIdReady,
  });

  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [isOrdersSidebarOpen, setIsOrdersSidebarOpen] = useState(false);

  useEffect(() => {
    if (!venue || venue.floorCanvases.length === 0) {
      setSelectedFloorId(null);

      return;
    }

    if (selectedFloorId && venue.floorCanvases.some((canvas) => canvas.id === selectedFloorId)) {
      return;
    }

    const defaultFloorId =
      venue.floorCanvases.find((canvas) => canvas.id === venue.activeLayoutVersionId)?.id ?? venue.floorCanvases[0].id;

    setSelectedFloorId(defaultFloorId);
  }, [selectedFloorId, venue]);

  const handleLogout = useCallback(async (): Promise<void> => {
    await api.auth.logout();
  }, []);

  const activeFloorName = useMemo(() => {
    if (!venue) {
      return t("waiterDashboard.activeFloorNone");
    }

    if (venue.floorCanvases.length === 0) {
      return t("waiterDashboard.activeFloorNoConfigured");
    }

    const activeCanvas = venue.floorCanvases.find((canvas) => canvas.id === selectedFloorId) ?? venue.floorCanvases[0];

    return activeCanvas.name;
  }, [selectedFloorId, t, venue]);

  if (!tenantIdReady) {
    return <Navigate to="/" replace />;
  }

  const floorControl =
    venue && venue.floorCanvases.length > 1 ? (
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Dropdown
          trigger={
            <Button type="button" variant="secondary" size="sm">
              {activeFloorName}
            </Button>
          }
          placement="bottom-end"
          closeOnSelect
        >
          <div className="w-max p-2">
            {venue.floorCanvases.map((canvas) => (
              <button
                key={canvas.id}
                type="button"
                className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary"
                onClick={() => setSelectedFloorId(canvas.id)}
              >
                {canvas.name}
              </button>
            ))}
          </div>
        </Dropdown>
      </div>
    ) : (
      <div className="rounded-md border border-border-default bg-surface-primary px-3 py-1.5 text-sm text-text-secondary">
        {activeFloorName}
      </div>
    );

  const sessionControls = (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsOrdersSidebarOpen(true);
        }}
      >
        {t("waiterDashboard.todaysOrders")}
      </Button>
      {showSwitchRestaurant && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            navigate("/");
          }}
        >
          <RiArrowGoBackFill className="size-5" />
        </Button>
      )}
      <ThemeSwitcher />
      <LogoutButton
        variant="danger"
        size="icon"
        onLogout={handleLogout}
        redirectTo={AUTH_LOGIN_REDIRECT_URL}
        className="size-9"
        loadingLabel={t("waiterDashboard.loggingOut")}
      />
    </>
  );

  const headerActions = (
    <div className="hidden flex-wrap items-center justify-end gap-2 md:flex">
      {floorControl}
      {sessionControls}
    </div>
  );

  const mobileControls = (
    <div className="flex flex-col gap-2 rounded-lg border border-border-default bg-surface-primary p-3 md:hidden">
      <div className="flex flex-wrap items-center gap-2">{floorControl}</div>
      <div className="flex flex-wrap items-center gap-2">{sessionControls}</div>
    </div>
  );

  return (
    <PageLayout
      title={venue?.name ?? t("waiterDashboard.title")}
      description={t("waiterDashboard.description")}
      headerActions={headerActions}
    >
      <div className="flex h-full min-h-0 flex-col gap-4 p-4">
        {mobileControls}
        {isVenueLoading && <div className="text-sm text-text-tertiary">{t("waiterDashboard.loadingFloor")}</div>}
        {isVenueError && (
          <div className="rounded-lg border border-status-error-border bg-status-error-background px-4 py-3 text-sm text-status-error-text">
            {getErrorMessage(venueError, t("waiterDashboard.loadFloorError"))}
          </div>
        )}
        {!isVenueLoading && !isVenueError && venue && (
          <div className="min-h-0 flex-1">
            <FloorRuntimeView venue={venue} selectedFloorId={selectedFloorId} />
          </div>
        )}
      </div>
      <OrdersSidebar
        isOpen={isOrdersSidebarOpen}
        onClose={() => setIsOrdersSidebarOpen(false)}
        venueId={restaurantId}
      />
    </PageLayout>
  );
};
