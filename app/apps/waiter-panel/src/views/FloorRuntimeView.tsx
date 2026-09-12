import { getOrderStatusUpdateErrorToastTitle, type OrderStatusErrorTranslateFn } from "@restorio/api-client";
import {
  OrderStatus,
  type FloorCanvas as FloorCanvasType,
  type InvoiceData,
  type OrderStatusDisplay,
  type TableDisplayInfo,
  type TableSession,
  type TableRuntimeState,
  type Tenant,
  type TenantMenu,
} from "@restorio/types";
import { Button, Checkbox, FloorCanvas, Input, Modal, useI18n, useMediaQuery, useToast, cn } from "@restorio/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IoIosCloseCircleOutline } from "react-icons/io";

import { api, ordersApi } from "@/api/client";
import { WaiterMenuDock } from "@/components/WaiterMenuDock";

interface KitchenOrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  selectedModifiers: never[];
  totalPrice: number;
}

interface KitchenOrder {
  id: string;
  restaurantId: string;
  tableId?: string;
  table: string;
  status: string;
  items: KitchenOrderItem[];
  notes?: string;
  rejectionReason?: string;
  invoiceData?: InvoiceData;
  createdAt: string;
  updatedAt: string;
}

interface FloorRuntimeViewProps {
  venue: Tenant;
  selectedFloorId?: string | null;
  tableStates?: Record<string, TableRuntimeState>;
  tableDisplayInfo?: Record<string, TableDisplayInfo>;
}

interface RuntimeMenuItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  price: number;
  category?: string;
}

interface OrderedRuntimeItem extends RuntimeMenuItem {
  quantity: number;
}

const tenantMenuToRuntimeItems = (menu: TenantMenu | null): RuntimeMenuItem[] => {
  if (!menu) {
    return [];
  }

  const parsed: RuntimeMenuItem[] = [];

  for (const category of menu.categories) {
    const categoryOrder = category.order;

    for (const item of category.items) {
      if (item.name.trim() === "" || !Number.isFinite(item.price) || !item.isAvailable) {
        continue;
      }

      parsed.push({
        id: `${categoryOrder}-${item.name}`,
        name: item.name,
        description: item.desc,
        tags: item.tags,
        price: item.price,
        category: category.name,
      });
    }
  }

  return parsed;
};

const isOccupiedOrderStatus = (status: string): boolean => {
  return status !== "paid" && status !== "cancelled";
};

const mapRemoteStatusToDisplayStatus = (status: string): OrderStatusDisplay => {
  switch (status) {
    case "new":
    case "pending":
      return "ordering";
    case "confirmed":
    case "placed":
      return "ordered";
    case "preparing":
      return "preparing";
    case "ready_to_serve":
      return "ready_to_serve";
    case "delivered":
    case "ready":
      return "served";
    case "rejected":
      return "rejected";
    default:
      return "browsing";
  }
};

const formatOccupationTime = (createdAt: string): string => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }

  return `${mins}m`;
};

const WAITER_NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

const validateWaiterNipFormat = (nip: string): boolean => {
  const digitsOnly = nip.replace(/[\s-]/g, "");

  if (!/^\d{10}$/.test(digitsOnly)) {
    return false;
  }

  const digits = digitsOnly.split("").map(Number);
  let checksum = 0;

  for (let i = 0; i < 9; i++) {
    checksum += digits[i] * WAITER_NIP_WEIGHTS[i];
  }

  checksum %= 11;

  if (checksum === 10) {
    checksum = 0;
  }

  return digits[9] === checksum;
};

const validateWaiterPostalFormat = (code: string): boolean => /^\d{2}-?\d{3}$/.test(code.trim());

export const FloorRuntimeView = ({
  venue,
  selectedFloorId,
  tableStates: initialTableStates = {},
  tableDisplayInfo: initialTableDisplayInfo = {},
}: FloorRuntimeViewProps): ReactElement => {
  const { t } = useI18n();
  const translate: OrderStatusErrorTranslateFn = useCallback(
    (key, defaultMessageOrValues, values) => {
      return t(key, defaultMessageOrValues, values);
    },
    [t],
  );
  const { showToast } = useToast();
  const showErrorToast: (title: string) => void = useCallback(
    (title: string): void => {
      showToast("error", title);
    },
    [showToast],
  );
  const queryClient = useQueryClient();
  const isTabletUp = useMediaQuery("(min-width: 768px)");
  const isDesktopUp = useMediaQuery("(min-width: 1280px)");
  const [tableStates] = useState<Record<string, TableRuntimeState>>(initialTableStates);
  const [tableDisplayInfo, setTableDisplayInfo] = useState<Record<string, TableDisplayInfo>>(() => ({
    ...initialTableDisplayInfo,
  }));
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);
  const [panelReady, setPanelReady] = useState(false);
  const [isMenuDockOpen, setIsMenuDockOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [occupationTick, setOccupationTick] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setOccupationTick((n) => n + 1);
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (selectedElementId) {
      setPanelReady(false);
      const timer = setTimeout(() => setPanelReady(true), 150);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [selectedElementId]);

  const [tableOrderItems, setTableOrderItems] = useState<Record<string, OrderedRuntimeItem[]>>({});
  const [tableOrderNotes, setTableOrderNotes] = useState<Record<string, string>>({});
  const [tableOrderIds, setTableOrderIds] = useState<Record<string, string>>({});

  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [invoiceCompanyName, setInvoiceCompanyName] = useState("");
  const [invoiceNip, setInvoiceNip] = useState("");
  const [invoiceStreet, setInvoiceStreet] = useState("");
  const [invoiceCity, setInvoiceCity] = useState("");
  const [invoicePostalCode, setInvoicePostalCode] = useState("");
  const [invoiceNipError, setInvoiceNipError] = useState("");
  const [invoicePostalCodeError, setInvoicePostalCodeError] = useState("");

  const resetInvoiceForm = useCallback(() => {
    setWantsInvoice(false);
    setInvoiceCompanyName("");
    setInvoiceNip("");
    setInvoiceStreet("");
    setInvoiceCity("");
    setInvoicePostalCode("");
    setInvoiceNipError("");
    setInvoicePostalCodeError("");
  }, []);

  const validateWaiterInvoiceFields = useCallback((): boolean => {
    setInvoiceNipError("");
    setInvoicePostalCodeError("");

    if (!invoiceCompanyName.trim()) {
      showErrorToast(t("waiterDashboard.invoice.companyNameRequired"));

      return false;
    }

    if (!invoiceNip.trim()) {
      showErrorToast(t("waiterDashboard.invoice.nipRequired"));

      return false;
    }

    if (!validateWaiterNipFormat(invoiceNip)) {
      setInvoiceNipError(t("waiterDashboard.invoice.nipInvalid"));

      return false;
    }

    if (!invoiceStreet.trim()) {
      showErrorToast(t("waiterDashboard.invoice.streetRequired"));

      return false;
    }

    if (!invoiceCity.trim()) {
      showErrorToast(t("waiterDashboard.invoice.cityRequired"));

      return false;
    }

    if (!invoicePostalCode.trim()) {
      showErrorToast(t("waiterDashboard.invoice.postalCodeRequired"));

      return false;
    }

    if (!validateWaiterPostalFormat(invoicePostalCode)) {
      setInvoicePostalCodeError(t("waiterDashboard.invoice.postalCodeInvalid"));

      return false;
    }

    return true;
  }, [
    invoiceCity,
    invoiceCompanyName,
    invoiceNip,
    invoicePostalCode,
    invoiceStreet,
    showErrorToast,
    t,
  ]);

  const hasCanvases = venue.floorCanvases.length > 0;

  const activeCanvas = hasCanvases
    ? (venue.floorCanvases.find((c: FloorCanvasType) => c.id === selectedFloorId) ??
      venue.floorCanvases.find((c: FloorCanvasType) => c.id === venue.activeLayoutVersionId) ??
      venue.floorCanvases[0])
    : undefined;
  const runtimeScale = isDesktopUp ? 1.2 : isTabletUp ? 1.12 : 1;
  const runtimeCanvas = useMemo(() => {
    if (!activeCanvas) {
      return undefined;
    }

    return {
      ...activeCanvas,
      width: Math.round(activeCanvas.width * runtimeScale),
      height: Math.round(activeCanvas.height * runtimeScale),
      elements: activeCanvas.elements.map((element) => {
        const scaledElement = {
          ...element,
          x: Math.round(element.x * runtimeScale),
          y: Math.round(element.y * runtimeScale),
          w: Math.round(element.w * runtimeScale),
          h: Math.round(element.h * runtimeScale),
        };

        if (element.type !== "table") {
          return scaledElement;
        }

        return {
          ...scaledElement,
          label: t("floorEditor.tableLabel", { number: element.tableNumber }),
        };
      }),
    };
  }, [activeCanvas, runtimeScale, t]);

  const { data: menuItems = [] } = useQuery({
    queryKey: ["waiter-panel", "menu-items", venue.id],
    queryFn: async (): Promise<RuntimeMenuItem[]> => {
      try {
        const menu = await api.menus.get(venue.id);

        return tenantMenuToRuntimeItems(menu);
      } catch {
        return [];
      }
    },
  });

  const { data: remoteOrders = [] } = useQuery({
    queryKey: ["waiter-panel", "kitchen-orders", venue.id],
    queryFn: async (): Promise<KitchenOrder[]> => {
      try {
        const response = await ordersApi.list(venue.id);
        const orders = "data" in response ? response.data : [];

        return orders.map(
          (order): KitchenOrder => ({
            id: order.id,
            restaurantId: order.restaurantId,
            tableId: order.tableId,
            table: order.table,
            status: order.status,
            items: order.items.map((item) => ({
              id: item.id,
              menuItemId: item.menuItemId,
              name: item.name,
              quantity: item.quantity,
              basePrice: item.basePrice,
              selectedModifiers: [],
              totalPrice: item.totalPrice,
            })),
            notes: order.notes,
            rejectionReason: order.rejectionReason,
            invoiceData: order.invoiceData,
            createdAt: String(order.createdAt),
            updatedAt: String(order.updatedAt),
          }),
        );
      } catch {
        return [];
      }
    },
    refetchInterval: 5000,
  });

  const { data: tableSessions = [] } = useQuery({
    queryKey: ["waiter-panel", "table-sessions", venue.id],
    queryFn: ({ signal }): Promise<TableSession[]> => ordersApi.listTableSessions(venue.id, signal),
    refetchInterval: 5000,
  });

  const remoteOrderIdsByTable = useMemo<Record<string, string>>(() => {
    return remoteOrders.reduce<Record<string, string>>((acc, order) => {
      if (!isOccupiedOrderStatus(order.status) || !order.tableId) {
        return acc;
      }

      acc[order.tableId] = order.id;

      return acc;
    }, {});
  }, [remoteOrders]);

  const remoteTableDisplayInfo = useMemo<Record<string, TableDisplayInfo>>(() => {
    void occupationTick;

    return remoteOrders.reduce<Record<string, TableDisplayInfo>>((acc, order) => {
      if (!isOccupiedOrderStatus(order.status) || !order.tableId) {
        return acc;
      }

      const orderStatus = mapRemoteStatusToDisplayStatus(order.status);

      acc[order.tableId] = {
        orderStatus,
        orderStatusLabel: t(`waiterDashboard.orderStatus.${orderStatus}`),
        occupationTimeLabel: formatOccupationTime(order.createdAt),
      };

      return acc;
    }, {});
  }, [remoteOrders, t, occupationTick]);

  const activeTableSessionsByTable = useMemo<Record<string, TableSession>>(() => {
    return tableSessions.reduce<Record<string, TableSession>>((acc, session) => {
      if (session.status !== "active") {
        return acc;
      }

      acc[session.tableRef] = session;

      return acc;
    }, {});
  }, [tableSessions]);

  const sessionTableDisplayInfo = useMemo<Record<string, TableDisplayInfo>>(() => {
    void occupationTick;

    return Object.entries(activeTableSessionsByTable).reduce<Record<string, TableDisplayInfo>>(
      (acc, [tableRef, session]) => {
        if (Object.prototype.hasOwnProperty.call(remoteTableDisplayInfo, tableRef)) {
          return acc;
        }

        const orderStatus: OrderStatusDisplay = session.origin === "mobile" ? "ordering" : "ordered";

        acc[tableRef] = {
          orderStatus,
          orderStatusLabel:
            session.origin === "mobile"
              ? t("waiterDashboard.mobileLockStatus")
              : t(`waiterDashboard.orderStatus.${orderStatus}`),
          occupationTimeLabel: formatOccupationTime(session.acquiredAt),
        };

        return acc;
      },
      {},
    );
  }, [activeTableSessionsByTable, occupationTick, remoteTableDisplayInfo, t]);

  const remoteOrderCreatedAtByTable = useMemo<Record<string, string>>(() => {
    return remoteOrders.reduce<Record<string, string>>((acc, order) => {
      if (!isOccupiedOrderStatus(order.status) || !order.tableId) {
        return acc;
      }

      acc[order.tableId] = order.createdAt;

      return acc;
    }, {});
  }, [remoteOrders]);

  const remoteOrderNotesByTable = useMemo<Record<string, string>>(() => {
    return remoteOrders.reduce<Record<string, string>>((acc, order) => {
      if (!isOccupiedOrderStatus(order.status) || !order.tableId) {
        return acc;
      }

      acc[order.tableId] = order.notes ?? "";

      return acc;
    }, {});
  }, [remoteOrders]);

  const effectiveTableDisplayInfo = useMemo<Record<string, TableDisplayInfo>>(
    () => ({
      ...tableDisplayInfo,
      ...sessionTableDisplayInfo,
      ...remoteTableDisplayInfo,
    }),
    [remoteTableDisplayInfo, sessionTableDisplayInfo, tableDisplayInfo],
  );

  const selectedTableElement = useMemo(() => {
    if (!runtimeCanvas || !selectedElementId) {
      return undefined;
    }

    const element = runtimeCanvas.elements.find((candidate) => candidate.id === selectedElementId);

    if (!element) {
      return undefined;
    }

    if (element.type !== "table" && element.type !== "tableGroup") {
      return undefined;
    }

    return element;
  }, [runtimeCanvas, selectedElementId]);

  const selectedTableDisplayInfo = selectedTableElement
    ? effectiveTableDisplayInfo[selectedTableElement.id]
    : undefined;
  const selectedTableHasOrder =
    selectedTableDisplayInfo?.orderStatus !== undefined && selectedTableDisplayInfo.orderStatus !== "browsing";
  const isSelectedTableAvailable = Boolean(selectedTableElement) && !selectedTableHasOrder;
  const selectedTableOrderItems = useMemo(
    () => (selectedTableElement ? (tableOrderItems[selectedTableElement.id] ?? []) : []),
    [selectedTableElement, tableOrderItems],
  );
  const selectedTableOrderNote = useMemo(() => {
    if (!selectedTableElement) {
      return "";
    }

    if (Object.prototype.hasOwnProperty.call(tableOrderNotes, selectedTableElement.id)) {
      return tableOrderNotes[selectedTableElement.id];
    }

    return remoteOrderNotesByTable[selectedTableElement.id] ?? "";
  }, [selectedTableElement, tableOrderNotes, remoteOrderNotesByTable]);

  const selectedTableOccupationTime = useMemo(() => {
    void occupationTick;

    if (!selectedTableElement) {
      return null;
    }

    const createdAt = remoteOrderCreatedAtByTable[selectedTableElement.id];

    if (!createdAt) {
      return null;
    }

    return formatOccupationTime(createdAt);
  }, [selectedTableElement, remoteOrderCreatedAtByTable, occupationTick]);
  const selectedTableOrderId = useMemo(
    () =>
      selectedTableElement
        ? (tableOrderIds[selectedTableElement.id] ?? remoteOrderIdsByTable[selectedTableElement.id])
        : undefined,
    [remoteOrderIdsByTable, selectedTableElement, tableOrderIds],
  );

  const selectedTableOrderStatus = useMemo(() => {
    if (!selectedTableElement) {
      return undefined;
    }

    const order = remoteOrders.find((o) => o.tableId === selectedTableElement.id);

    return order?.status;
  }, [remoteOrders, selectedTableElement]);

  const selectedTableRejectionReason = useMemo(() => {
    if (!selectedTableElement) {
      return undefined;
    }

    const order = remoteOrders.find((o) => o.tableId === selectedTableElement.id);

    return order?.rejectionReason;
  }, [remoteOrders, selectedTableElement]);

  const selectedTableInvoiceData = useMemo((): InvoiceData | undefined => {
    if (!selectedTableElement) {
      return undefined;
    }

    const order = remoteOrders.find((o) => o.tableId === selectedTableElement.id);

    return order?.invoiceData;
  }, [remoteOrders, selectedTableElement]);

  const isSelectedTableRejected = selectedTableOrderStatus === "rejected";

  const selectedTableSession = useMemo(() => {
    if (!selectedTableElement) {
      return undefined;
    }

    return activeTableSessionsByTable[selectedTableElement.id];
  }, [activeTableSessionsByTable, selectedTableElement]);
  const selectedTableLockedByMobile = selectedTableSession?.origin === "mobile" && !selectedTableOrderId;

  const selectedTableName = useMemo(() => {
    if (!selectedTableElement) {
      return "";
    }

    if (selectedTableElement.type === "table") {
      return t("floorEditor.tableLabel", { number: selectedTableElement.tableNumber });
    }

    return t("waiterDashboard.tableGroupLabel", { numbers: selectedTableElement.tableNumbers.join(", ") });
  }, [selectedTableElement, t]);

  const selectedTableSeats = selectedTableElement?.seats;

  const handleElementPointerDown = useCallback(
    (id: string, e: React.PointerEvent): void => {
      if (!runtimeCanvas) {
        setSelectedElementId(null);

        return;
      }

      const element = runtimeCanvas.elements.find((candidate) => candidate.id === id);

      if (!element || (element.type !== "table" && element.type !== "tableGroup")) {
        setSelectedElementId(null);

        return;
      }

      setSelectedElementId((prev) => {
        if (prev === id) {
          return null;
        }

        setClickCoords({ x: e.clientX, y: e.clientY });

        return id;
      });
    },
    [runtimeCanvas],
  );

  const handleClosePanel = useCallback((): void => {
    setSelectedElementId(null);
    setIsMenuDockOpen(false);
  }, []);

  const toKitchenOrderItems = useCallback((items: OrderedRuntimeItem[]): KitchenOrderItem[] => {
    return items.map((item) => ({
      id: item.id,
      menuItemId: item.id,
      name: item.name,
      quantity: item.quantity,
      basePrice: item.price,
      selectedModifiers: [],
      totalPrice: item.price * item.quantity,
    }));
  }, []);

  const createRemoteOrder = useCallback(
    async (tableElementId: string, tableLabel: string): Promise<{ id: string } | null> => {
      try {
        const response = await ordersApi.create(venue.id, {
          tableId: tableElementId,
          table: tableLabel,
          items: [],
          sessionId: "",
          subtotal: 0,
          tax: 0,
          total: 0,
        });

        const orderData = "data" in response && response.data !== null ? response.data : response;
        const orderId = typeof orderData === "object" && "id" in orderData ? String(orderData.id) : "";

        if (!orderId) {
          return null;
        }

        return { id: orderId };
      } catch {
        return null;
      }
    },
    [venue.id],
  );

  const syncRemoteOrder = useCallback(
    async (
      orderId: string,
      items?: OrderedRuntimeItem[],
      status?: "pending" | "paid" | "new",
      notes?: string,
    ): Promise<boolean> => {
      try {
        const body: Record<string, unknown> = {};

        if (items) {
          body.items = toKitchenOrderItems(items) as never;

          const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

          body.total = total;
          body.subtotal = total;
        }

        if (notes !== undefined) {
          body.notes = notes;
        }

        if (status !== undefined) {
          body.status = status;
        }

        await ordersApi.update(venue.id, orderId, body);
        void queryClient.invalidateQueries({ queryKey: ["waiter-panel", "kitchen-orders", venue.id] });

        return true;
      } catch {
        return false;
      }
    },
    [queryClient, toKitchenOrderItems, venue.id],
  );

  const handleBeginOrder = useCallback(async (): Promise<void> => {
    if (!selectedTableElement || !isSelectedTableAvailable) {
      return;
    }

    const tableLabel =
      selectedTableElement.type === "table" && selectedTableElement.label
        ? selectedTableElement.label
        : `Table ${selectedTableElement.type === "table" ? selectedTableElement.tableNumber : selectedTableElement.id}`;
    const createdOrder = await createRemoteOrder(selectedTableElement.id, tableLabel);

    if (!createdOrder) {
      return;
    }

    setTableOrderIds((prev) => ({
      ...prev,
      [selectedTableElement.id]: createdOrder.id,
    }));
    setTableDisplayInfo((prev) => ({
      ...prev,
      [selectedTableElement.id]: {
        ...prev[selectedTableElement.id],
        orderStatus: "ordering",
        orderStatusLabel: t("waiterDashboard.orderStatus.ordering"),
        occupationTimeLabel: undefined,
        guestCount: Object.prototype.hasOwnProperty.call(prev, selectedTableElement.id)
          ? (prev[selectedTableElement.id].guestCount ?? selectedTableElement.seats)
          : selectedTableElement.seats,
      },
    }));
    setTableOrderItems((prev) => ({
      ...prev,
      [selectedTableElement.id]: prev[selectedTableElement.id] ?? [],
    }));
    setIsMenuDockOpen(true);
  }, [createRemoteOrder, isSelectedTableAvailable, selectedTableElement, t]);

  const handleAddItemToOrder = useCallback(
    (menuItemId: string): void => {
      if (!selectedTableElement || isSelectedTableAvailable || menuItemId.trim() === "") {
        return;
      }

      const selectedMenuItem = menuItems.find((item) => item.id === menuItemId);

      if (!selectedMenuItem) {
        return;
      }

      const existingItems = selectedTableOrderItems;
      const existingItem = existingItems.find((item) => item.id === selectedMenuItem.id);
      const nextItems = !existingItem
        ? [...existingItems, { ...selectedMenuItem, quantity: 1 }]
        : existingItems.map((item) =>
            item.id === selectedMenuItem.id ? { ...item, quantity: item.quantity + 1 } : item,
          );

      setTableOrderItems((prev) => ({
        ...prev,
        [selectedTableElement.id]: nextItems,
      }));
      setTableDisplayInfo((prev) => ({
        ...prev,
        [selectedTableElement.id]: {
          ...prev[selectedTableElement.id],
          orderStatus: "ordering",
          orderStatusLabel: t("waiterDashboard.orderStatus.ordering"),
        },
      }));
    },
    [isSelectedTableAvailable, menuItems, selectedTableElement, selectedTableOrderItems, t],
  );

  const handleSendToKitchen = useCallback(async (): Promise<void> => {
    if (!selectedTableElement || isSelectedTableAvailable || !selectedTableOrderId) {
      return;
    }

    const items = selectedTableOrderItems;

    if (items.length === 0) {
      return;
    }

    const updated = await syncRemoteOrder(selectedTableOrderId, items, "new");

    if (!updated) {
      return;
    }

    setTableDisplayInfo((prev) => ({
      ...prev,
      [selectedTableElement.id]: {
        ...prev[selectedTableElement.id],
        orderStatus: "ordered",
        orderStatusLabel: t("waiterDashboard.orderStatus.ordered"),
      },
    }));
  }, [
    isSelectedTableAvailable,
    selectedTableElement,
    selectedTableOrderId,
    selectedTableOrderItems,
    syncRemoteOrder,
    t,
  ]);

  const handleUpdateOrder = useCallback(async (): Promise<void> => {
    if (!selectedTableElement || isSelectedTableAvailable || !selectedTableOrderId) {
      return;
    }

    const items = selectedTableOrderItems;

    if (items.length === 0) {
      return;
    }

    const updated = await syncRemoteOrder(selectedTableOrderId, items);

    if (!updated) {
      return;
    }
  }, [isSelectedTableAvailable, selectedTableElement, selectedTableOrderId, selectedTableOrderItems, syncRemoteOrder]);

  const handleConfirmPayment = useCallback(async (): Promise<boolean> => {
    if (!selectedTableElement || isSelectedTableAvailable) {
      return false;
    }

    try {
      if (selectedTableOrderId) {
        if (isSelectedTableRejected) {
          await ordersApi.delete(venue.id, selectedTableOrderId);
        } else {
          if (!selectedTableLockedByMobile && wantsInvoice) {
            if (!validateWaiterInvoiceFields()) {
              return false;
            }

            const trimmedPostal = invoicePostalCode.trim();
            const postalFormatted = trimmedPostal.includes("-")
              ? trimmedPostal
              : `${trimmedPostal.slice(0, 2)}-${trimmedPostal.slice(2)}`;

            await ordersApi.update(venue.id, selectedTableOrderId, {
              invoiceData: {
                companyName: invoiceCompanyName.trim(),
                nip: invoiceNip.replace(/[\s-]/g, ""),
                street: invoiceStreet.trim(),
                city: invoiceCity.trim(),
                postalCode: postalFormatted,
                country: "PL",
              },
            });
          }

          await ordersApi.updateStatus(venue.id, selectedTableOrderId, OrderStatus.PAID);
          await ordersApi.archive(venue.id, selectedTableOrderId);
        }
      } else if (selectedTableSession) {
        await ordersApi.unlockTableSession(venue.id, selectedTableSession.tableRef);
      } else {
        return false;
      }
      void queryClient.invalidateQueries({ queryKey: ["waiter-panel", "kitchen-orders", venue.id] });
      void queryClient.invalidateQueries({ queryKey: ["waiter-panel", "archived-orders", venue.id] });
      void queryClient.invalidateQueries({ queryKey: ["waiter-panel", "table-sessions", venue.id] });

      setTableDisplayInfo((prev) => ({
        ...prev,
        [selectedTableElement.id]: {
          ...prev[selectedTableElement.id],
          guestCount: undefined,
          orderStatus: "browsing",
          orderStatusLabel: undefined,
          occupationTimeLabel: undefined,
          servedByName: undefined,
          servedBySurname: undefined,
        },
      }));
      setTableOrderItems((prev) => ({
        ...prev,
        [selectedTableElement.id]: [],
      }));
      setTableOrderNotes((prev) => ({
        ...prev,
        [selectedTableElement.id]: "",
      }));
      setTableOrderIds((prev) => {
        const next = { ...prev };

        delete next[selectedTableElement.id];

        return next;
      });
      setIsMenuDockOpen(false);

      return true;
    } catch (err: unknown) {
      showErrorToast(getOrderStatusUpdateErrorToastTitle(err, translate));

      return false;
    }
  }, [
    invoiceCity,
    invoiceCompanyName,
    invoiceNip,
    invoicePostalCode,
    invoiceStreet,
    isSelectedTableAvailable,
    isSelectedTableRejected,
    queryClient,
    selectedTableElement,
    selectedTableLockedByMobile,
    selectedTableOrderId,
    selectedTableSession,
    showErrorToast,
    translate,
    validateWaiterInvoiceFields,
    venue.id,
    wantsInvoice,
  ]);

  const handleForcePreparing = useCallback(async (): Promise<void> => {
    if (!selectedTableOrderId || isSelectedTableAvailable || selectedTableOrderStatus !== "new") {
      return;
    }

    try {
      await ordersApi.updateStatus(venue.id, selectedTableOrderId, OrderStatus.PREPARING);
      void queryClient.invalidateQueries({ queryKey: ["waiter-panel", "kitchen-orders", venue.id] });
    } catch (err: unknown) {
      showErrorToast(getOrderStatusUpdateErrorToastTitle(err, translate));
    }
  }, [
    isSelectedTableAvailable,
    queryClient,
    selectedTableOrderId,
    selectedTableOrderStatus,
    showErrorToast,
    translate,
    venue.id,
  ]);

  const handleMarkServed = useCallback(async (): Promise<void> => {
    if (!selectedTableOrderId || isSelectedTableAvailable || selectedTableOrderStatus !== "ready_to_serve") {
      return;
    }

    try {
      await ordersApi.updateStatus(venue.id, selectedTableOrderId, OrderStatus.DELIVERED);
      void queryClient.invalidateQueries({ queryKey: ["waiter-panel", "kitchen-orders", venue.id] });
    } catch (err: unknown) {
      showErrorToast(getOrderStatusUpdateErrorToastTitle(err, translate));
    }
  }, [
    isSelectedTableAvailable,
    queryClient,
    selectedTableOrderId,
    selectedTableOrderStatus,
    showErrorToast,
    translate,
    venue.id,
  ]);

  const handleReopenOrder = useCallback(async (): Promise<void> => {
    if (!selectedTableOrderId || isSelectedTableAvailable || !isSelectedTableRejected) {
      return;
    }

    try {
      await ordersApi.updateStatus(venue.id, selectedTableOrderId, OrderStatus.NEW);
      void queryClient.invalidateQueries({ queryKey: ["waiter-panel", "kitchen-orders", venue.id] });
    } catch (err: unknown) {
      showErrorToast(getOrderStatusUpdateErrorToastTitle(err, translate));
    }
  }, [
    isSelectedTableAvailable,
    isSelectedTableRejected,
    queryClient,
    selectedTableOrderId,
    showErrorToast,
    translate,
    venue.id,
  ]);

  const handleRemoveItemFromOrder = useCallback(
    async (itemId: string): Promise<void> => {
      if (!selectedTableElement || isSelectedTableAvailable || !selectedTableOrderId) {
        return;
      }

      const targetItem = selectedTableOrderItems.find((item) => item.id === itemId);

      if (!targetItem) {
        return;
      }

      const nextItems = selectedTableOrderItems.flatMap((item) => {
        if (item.id !== itemId) {
          return [item];
        }

        if (item.quantity <= 1) {
          return [];
        }

        return [{ ...item, quantity: item.quantity - 1 }];
      });

      const updated = await syncRemoteOrder(selectedTableOrderId, nextItems, "new");

      if (!updated) {
        return;
      }

      setTableOrderItems((prev) => ({
        ...prev,
        [selectedTableElement.id]: nextItems,
      }));
    },
    [isSelectedTableAvailable, selectedTableElement, selectedTableOrderId, selectedTableOrderItems, syncRemoteOrder],
  );

  const handlePersistOrderNote = useCallback(async (): Promise<void> => {
    if (!selectedTableOrderId || isSelectedTableAvailable || !selectedTableElement) {
      return;
    }

    const noteValue = tableOrderNotes[selectedTableElement.id] ?? "";

    await syncRemoteOrder(selectedTableOrderId, undefined, undefined, noteValue);
  }, [isSelectedTableAvailable, selectedTableElement, selectedTableOrderId, syncRemoteOrder, tableOrderNotes]);

  const selectedTableOrderTotal = selectedTableOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const dynamicPanelPlacement = useMemo<"left" | "right" | "top" | "bottom">(() => {
    if (!clickCoords) {
      return isDesktopUp ? "right" : "bottom";
    }

    const spaceLeft = clickCoords.x;
    const spaceRight = window.innerWidth - clickCoords.x;
    const spaceTop = clickCoords.y;
    const spaceBottom = window.innerHeight - clickCoords.y;

    const maxSpace = Math.max(spaceLeft, spaceRight, spaceTop, spaceBottom);

    if (maxSpace === spaceLeft) {
      return "left";
    }

    if (maxSpace === spaceRight) {
      return "right";
    }

    if (maxSpace === spaceTop) {
      return "top";
    }

    return "bottom";
  }, [clickCoords, isDesktopUp]);

  const occupiedTableMessage = useMemo(() => {
    if (isSelectedTableAvailable) {
      return t("waiterDashboard.tableAvailable");
    }

    if (isSelectedTableRejected) {
      return t("waiterDashboard.tableRejected");
    }

    const waiterFullName = [selectedTableDisplayInfo?.servedByName, selectedTableDisplayInfo?.servedBySurname]
      .filter((part): part is string => typeof part === "string" && part.trim() !== "")
      .join(" ")
      .trim();

    if (waiterFullName !== "") {
      return t("waiterDashboard.tableOccupiedByWaiter", { waiter: waiterFullName });
    }

    if (selectedTableSession?.origin === "mobile") {
      return t("waiterDashboard.tableOccupiedByMobile");
    }

    return t("waiterDashboard.tableOccupied");
  }, [
    isSelectedTableAvailable,
    isSelectedTableRejected,
    selectedTableDisplayInfo?.servedByName,
    selectedTableDisplayInfo?.servedBySurname,
    selectedTableSession?.origin,
    t,
  ]);

  const occupiedTableStatusStyle = useMemo(() => {
    if (isSelectedTableAvailable) {
      return "bg-status-success-background text-status-success-text";
    }

    if (isSelectedTableRejected) {
      return "bg-status-error-background text-status-error-text";
    }

    const orderStatus = selectedTableDisplayInfo?.orderStatus;

    switch (orderStatus) {
      case "ordering":
        return "bg-status-info-background text-status-info-text";
      case "ordered":
        return "bg-status-warning-background text-status-warning-text";
      case "preparing":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
      case "ready_to_serve":
        return "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300";
      case "served":
        return "bg-status-success-background text-status-success-text";
      case "bill_requested":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-300";
      default:
        return "bg-status-error-background text-status-error-text";
    }
  }, [isSelectedTableAvailable, isSelectedTableRejected, selectedTableDisplayInfo?.orderStatus]);

  if (!activeCanvas) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-text-secondary">
        {t("floorRuntime.noLayout")}
      </div>
    );
  }

  const orderNoteFieldId = "waiter-order-note";

  return (
    <div className="relative flex h-full min-h-0 flex-col p-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 touch-pan-x touch-pan-y overflow-x-auto overflow-y-auto">
          <div className="mx-auto flex min-h-full min-w-max flex-col justify-center p-2">
            <FloorCanvas
              layout={runtimeCanvas ?? activeCanvas}
              showGrid={false}
              gridCellSize={20}
              tableStates={tableStates}
              tableDisplayInfo={effectiveTableDisplayInfo}
              selectedElementId={selectedElementId}
              centered={false}
              interactive
              onElementPointerDown={(id, e, _mode, _bounds) => {
                e.preventDefault();
                handleElementPointerDown(id, e);
              }}
            />
          </div>
        </div>
      </div>
      {selectedTableElement && (
        <div
          className={cn(
            "pointer-events-none absolute z-20 flex",
            dynamicPanelPlacement === "right" && "inset-y-4 right-4 items-start justify-end",
            dynamicPanelPlacement === "left" && "inset-y-4 left-4 items-start justify-start",
            dynamicPanelPlacement === "top" && "inset-x-4 top-4 items-start justify-center",
            dynamicPanelPlacement === "bottom" && "inset-x-4 bottom-4 items-end justify-center",
          )}
        >
          <div
            className={cn(
              "max-h-[calc(100vh-8rem)] w-full max-w-sm overflow-y-auto rounded-lg border border-border-default bg-surface-primary p-4 shadow-lg transition-opacity duration-200",
              panelReady ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
            )}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-text-primary">{selectedTableName}</h3>
                <p className="text-sm text-text-secondary">
                  {t("waiterDashboard.tableSeats", { seats: selectedTableSeats ?? "-" })}
                  {selectedTableOccupationTime && (
                    <span className="ml-2 text-text-tertiary">
                      ({t("waiterDashboard.occupiedFor", { time: selectedTableOccupationTime })})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {!isSelectedTableAvailable && (
                  <Button
                    type="button"
                    variant={isMenuDockOpen ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => {
                      setIsMenuDockOpen((open) => !open);
                    }}
                  >
                    {t("waiterDashboard.addItem")}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 shrink-0 text-status-error-text before:absolute before:-inset-4 md:before:inset-0"
                  onClick={handleClosePanel}
                  aria-label={t("waiterDashboard.closePanel")}
                >
                  <IoIosCloseCircleOutline className="h-7 w-7" />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              <div className={cn("rounded-md px-3 py-2 text-sm font-medium", occupiedTableStatusStyle)}>
                {occupiedTableMessage}
                {isSelectedTableRejected && selectedTableRejectionReason && (
                  <span className="block mt-1 font-normal text-xs opacity-90">{selectedTableRejectionReason}</span>
                )}
              </div>
              {isSelectedTableAvailable ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    void handleBeginOrder();
                  }}
                >
                  {t("waiterDashboard.beginOrder")}
                </Button>
              ) : (
                <>
                  <div className="rounded-md border border-border-default bg-background-secondary px-3 py-2 text-sm text-text-secondary">
                    {selectedTableLockedByMobile ? (
                      <span>{t("waiterDashboard.mobileLockDescription")}</span>
                    ) : selectedTableOrderItems.length === 0 ? (
                      <span>{t("waiterDashboard.noItemsYet")}</span>
                    ) : (
                      <div className="space-y-3 sm:space-y-1">
                        {selectedTableOrderItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-4 sm:gap-2">
                            <span>
                              {item.name} x{item.quantity}
                            </span>
                            <div className="flex items-center gap-2">
                              <span>{(item.price * item.quantity).toFixed(2)}</span>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  void handleRemoveItemFromOrder(item.id);
                                }}
                                aria-label={t("waiterDashboard.removeItem")}
                              >
                                -
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="mt-2 border-t border-border-default pt-2 font-semibold text-text-primary">
                          {t("waiterDashboard.orderTotal", { total: selectedTableOrderTotal.toFixed(2) })}
                        </div>
                      </div>
                    )}
                  </div>
                  {!selectedTableLockedByMobile && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label htmlFor={orderNoteFieldId} className="text-sm text-text-secondary">
                          {t("waiterDashboard.orderNoteLabel")}
                        </label>
                        <textarea
                          id={orderNoteFieldId}
                          rows={2}
                          value={selectedTableOrderNote}
                          onChange={(event) => {
                            const nextValue = event.target.value;

                            setTableOrderNotes((prev) => ({
                              ...prev,
                              [selectedTableElement.id]: nextValue,
                            }));
                          }}
                          onBlur={() => {
                            void handlePersistOrderNote();
                          }}
                          className="w-full rounded-md border border-border-default bg-surface-primary px-4 py-3 text-sm text-text-primary"
                        />
                      </div>
                      {selectedTableInvoiceData ? (
                        <div className="rounded-md border border-border-default bg-surface-secondary p-3 text-sm text-text-secondary">
                          <p className="font-medium text-text-primary">{t("waiterDashboard.invoice.summaryTitle")}</p>
                          <p className="mt-1">{selectedTableInvoiceData.companyName}</p>
                          <p>
                            {t("waiterDashboard.invoice.summaryNip")}: {selectedTableInvoiceData.nip}
                          </p>
                          <p>
                            {selectedTableInvoiceData.street}, {selectedTableInvoiceData.postalCode}{" "}
                            {selectedTableInvoiceData.city}
                          </p>
                        </div>
                      ) : null}
                    </>
                  )}
                  <div className="flex flex-col gap-2">
                    {!selectedTableLockedByMobile && (
                      <div className="flex gap-2">
                        {selectedTableOrderItems.length > 0 && !selectedTableOrderStatus && (
                          <Button
                            type="button"
                            variant="primary"
                            className="flex-1"
                            onClick={() => {
                              void handleSendToKitchen();
                            }}
                          >
                            {t("waiterDashboard.sendToKitchen")}
                          </Button>
                        )}
                        {selectedTableOrderItems.length > 0 && selectedTableOrderStatus && (
                          <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => {
                              void handleUpdateOrder();
                            }}
                          >
                            {t("waiterDashboard.updateOrder")}
                          </Button>
                        )}
                        {selectedTableOrderStatus === "new" && (
                          <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => {
                              void handleForcePreparing();
                            }}
                          >
                            {t("waiterDashboard.forcePreparing")}
                          </Button>
                        )}
                      </div>
                    )}
                    {!selectedTableLockedByMobile &&
                      selectedTableOrderId &&
                      selectedTableOrderStatus === "ready_to_serve" && (
                        <Button
                          type="button"
                          variant="primary"
                          className="w-full"
                          onClick={() => {
                            void handleMarkServed();
                          }}
                        >
                          {t("waiterDashboard.markServed")}
                        </Button>
                      )}
                    {isSelectedTableRejected && (
                      <Button
                        type="button"
                        variant="primary"
                        className="flex-1"
                        onClick={() => {
                          void handleReopenOrder();
                        }}
                      >
                        {t("waiterDashboard.reopenOrder")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant={isSelectedTableRejected ? "danger" : "primary"}
                      className="flex-1"
                      onClick={() => {
                        setIsUnlockModalOpen(true);
                      }}
                    >
                      {isSelectedTableRejected
                        ? t("waiterDashboard.rejectOrder")
                        : selectedTableLockedByMobile
                          ? t("waiterDashboard.unlockMobileTable")
                          : t("waiterDashboard.confirmPayment")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {selectedTableElement && !isSelectedTableAvailable && (
        <WaiterMenuDock
          isOpen={isMenuDockOpen}
          placement={isDesktopUp ? "right" : "bottom"}
          title={t("waiterDashboard.addItemModalTitle")}
          emptyLabel={t("waiterDashboard.addItemModalEmpty")}
          closeLabel={t("waiterDashboard.closePanel")}
          items={menuItems}
          onAddItem={(itemId) => {
            void handleAddItemToOrder(itemId);
          }}
          onClose={() => {
            setIsMenuDockOpen(false);
          }}
        />
      )}

      <Modal
        isOpen={isUnlockModalOpen}
        onClose={() => {
          setIsUnlockModalOpen(false);
          resetInvoiceForm();
        }}
        title={
          isSelectedTableRejected
            ? t("waiterDashboard.handleRejectionModalTitle")
            : t("waiterDashboard.confirmPaymentModalTitle")
        }
        size="md"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            {isSelectedTableRejected
              ? t("waiterDashboard.handleRejectionModalDescription")
              : selectedTableLockedByMobile
                ? t("waiterDashboard.unlockMobileTableDescription")
                : t("waiterDashboard.confirmPaymentModalDescription")}
          </p>

          {!isSelectedTableRejected && !selectedTableLockedByMobile && (
            <>
              <Checkbox
                label={t("waiterDashboard.invoice.wantInvoice")}
                checked={wantsInvoice}
                onChange={(e) => setWantsInvoice(e.target.checked)}
              />

              {wantsInvoice && (
                <div className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface-secondary p-3">
                  <Input
                    label={t("waiterDashboard.invoice.companyNameLabel")}
                    placeholder={t("waiterDashboard.invoice.companyNamePlaceholder")}
                    value={invoiceCompanyName}
                    onChange={(e) => setInvoiceCompanyName(e.target.value)}
                  />
                  <Input
                    label={t("waiterDashboard.invoice.nipLabel")}
                    placeholder={t("waiterDashboard.invoice.nipPlaceholder")}
                    value={invoiceNip}
                    onChange={(e) => {
                      setInvoiceNip(e.target.value);
                      setInvoiceNipError("");
                    }}
                    error={invoiceNipError}
                  />
                  <Input
                    label={t("waiterDashboard.invoice.streetLabel")}
                    placeholder={t("waiterDashboard.invoice.streetPlaceholder")}
                    value={invoiceStreet}
                    onChange={(e) => setInvoiceStreet(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={t("waiterDashboard.invoice.postalCodeLabel")}
                      placeholder={t("waiterDashboard.invoice.postalCodePlaceholder")}
                      value={invoicePostalCode}
                      onChange={(e) => {
                        setInvoicePostalCode(e.target.value);
                        setInvoicePostalCodeError("");
                      }}
                      error={invoicePostalCodeError}
                    />
                    <Input
                      label={t("waiterDashboard.invoice.cityLabel")}
                      placeholder={t("waiterDashboard.invoice.cityPlaceholder")}
                      value={invoiceCity}
                      onChange={(e) => setInvoiceCity(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsUnlockModalOpen(false);
                resetInvoiceForm();
              }}
            >
              {t("waiterDashboard.confirmPaymentModalCancel")}
            </Button>
            <Button
              type="button"
              variant={isSelectedTableRejected ? "danger" : "primary"}
              onClick={() => {
                void (async (): Promise<void> => {
                  const ok = await handleConfirmPayment();

                  if (ok) {
                    setIsUnlockModalOpen(false);
                    resetInvoiceForm();
                  }
                })();
              }}
            >
              {t("waiterDashboard.confirmPaymentModalConfirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
