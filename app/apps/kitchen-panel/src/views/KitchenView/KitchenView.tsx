import { type Restaurant, OrderStatus, type OrderItem, type SelectedModifier } from "@restorio/types";
import {
  Box,
  Button,
  Icon,
  Modal,
  OrderCard,
  OrdersBoard,
  Select,
  Stack,
  StatusColumn,
  Text,
  useI18n,
  useMediaQuery,
  Loader,
} from "@restorio/ui";
import { logger } from "@restorio/utils";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { useParams } from "react-router-dom";

import { api } from "../../api/client";
import { statusConfig as statusConfigRaw } from "../../config/orderStatuses";
import {
  DragOverlay,
  DropPlaceholder,
  DropZoneBar,
  RejectionModal,
  VirtualizedOrderList,
  useColumnNavigation,
  useKitchenWebSocket,
  useOrdersDragAndDrop,
  useOrdersState,
  useViewMode,
  type DropZone,
  type UseOrdersStateReturn,
} from "../../features/orders";
import { useRestaurantSelection, useTenantRestaurants } from "../../features/restaurants";

const getRestaurantLabel = (restaurant: Restaurant): string => {
  return restaurant.address.city ? `${restaurant.name} - ${restaurant.address.city}` : restaurant.name;
};

type StatusKey = keyof typeof statusConfigRaw;
type StatusIconKey = (typeof statusConfigRaw)[StatusKey]["iconKey"] | "undo";

const iconPaths: Record<StatusIconKey, React.ReactNode> = {
  add: <path d="M12 5v14M5 12h14" />,
  clock: <path d="M12 6v6l4 2" />,
  check: <path d="M6 12l4 4 8-8" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  undo: <path d="M3 10h10a5 5 0 015 5v2M3 10l5-5M3 10l5 5" />,
};

const DEFAULT_REJECTION_LABELS = [
  "Brak składników",
  "Kuchnia zamknięta",
  "Zbyt duże obciążenie",
  "Pozycja niedostępna",
  "Inne",
];

const HISTORY_PAGE_SIZE = 20;
const HISTORY_WINDOW_OPTIONS = [
  { value: "24", labelKey: "kitchen.history.windows.last24h" },
  { value: "72", labelKey: "kitchen.history.windows.last72h" },
  { value: "168", labelKey: "kitchen.history.windows.last7d" },
  { value: "all", labelKey: "kitchen.history.windows.all" },
] as const;

const formatElapsedTime = (createdAt: Date | string, currentTime: number): string | null => {
  const createdAtValue = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();

  if (Number.isNaN(createdAtValue)) {
    return null;
  }

  const diffMins = Math.max(0, Math.floor((currentTime - createdAtValue) / 60000));
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }

  return `${mins}m`;
};

export const KitchenView = (): ReactElement => {
  const params = useParams();
  const tenantId = params.tenantId ?? "";
  const { t } = useI18n();

  const { restaurants, defaultRestaurantId } = useTenantRestaurants(tenantId);
  const { selectedRestaurantId, setSelectedRestaurantId } = useRestaurantSelection(
    tenantId,
    restaurants,
    defaultRestaurantId,
  );

  const ordersState: UseOrdersStateReturn = useOrdersState(selectedRestaurantId);
  const { orders, moveOrder, approveOrder, rejectOrder, markReadyToServe, refundOrder, isLoading } = ordersState;
  const { viewMode, toggleViewMode } = useViewMode(tenantId);

  const { status: wsStatus } = useKitchenWebSocket(selectedRestaurantId);

  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyWindow, setHistoryWindow] = useState<(typeof HISTORY_WINDOW_OPTIONS)[number]["value"]>("24");

  const { data: kitchenConfigData } = useQuery({
    queryKey: ["kitchen-config", selectedRestaurantId],
    queryFn: async () => {
      if (!selectedRestaurantId) {
        return null;
      }
      const response = await api.orders.getKitchenConfig(selectedRestaurantId);

      return response.data;
    },
    enabled: Boolean(selectedRestaurantId),
  });

  const historySinceHours = historyWindow === "all" ? null : Number(historyWindow);
  const {
    data: archivedOrdersPage,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
  } = useQuery({
    queryKey: ["archived-orders", selectedRestaurantId, historyPage, historyWindow],
    queryFn: async () => {
      if (!selectedRestaurantId) {
        return null;
      }

      return api.orders.listArchivedPage(selectedRestaurantId, {
        page: historyPage,
        pageSize: HISTORY_PAGE_SIZE,
        sinceHours: historySinceHours,
      });
    },
    enabled: isHistoryOpen && Boolean(selectedRestaurantId),
  });

  const rejectionLabels = kitchenConfigData?.rejectionLabels ?? DEFAULT_REJECTION_LABELS;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const isTablet = useMediaQuery("(min-width: 768px)");
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const useHorizontalLayout = (isTablet && isLandscape && viewMode === "sliding") || viewMode === "sliding";

  const statusConfig = useMemo(() => statusConfigRaw, []);
  const statusKeys = useMemo(() => Object.keys(statusConfig) as (keyof typeof statusConfig)[], [statusConfig]);

  const boardRef = useColumnNavigation(statusKeys, useHorizontalLayout);

  const handleOpenRejection = useCallback((orderId: string): void => {
    setRejectingOrderId(orderId);
    setRejectionModalOpen(true);
  }, []);

  const handleOrderMove = useCallback(
    (orderId: string, targetStatus: OrderStatus): void => {
      if (targetStatus === OrderStatus.REJECTED) {
        handleOpenRejection(orderId);

        return;
      }
      moveOrder(orderId, targetStatus);
    },
    [handleOpenRejection, moveOrder],
  );

  const { dragState, getDragHandleProps, draggedOrder } = useOrdersDragAndDrop(orders, handleOrderMove);

  const handleDropZoneClick = useCallback(
    (zoneId: string): void => {
      if (dragState.draggedItemId) {
        handleOrderMove(dragState.draggedItemId, zoneId as OrderStatus);
      }
    },
    [dragState.draggedItemId, handleOrderMove],
  );

  const handleConfirmRejection = useCallback(
    (orderId: string, reason: string): void => {
      rejectOrder(orderId, reason);
    },
    [rejectOrder],
  );

  const handleOpenHistory = useCallback((): void => {
    setHistoryPage(1);
    setIsHistoryOpen(true);
  }, []);

  const handleHistoryWindowChange = useCallback((value: string): void => {
    setHistoryWindow(value as (typeof HISTORY_WINDOW_OPTIONS)[number]["value"]);
    setHistoryPage(1);
  }, []);

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null,
    [restaurants, selectedRestaurantId],
  );

  const restaurantOptions = useMemo(
    () => restaurants.map((restaurant) => ({ value: restaurant.id, label: getRestaurantLabel(restaurant) })),
    [restaurants],
  );

  const showRestaurantSelect = restaurants.length > 1;
  const headerDescription = selectedRestaurant
    ? t("kitchen.activeRestaurant", { name: selectedRestaurant.name })
    : t("kitchen.selectRestaurant");

  const dropZones: DropZone[] = useMemo(
    () =>
      statusKeys.map((key) => ({
        id: key,
        label: t(statusConfig[key].labelKey),
        iconPath: iconPaths[statusConfig[key].iconKey],
        className: statusConfig[key].indicatorClassName,
      })),
    [statusKeys, statusConfig, t],
  );

  const wsIndicator =
    wsStatus === "connected"
      ? "bg-status-success-background"
      : wsStatus === "reconnecting"
        ? "bg-status-warning-background"
        : "bg-status-error-background";
  const draggedOrderElapsedTime = draggedOrder ? formatElapsedTime(draggedOrder.createdAt, currentTime) : null;
  const archivedOrders = archivedOrdersPage?.items ?? [];
  const totalHistoryPages = archivedOrdersPage?.total_pages ?? 0;
  const historyTotal = archivedOrdersPage?.total ?? 0;

  logger.debug(`wsStatus: ${wsStatus}\nwsIndicator: ${wsIndicator}`); // const wsIcon = wsStatus === "connected" ? "check" : wsStatus === "reconnecting" ? "clock" : "x";

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-6 py-4 border-b border-border-default bg-surface-primary">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Text as="h1" variant="h3" weight="semibold">
                {t("kitchen.title")}
              </Text>
            </div>
            <Text as="p" variant="body-sm" className="text-text-secondary">
              {headerDescription}
            </Text>
          </div>
          <nav aria-label={t("aria.kitchenControls")}>
            <Stack direction="row" spacing="md" align="center">
              <Button variant="secondary" size="md" onClick={handleOpenHistory} className="flex items-center gap-2">
                <Icon size="md" viewBox="0 0 24 24">
                  <path d="M12 8v5l3 2M12 3a9 9 0 1 0 9 9" />
                </Icon>
                <Text as="span" variant="body-sm" weight="medium">
                  {t("kitchen.history.open")}
                </Text>
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={toggleViewMode}
                className="flex items-center gap-2"
                aria-label={t("aria.switchViewMode", {
                  mode: viewMode === "sliding" ? t("kitchen.viewMode.all") : t("kitchen.viewMode.sliding"),
                })}
              >
                <Icon size="md" viewBox="0 0 24 24">
                  {viewMode === "sliding" ? (
                    <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
                  ) : (
                    <path d="M3 3h18v5H3V3zm0 7h18v5H3v-5zm0 7h18v5H3v-5z" />
                  )}
                </Icon>
                <Text as="span" variant="body-sm" weight="medium">
                  {viewMode === "sliding" ? t("kitchen.viewMode.all") : t("kitchen.viewMode.sliding")}
                </Text>
              </Button>
              {showRestaurantSelect && (
                <div className="min-w-56">
                  <Select
                    label={t("kitchen.restaurant")}
                    value={selectedRestaurantId ?? ""}
                    onChange={(event) => setSelectedRestaurantId(event.target.value)}
                    options={restaurantOptions}
                  />
                </div>
              )}
            </Stack>
          </nav>
        </div>
      </div>

      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader />
          <Text as="p" variant="body-md" className="text-text-secondary">
            {t("common.loading")}
          </Text>
        </div>
      )}

      {!isLoading && (
        <div className="flex-1 overflow-hidden relative h-full">
          <OrdersBoard
            ref={boardRef}
            ariaLabel={t("aria.ordersBoard")}
            orientation={useHorizontalLayout ? "horizontal" : "vertical"}
            enableSnapScroll={useHorizontalLayout}
            columnsClassName={useHorizontalLayout ? undefined : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}
          >
            {statusKeys.map((statusKey) => {
              const config = statusConfig[statusKey];
              const ordersForStatus = orders.filter((order) => order.status === statusKey);
              const isActiveDropZone = dragState.isDragging && dragState.activeDropZoneId === statusKey;
              const isSourceColumn = draggedOrder?.status === statusKey;
              const shouldShowPlaceholder = isActiveDropZone && !isSourceColumn;
              const shouldDefaultExpand = statusKey === OrderStatus.PREPARING;

              return (
                <StatusColumn
                  key={statusKey}
                  label={t(config.labelKey)}
                  ariaLabel={t(config.ariaLabelKey)}
                  zoneId={statusKey}
                  enableSnapScroll={useHorizontalLayout}
                  minWidth={useHorizontalLayout ? "380px" : undefined}
                  isActive={isActiveDropZone}
                  statusIndicator={
                    <Box
                      className={`flex h-8 w-8 items-center justify-center rounded-full border ${config.indicatorClassName}`}
                      aria-hidden="true"
                    >
                      <Icon size="md" className={config.iconClassName} viewBox="0 0 24 24">
                        {iconPaths[config.iconKey]}
                      </Icon>
                    </Box>
                  }
                  ordersClassName="!overflow-visible !p-0 !gap-0"
                >
                  <VirtualizedOrderList
                    count={ordersForStatus.length}
                    estimateSize={120}
                    renderItem={(index) => {
                      const order = ordersForStatus[index];
                      const elapsedTime = formatElapsedTime(order.createdAt, currentTime) ?? order.time;
                      const isDragging = dragState.isDragging && dragState.draggedItemId === order.id;
                      const canMoveUp = index > 0;
                      const canMoveDown = index < ordersForStatus.length - 1;
                      const isNewOrder = order.status === OrderStatus.NEW;
                      const isPreparingOrder = order.status === OrderStatus.PREPARING;
                      const isRejected = order.status === OrderStatus.REJECTED;
                      const isSlidingView = viewMode === "sliding";
                      const actionButtons = (
                        <>
                          {isNewOrder && (
                            <>
                              <Button size="sm" variant="primary" onClick={() => approveOrder(order.id)}>
                                {t("orders.actions.approve")}
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => handleOpenRejection(order.id)}>
                                {t("orders.actions.reject")}
                              </Button>
                            </>
                          )}
                          {isPreparingOrder && (
                            <Button size="sm" variant="primary" onClick={() => markReadyToServe(order.id)}>
                              {t("orders.actions.markReadyToServe")}
                            </Button>
                          )}
                          {isRejected && (
                            <Button size="sm" variant="secondary" onClick={() => refundOrder(order.id)}>
                              {t("orders.actions.refund")}
                            </Button>
                          )}
                        </>
                      );

                      return (
                        <OrderCard
                          key={order.id}
                          id={order.id}
                          toggleLabel={t("aria.toggleOrderDetails", { id: order.id })}
                          dragHandleLabel={t("aria.dragOrder", { id: order.id })}
                          isDragging={isDragging}
                          dragHandleProps={getDragHandleProps(order.id)}
                          showReorderButtons
                          canMoveUp={canMoveUp}
                          canMoveDown={canMoveDown}
                          defaultExpanded={shouldDefaultExpand}
                          onMoveUp={() => {
                            (ordersState.moveOrderUp as (id: string) => void)(order.id);
                          }}
                          onMoveDown={() => {
                            (ordersState.moveOrderDown as (id: string) => void)(order.id);
                          }}
                          moveUpLabel={t("aria.moveOrderUp", { id: order.id })}
                          moveDownLabel={t("aria.moveOrderDown", { id: order.id })}
                          headerTrailing={
                            isSlidingView ? (
                              <Text as="span" variant="body-md" weight="semibold" className="text-text-secondary">
                                {elapsedTime}
                              </Text>
                            ) : undefined
                          }
                          summary={
                            <Stack spacing="xs" className="w-full min-w-0 items-start text-left">
                              <Text
                                as="p"
                                variant="body-lg"
                                weight="semibold"
                                className="max-w-full self-stretch truncate"
                              >
                                {order.id}
                              </Text>
                              <Text
                                as="p"
                                variant="body-sm"
                                className="max-w-full self-stretch truncate text-text-secondary"
                              >
                                {order.table} · {order.items.length} {t("common.items")}
                              </Text>
                              {!isSlidingView && (
                                <Text as="span" variant="body-md" weight="semibold" className="text-text-secondary">
                                  {elapsedTime}
                                </Text>
                              )}
                            </Stack>
                          }
                          details={
                            <Stack spacing="sm">
                              <Text as="h3" variant="body-sm" weight="semibold">
                                {t("kitchen.items")}
                              </Text>
                              <Box as="ul" className="list-disc pl-4 text-text-secondary">
                                {order.items.map((item: OrderItem) => (
                                  <Text as="li" variant="body-md" key={item.id} className="text-text-secondary">
                                    {item.quantity}x {item.name}
                                    {item.selectedModifiers.map((modifier: SelectedModifier) => (
                                      <Text
                                        as="span"
                                        variant="body-md"
                                        key={modifier.modifierId}
                                        className="text-text-secondary ml-1"
                                      >
                                        (+{modifier.name})
                                      </Text>
                                    ))}
                                  </Text>
                                ))}
                              </Box>
                              {(order.notes ?? isSlidingView) && (
                                <Stack
                                  direction={isSlidingView ? "row" : "column"}
                                  align={isSlidingView ? "end" : "start"}
                                  justify={isSlidingView ? "between" : "start"}
                                  spacing="sm"
                                  className="w-full"
                                >
                                  {order.notes ? (
                                    <Box className="flex min-w-0 flex-1 flex-col items-start gap-2">
                                      <Text as="p" variant="body-sm" weight="medium">
                                        {t("kitchen.notes")}
                                      </Text>
                                      <Text as="p" variant="body-sm" className="ml-2 text-text-secondary">
                                        {order.notes}
                                      </Text>
                                    </Box>
                                  ) : (
                                    <div className="min-w-0 flex-1" />
                                  )}
                                  {isSlidingView && (
                                    <Stack direction="row" spacing="sm">
                                      {actionButtons}
                                    </Stack>
                                  )}
                                </Stack>
                              )}
                              {order.invoiceData ? (
                                <Box className="flex min-w-0 flex-col items-start gap-2 rounded-md border border-border-default bg-surface-secondary px-3 py-2">
                                  <Text as="p" variant="body-sm" weight="medium">
                                    {t("kitchen.invoice.title")}
                                  </Text>
                                  <Text as="p" variant="body-sm" className="ml-2 text-text-secondary">
                                    {t("kitchen.invoice.company")}: {order.invoiceData.companyName}
                                  </Text>
                                  <Text as="p" variant="body-sm" className="ml-2 text-text-secondary">
                                    {t("kitchen.invoice.nip")}: {order.invoiceData.nip}
                                  </Text>
                                  <Text as="p" variant="body-sm" className="ml-2 text-text-secondary">
                                    {t("kitchen.invoice.address")}: {order.invoiceData.street},{" "}
                                    {order.invoiceData.postalCode} {order.invoiceData.city}
                                  </Text>
                                </Box>
                              ) : null}
                              {isRejected && order.rejectionReason && (
                                <Box className="rounded-md border border-status-error-border bg-status-error-background px-3 py-2">
                                  <Text as="p" variant="body-sm" className="text-status-error-text">
                                    {order.rejectionReason}
                                  </Text>
                                </Box>
                              )}
                              {!isSlidingView && (
                                <Stack direction="row" spacing="sm" className="pt-2">
                                  {actionButtons}
                                </Stack>
                              )}
                            </Stack>
                          }
                        />
                      );
                    }}
                    footer={
                      shouldShowPlaceholder && draggedOrder ? (
                        <DropPlaceholder
                          orderId={draggedOrder.id}
                          table={draggedOrder.table}
                          itemCount={draggedOrder.items.length}
                          time={draggedOrderElapsedTime ?? draggedOrder.time}
                        />
                      ) : undefined
                    }
                  />
                </StatusColumn>
              );
            })}
          </OrdersBoard>

          <DragOverlay isVisible={dragState.isDragging} position={dragState.currentPosition}>
            {draggedOrder && (
              <Box className="w-96 rounded-md border-2 border-border-focus bg-surface-primary shadow-2xl">
                <Stack direction="row" align="center" spacing="sm" className="px-5 py-4">
                  <Stack spacing="xs" className="min-w-0 flex-1">
                    <Text as="p" variant="body-lg" weight="semibold" className="truncate">
                      {draggedOrder.id}
                    </Text>
                    <Text as="p" variant="body-sm" className="text-text-secondary">
                      {draggedOrder.table} · {draggedOrder.items.length} {t("common.items")}
                    </Text>
                  </Stack>
                  <Text as="span" variant="body-sm" weight="medium" className="text-text-secondary">
                    {draggedOrderElapsedTime ?? draggedOrder.time}
                  </Text>
                </Stack>
              </Box>
            )}
          </DragOverlay>

          <DropZoneBar
            isVisible={dragState.isDragging}
            zones={dropZones}
            activeZoneId={dragState.activeDropZoneId}
            onZoneClick={handleDropZoneClick}
          />
        </div>
      )}

      <RejectionModal
        isOpen={rejectionModalOpen}
        orderId={rejectingOrderId ?? ""}
        labels={rejectionLabels}
        onConfirm={handleConfirmRejection}
        onClose={() => setRejectionModalOpen(false)}
      />
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={t("kitchen.history.title")}
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <Text as="p" variant="body-sm" className="text-text-secondary">
              {t("kitchen.history.description")}
            </Text>
            <div className="min-w-48">
              <Select
                label={t("kitchen.history.windowLabel")}
                value={historyWindow}
                onChange={(event) => handleHistoryWindowChange(event.target.value)}
                options={HISTORY_WINDOW_OPTIONS.map((option) => ({
                  value: option.value,
                  label: t(option.labelKey),
                }))}
              />
            </div>
          </div>

          {(isHistoryLoading || isHistoryFetching) && archivedOrders.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <Loader />
            </div>
          ) : archivedOrders.length === 0 ? (
            <Text as="p" variant="body-sm" className="text-text-secondary">
              {t("kitchen.history.empty")}
            </Text>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {archivedOrders.map((order) => (
                <div key={order.id} className="rounded-xl border border-border-default bg-surface-secondary p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Text as="h3" variant="body-md" weight="semibold" className="truncate">
                        {order.tableLabel || t("kitchen.history.unknownTable")}
                      </Text>
                      <Text as="p" variant="body-sm" className="text-text-secondary">
                        {t("kitchen.history.archivedAt", {
                          value: new Intl.DateTimeFormat("pl-PL", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(order.archivedAt)),
                        })}
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text as="p" variant="body-sm" weight="semibold">
                        {String(order.total)} {order.currency}
                      </Text>
                      <Text as="p" variant="caption" className="text-text-secondary">
                        {t(`orders.status.${order.status}` as const, { defaultValue: order.status })}
                      </Text>
                    </div>
                  </div>
                  {order.notes && (
                    <Text as="p" variant="body-sm" className="mt-2 text-text-secondary">
                      {order.notes}
                    </Text>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border-default pt-3">
            <Text as="p" variant="body-sm" className="text-text-secondary">
              {t("kitchen.history.paginationSummary", {
                total: historyTotal,
                page: archivedOrdersPage?.page ?? historyPage,
                pages: totalHistoryPages || 1,
              })}
            </Text>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                disabled={historyPage <= 1 || isHistoryFetching}
              >
                {t("kitchen.history.previous")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setHistoryPage((page) => page + 1)}
                disabled={isHistoryFetching || totalHistoryPages === 0 || historyPage >= totalHistoryPages}
              >
                {t("kitchen.history.next")}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
