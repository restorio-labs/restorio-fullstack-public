import type {
  PublicFloorCanvasOverview,
  PublicFloorTableStatus,
  PublicTenantInfo,
  PublicTablesOverview,
} from "@restorio/types";
import { Button, cn, EmptyState, Loader, Modal, Text, useI18n } from "@restorio/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { publicApi } from "../api/client";
import { GuestBottomNav } from "../components/GuestBottomNav";
import { useApplyPublicTenantPresentation } from "../hooks/useApplyPublicTenantPresentation";
import { isTenantNotFoundApiError } from "../lib/isTenantNotFoundApiError";
import { persistLastVisitedTenantPath } from "../lib/lastVisitedTenant";

const REFRESH_MS = 12_000;
const FALLBACK_RESERVED_MS = 90_000;
const MIN_COUNTDOWN_MS = 3_000;

const parseReservedUntilMs = (iso: string | null | undefined): number => {
  if (!iso?.trim()) {
    return Date.now() + FALLBACK_RESERVED_MS;
  }
  const t = new Date(iso).getTime();

  if (Number.isNaN(t)) {
    return Date.now() + FALLBACK_RESERVED_MS;
  }

  return Math.max(Date.now() + MIN_COUNTDOWN_MS, t);
};

const formatTimeRemaining = (totalSeconds: number): string => {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;

  return `${m}:${r.toString().padStart(2, "0")}`;
};

const floorTableButtonLabel = (tbl: PublicFloorTableStatus): string => {
  const trimmed = tbl.label?.trim();

  if (trimmed) {
    return trimmed;
  }

  return tbl.tableNumber != null ? String(tbl.tableNumber) : "—";
};

interface FloorPreviewProps {
  canvas: PublicFloorCanvasOverview;
  openLabel: string;
  closedLabel: string;
  onTablePress: (table: PublicFloorTableStatus) => void;
}

const FloorPreview = ({ canvas, openLabel, closedLabel, onTablePress }: FloorPreviewProps): ReactElement => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapRef.current;

    if (!el) {
      return;
    }

    const measure = (): void => {
      const w = el.clientWidth;

      if (w <= 0 || canvas.width <= 0) {
        return;
      }

      setScale(Math.min(1, w / canvas.width));
    };

    measure();
    const ro = new ResizeObserver(measure);

    ro.observe(el);

    return (): void => {
      ro.disconnect();
    };
  }, [canvas.width]);

  return (
    <div ref={wrapRef} className="w-full max-w-full">
      <div
        className="relative mx-auto overflow-hidden rounded-xl border border-border-default bg-surface-secondary shadow-inner"
        style={{
          width: canvas.width * scale,
          height: canvas.height * scale,
        }}
      >
        {canvas.tables.map((tbl) => {
          const isOpen = tbl.status === "open";

          return (
            <button
              key={tbl.id}
              type="button"
              onClick={() => onTablePress(tbl)}
              className={cn(
                "absolute flex cursor-pointer touch-manipulation items-center justify-center rounded-md border-2 px-0.5 text-center text-[10px] font-bold leading-tight text-text-primary sm:text-xs",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-status-success-text focus-visible:ring-offset-2",
                isOpen
                  ? "border-status-success-border bg-status-success-background/90 hover:bg-status-success-background"
                  : "border-status-error-border bg-status-error-background/90 hover:bg-status-error-background",
              )}
              style={{
                left: tbl.x * scale,
                top: tbl.y * scale,
                width: Math.max(10, tbl.w * scale),
                height: Math.max(10, tbl.h * scale),
                transform: tbl.rotation ? `rotate(${tbl.rotation}deg)` : undefined,
                transformOrigin: "center",
              }}
              title={isOpen ? openLabel : closedLabel}
            >
              <span className="line-clamp-2 pointer-events-none">{floorTableButtonLabel(tbl)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface ReservedModalState {
  label: string;
  untilMs: number;
}

export const TablesLookupPage = (): ReactElement => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [reservedModal, setReservedModal] = useState<ReservedModalState | null>(null);
  const [, setCountdownPulse] = useState(0);

  const tenantQuery = useQuery<PublicTenantInfo>({
    queryKey: ["public-tenant-info", tenantSlug],
    queryFn: ({ signal }) => publicApi.getTenantInfo(tenantSlug!, signal),
    enabled: !!tenantSlug,
  });

  const tablesQuery = useQuery<PublicTablesOverview>({
    queryKey: ["public-tables-overview", tenantSlug],
    queryFn: ({ signal }) => publicApi.getTenantTablesOverview(tenantSlug!, signal),
    enabled: !!tenantSlug,
    refetchInterval: REFRESH_MS,
  });

  useApplyPublicTenantPresentation(tenantQuery.data);

  useEffect(() => {
    if (tenantSlug && tenantQuery.data) {
      persistLastVisitedTenantPath(`/${tenantSlug}`);
    }
  }, [tenantSlug, tenantQuery.data]);

  useEffect(() => {
    if (!reservedModal || !tenantSlug) {
      return;
    }

    const id = window.setInterval(() => {
      setCountdownPulse((x) => x + 1);
      const now = Date.now();

      if (now >= reservedModal.untilMs) {
        setReservedModal(null);
        void queryClient.invalidateQueries({ queryKey: ["public-tables-overview", tenantSlug] });
        navigate(`/${tenantSlug}/tables`, { replace: true });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 1000);

    return (): void => window.clearInterval(id);
  }, [reservedModal, tenantSlug, queryClient, navigate]);

  const handleTablePress = (tbl: PublicFloorTableStatus): void => {
    if (tbl.status === "open") {
      if (tbl.tableNumber == null) {
        return;
      }

      navigate(`/${tenantSlug}/table/${tbl.tableNumber}?ref=${encodeURIComponent(tbl.id)}`);

      return;
    }

    const trimmed = tbl.label?.trim();
    const label = trimmed ? trimmed : t("order.tableLabel", { number: String(tbl.tableNumber ?? "?") });

    setReservedModal({
      label,
      untilMs: parseReservedUntilMs(tbl.reservedUntil),
    });
  };

  if (!tenantSlug) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <EmptyState title={t("order.invalidLinkTitle")} description={t("order.invalidLinkDescription")} />
        </div>
      </div>
    );
  }

  const isLoading = tenantQuery.isLoading || tablesQuery.isLoading;
  const isError = tenantQuery.isError || tablesQuery.isError;

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader size="lg" />
          <Text as="p" variant="body-sm" className="text-text-secondary">
            {t("tables.loading")}
          </Text>
        </div>
      </div>
    );
  }

  if (isError || !tenantQuery.data || !tablesQuery.data) {
    if (tenantQuery.isError && isTenantNotFoundApiError(tenantQuery.error)) {
      return <Navigate to="/" replace />;
    }

    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <EmptyState
            title={t("order.loadErrorTitle")}
            description={t("order.loadErrorDescription")}
            action={
              <Button variant="primary" onClick={() => window.location.reload()}>
                {t("order.reload")}
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const displayName = tenantQuery.data.pageTitle?.trim() ? tenantQuery.data.pageTitle : tenantQuery.data.name;
  const lc = tenantQuery.data.landingContent;
  const openTrimmed = lc?.openStatusLabel?.trim();
  const closedTrimmed = lc?.closedStatusLabel?.trim();
  const openLabel = openTrimmed ? openTrimmed : t("tables.statusOpen");
  const closedLabel = closedTrimmed ? closedTrimmed : t("tables.statusClosed");

  const canvases = tablesQuery.data.canvases.filter((c) => c.tables.length > 0);
  const flatTables = canvases.flatMap((c) => c.tables);

  const secondsLeft = reservedModal != null ? Math.max(0, Math.ceil((reservedModal.untilMs - Date.now()) / 1000)) : 0;

  return (
    <div className="min-h-[100dvh] bg-background-primary pb-24">
      <header className="sticky top-0 z-10 border-b border-border-default bg-surface-primary px-4 py-4 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            className={cn("my-2 py-2 px-4")}
            onClick={() => navigate(`/${tenantSlug}`)}
          >
            {t("tables.back")}
          </Button>
          <Text as="h1" variant="h2" weight="bold" align="center" className="w-full text-balance">
            {displayName}
          </Text>
          <Text as="p" variant="body-lg" weight="medium" align="center" className="text-pretty text-text-secondary">
            {t("tables.subtitle")}
          </Text>
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg px-4 py-4 text-center">
        <div className="mb-4 flex flex-wrap justify-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-success-border bg-status-success-background/50 px-3 py-1 font-medium">
            <span className="h-2 w-2 rounded-full bg-status-success-text" aria-hidden />
            {openLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-status-error-border bg-status-error-background/50 px-3 py-1 font-medium">
            <span className="h-2 w-2 rounded-full bg-status-error-text" aria-hidden />
            {closedLabel}
          </span>
        </div>

        {canvases.length === 0 ? (
          <div className="mx-auto max-w-md">
            <EmptyState title={t("tables.noLayoutTitle")} description={t("tables.noLayoutDescription")} />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {canvases.map((canvas) => (
              <section key={`${canvas.name}-${canvas.width}`} className="flex flex-col items-center">
                <Text as="h2" variant="body-md" weight="semibold" className="mb-2 w-full text-center text-balance">
                  {canvas.name}
                </Text>
                <FloorPreview
                  canvas={canvas}
                  openLabel={openLabel}
                  closedLabel={closedLabel}
                  onTablePress={handleTablePress}
                />
              </section>
            ))}
          </div>
        )}

        {flatTables.length > 0 ? (
          <div className="mt-8 w-full rounded-xl border border-border-default bg-surface-primary p-4">
            <Text as="h2" variant="body-md" weight="semibold" className="mb-3 text-center">
              {t("tables.listTitle")}
            </Text>
            <ul className="flex flex-col gap-2">
              {flatTables.map((tbl) => {
                const isOpen = tbl.status === "open";
                const trimmed = tbl.label?.trim();
                const label = trimmed ? trimmed : t("order.tableLabel", { number: String(tbl.tableNumber ?? "?") });

                return (
                  <li key={tbl.id}>
                    <button
                      type="button"
                      onClick={() => handleTablePress(tbl)}
                      className={cn(
                        "flex w-full gap-3 rounded-lg border border-border-default px-3 py-2.5 text-left transition-colors",
                        "flex-col items-center text-center sm:flex-row sm:justify-between sm:text-left sm:items-center",
                        "hover:bg-surface-secondary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-status-success-text",
                      )}
                    >
                      <Text as="span" variant="body-sm" weight="medium" className="min-w-0 max-w-full truncate">
                        {label}
                      </Text>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          isOpen
                            ? "bg-status-success-background text-status-success-text"
                            : "bg-status-error-background text-status-error-text",
                        )}
                      >
                        {isOpen ? openLabel : closedLabel}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <GuestBottomNav ariaLabel={t("landing.quickNavAria")}>
        <Button variant="ghost" size="sm" type="button" onClick={() => navigate(`/${tenantSlug}`)}>
          {t("landing.navHome")}
        </Button>
        <Button variant="ghost" size="sm" type="button" onClick={() => navigate(`/${tenantSlug}/menu`)}>
          {t("landing.navMenu")}
        </Button>
      </GuestBottomNav>

      <Modal
        isOpen={reservedModal !== null}
        onClose={() => setReservedModal(null)}
        title={t("tables.reservedModalTitle")}
        size="sm"
        hideCloseButton={false}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Text as="p" variant="body-md" weight="semibold" className="text-text-primary">
            {reservedModal?.label}
          </Text>
          <Text as="p" variant="body-sm" className="text-text-secondary">
            {t("tables.reservedModalBody")}
          </Text>
          <Text as="p" variant="h4" weight="bold" className="tabular-nums text-status-error-text">
            {t("tables.reservedCountdown", { time: formatTimeRemaining(secondsLeft) })}
          </Text>
        </div>
      </Modal>
    </div>
  );
};
