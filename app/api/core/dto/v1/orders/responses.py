from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import AliasChoices, Field

from core.dto.v1.common import BaseDTO, CurrencyCode, EntityId


class KitchenOrderItemResponseDTO(BaseDTO):
    """Order item DTO for MongoDB kitchen orders (string IDs)."""

    id: str = Field(..., description="Item identifier")
    menu_item_id: str = Field(
        ...,
        alias="menuItemId",
        validation_alias=AliasChoices("menuItemId", "menu_item_id", "product_id"),
        description="Menu item identifier",
    )
    name: str = Field(..., description="Item display name")
    quantity: int = Field(..., description="Quantity")
    base_price: Decimal = Field(
        ...,
        ge=0,
        alias="basePrice",
        validation_alias=AliasChoices("basePrice", "base_price", "unit_price"),
        description="Base price",
    )
    selected_modifiers: list[str | dict] = Field(
        default_factory=list,
        alias="selectedModifiers",
        validation_alias=AliasChoices("selectedModifiers", "selected_modifiers", "modifiers"),
        description="Selected modifiers",
    )
    total_price: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        alias="totalPrice",
        validation_alias=AliasChoices("totalPrice", "total_price"),
        description="Total line price",
    )
    notes: str | None = Field(None, description="Item notes")


class KitchenOrderResponseDTO(BaseDTO):
    """Order DTO for MongoDB kitchen orders (string IDs)."""

    id: str = Field(..., description="Order identifier")
    restaurant_id: str = Field(
        ...,
        alias="restaurantId",
        validation_alias=AliasChoices("restaurantId", "restaurant_id"),
        description="Restaurant identifier",
    )
    table_id: str | None = Field(
        None,
        alias="tableId",
        validation_alias=AliasChoices("tableId", "table_id"),
        description="Table identifier",
    )
    session_id: str = Field(
        default="",
        alias="sessionId",
        validation_alias=AliasChoices("sessionId", "session_id"),
        description="Session identifier",
    )
    items: list[KitchenOrderItemResponseDTO] = Field(
        default_factory=list, description="Order items"
    )
    status: str = Field(..., description="Order status")
    payment_status: str = Field(
        default="pending",
        alias="paymentStatus",
        validation_alias=AliasChoices("paymentStatus", "payment_status"),
        description="Payment status",
    )
    subtotal: float = Field(default=0, description="Subtotal")
    tax: float = Field(default=0, description="Tax")
    total: float = Field(default=0, description="Total")
    table: str = Field(default="", description="Table label")
    time: str = Field(default="", description="Order time")
    notes: str | None = Field(None, description="Order notes")
    rejection_reason: str | None = Field(
        None,
        alias="rejectionReason",
        validation_alias=AliasChoices("rejectionReason", "rejection_reason"),
        description="Rejection reason",
    )
    created_at: datetime | str = Field(
        ...,
        alias="createdAt",
        validation_alias=AliasChoices("createdAt", "created_at"),
        description="Created timestamp",
    )
    updated_at: datetime | str = Field(
        ...,
        alias="updatedAt",
        validation_alias=AliasChoices("updatedAt", "updated_at"),
        description="Updated timestamp",
    )
    invoice_data: dict[str, Any] | None = Field(
        None,
        alias="invoiceData",
        validation_alias=AliasChoices("invoiceData", "invoice_data"),
        description="VAT invoice payload as stored (camelCase keys)",
    )


class OrderItemResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Item identifier")
    menu_item_id: str = Field(
        ...,
        alias="menuItemId",
        validation_alias=AliasChoices("menuItemId", "menu_item_id", "product_id"),
        description="Menu item identifier",
    )
    name: str = Field(..., description="Item display name")
    quantity: int = Field(..., description="Quantity")
    base_price: Decimal = Field(
        ...,
        ge=0,
        alias="basePrice",
        validation_alias=AliasChoices("basePrice", "base_price", "unit_price"),
        description="Base price",
    )
    selected_modifiers: list[str | dict] = Field(
        default_factory=list,
        alias="selectedModifiers",
        validation_alias=AliasChoices("selectedModifiers", "selected_modifiers", "modifiers"),
        description="Selected modifiers",
    )
    total_price: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        alias="totalPrice",
        validation_alias=AliasChoices("totalPrice", "total_price"),
        description="Total line price",
    )
    notes: str | None = Field(None, description="Item notes")

    @property
    def product_id(self) -> str:
        return self.menu_item_id

    @property
    def modifiers(self) -> list[str | dict]:
        return self.selected_modifiers

    @property
    def unit_price(self) -> Decimal:
        return self.base_price


class OrderResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Order identifier")
    tenant_id: EntityId = Field(..., alias="tenantId", description="Tenant identifier")
    table_id: EntityId | None = Field(None, alias="tableId", description="Table identifier")
    table_ref: str | None = Field(None, description="Client table identifier from floor layout")
    session_id: str = Field(default="", alias="sessionId", description="Session identifier")
    waiter_name: str | None = Field(None, description="Assigned waiter name")
    waiter_surname: str | None = Field(None, description="Assigned waiter surname")
    items: list[OrderItemResponseDTO] = Field(default_factory=list, description="Order items")
    status: str = Field(..., description="Order status")
    payment_status: str = Field(
        default="pending", alias="paymentStatus", description="Payment status"
    )
    subtotal: float = Field(default=0, description="Subtotal")
    tax: float = Field(default=0, description="Tax")
    total: float = Field(default=0, description="Total")
    total_amount: Decimal | None = Field(
        None,
        validation_alias=AliasChoices("total_amount", "totalAmount"),
        description="Compatibility total amount field",
    )
    currency: CurrencyCode | None = Field(None, description="Order currency")
    table_number: str = Field(default="", alias="tableNumber", description="Table number")
    floor_canvas_id: str = Field(
        default="", alias="floorCanvasId", description="Floor canvas identifier"
    )
    time: str = Field(default="", description="Order time")
    notes: str | None = Field(None, description="Order notes")
    rejection_reason: str | None = Field(
        None, alias="rejectionReason", description="Rejection reason"
    )
    created_at: datetime | str = Field(..., alias="createdAt", description="Created timestamp")
    updated_at: datetime | str = Field(..., alias="updatedAt", description="Updated timestamp")


class ArchivedOrderResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Archived record identifier")
    original_order_id: str = Field(
        ...,
        alias="originalOrderId",
        validation_alias=AliasChoices("originalOrderId", "original_order_id"),
        description="Original MongoDB order identifier",
    )
    tenant_id: str = Field(
        ...,
        alias="tenantId",
        validation_alias=AliasChoices("tenantId", "tenant_id"),
        description="Tenant public identifier",
    )
    restaurant_id: str = Field(
        ...,
        alias="restaurantId",
        validation_alias=AliasChoices("restaurantId", "restaurant_id"),
        description="Restaurant identifier",
    )
    table_id: str | None = Field(
        None,
        alias="tableId",
        validation_alias=AliasChoices("tableId", "table_id"),
        description="Table identifier",
    )
    table_label: str = Field(
        default="",
        alias="tableLabel",
        validation_alias=AliasChoices("tableLabel", "table_label"),
        description="Table label snapshot",
    )
    status: str = Field(..., description="Final order status")
    payment_status: str = Field(
        default="completed",
        alias="paymentStatus",
        validation_alias=AliasChoices("paymentStatus", "payment_status"),
        description="Final payment status",
    )
    total: Decimal = Field(default=Decimal("0"), ge=0, description="Final order total")
    currency: CurrencyCode = Field(default="PLN", description="Order currency")
    notes: str | None = Field(None, description="Archived notes")
    created_at: datetime | str = Field(
        ..., alias="createdAt", description="Original order creation time"
    )
    archived_at: datetime | str = Field(
        ..., alias="archivedAt", description="Archive creation time"
    )


class TableSessionResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Table session identifier")
    table_ref: str = Field(..., alias="tableRef", description="Canonical table reference")
    table_number: int | None = Field(None, alias="tableNumber", description="Human table number")
    table_label: str | None = Field(None, alias="tableLabel", description="Human table label")
    origin: str = Field(..., description="Session origin")
    status: str = Field(..., description="Session status")
    session_id: str | None = Field(
        None, alias="sessionId", description="Payment session identifier"
    )
    waiter_user_id: EntityId | None = Field(
        None,
        alias="waiterUserId",
        description="Staff member currently holding the lock",
    )
    acquired_at: datetime | str = Field(
        ..., alias="acquiredAt", description="Acquisition timestamp"
    )
    last_seen_at: datetime | str = Field(
        ..., alias="lastSeenAt", description="Last activity timestamp"
    )
    expires_at: datetime | str = Field(
        ..., alias="expiresAt", description="Lease expiration timestamp"
    )
