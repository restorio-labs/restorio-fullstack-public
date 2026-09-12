import type { InvoiceData } from "./payment";

export enum OrderStatus {
  NEW = "new",
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PREPARING = "preparing",
  READY = "ready",
  READY_TO_SERVE = "ready_to_serve",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  PAID = "paid",
  REJECTED = "rejected",
  REFUNDED = "refunded",
}

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export interface Order {
  id: string;
  restaurantId: string;
  tableId?: string;
  sessionId: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  total: number;
  table: string;
  time: string;
  notes?: string;
  rejectionReason?: string;
  invoiceData?: InvoiceData;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderFilters {
  status?: OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  basePrice: number;
  selectedModifiers: SelectedModifier[];
  totalPrice: number;
  notes?: string;
}

export interface SelectedModifier {
  modifierId: string;
  optionId: string;
  name: string;
  priceAdjustment: number;
}

export interface KitchenOrder {
  id: string;
  status: OrderStatus;
  table: string;
  time: string;
  items: readonly string[];
  notes?: string;
}

export type KitchenStatusIconKey = "add" | "clock" | "check" | "x" | "undo";

export interface KitchenStatusConfig {
  label: string;
  ariaLabel: string;
  indicatorClassName: string;
  iconClassName: string;
  iconKey: KitchenStatusIconKey;
}

export type KitchenOrderEventType = "order_created" | "order_updated" | "order_archived";

export interface KitchenOrderEvent {
  type: KitchenOrderEventType;
  order: Order;
}

export interface RestaurantKitchenConfig {
  restaurantId: string;
  rejectionLabels: string[];
}

export interface TableSession {
  id: string;
  tableRef: string;
  tableNumber?: number | null;
  tableLabel?: string | null;
  origin: "mobile" | "waiter";
  status: "active" | "released" | "expired" | "completed";
  sessionId?: string | null;
  waiterUserId?: string | null;
  acquiredAt: string;
  lastSeenAt: string;
  expiresAt: string;
}
