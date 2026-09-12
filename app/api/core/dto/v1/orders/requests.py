from decimal import Decimal

from pydantic import AliasChoices, Field

from core.dto.v1.common import BaseDTO, InvoiceDataDTO


class CreateOrderItemDTO(BaseDTO):
    id: str = Field(default="", description="Item identifier")
    menu_item_id: str = Field(
        ...,
        min_length=1,
        alias="menuItemId",
        validation_alias=AliasChoices("menuItemId", "menu_item_id", "product_id"),
        description="Menu item identifier",
    )
    name: str = Field(default="", description="Item display name")
    quantity: int = Field(..., gt=0, description="Item quantity")
    base_price: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        alias="basePrice",
        validation_alias=AliasChoices("basePrice", "base_price", "unit_price"),
        description="Base unit price",
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


class CreateOrderDTO(BaseDTO):
    table_id: str | None = Field(None, alias="tableId", description="Restaurant table identifier")
    session_id: str = Field(default="", alias="sessionId", description="Session identifier")
    table: str = Field(default="", description="Table label")
    items: list[CreateOrderItemDTO] = Field(default_factory=list, description="Order items")
    subtotal: float = Field(default=0, ge=0, description="Subtotal")
    tax: float = Field(default=0, ge=0, description="Tax amount")
    total: float = Field(default=0, ge=0, description="Total amount")
    notes: str | None = Field(None, description="Order notes")
    payment_status: str = Field(
        default="pending", alias="paymentStatus", description="Payment status"
    )
    invoice_data: InvoiceDataDTO | None = Field(
        default=None, alias="invoiceData", description="VAT invoice data (Faktura)"
    )


class UpdateOrderStatusDTO(BaseDTO):
    status: str = Field(..., description="Target order status")
    rejection_reason: str | None = Field(
        None,
        alias="rejectionReason",
        description="Reason for rejection (required when status is 'rejected')",
    )


class UpdateOrderDTO(BaseDTO):
    status: str | None = Field(None, description="Updated order status")
    total: Decimal | None = Field(
        None,
        ge=0,
        alias="totalAmount",
        validation_alias=AliasChoices("totalAmount", "total_amount", "total"),
        description="Updated order total",
    )
    subtotal: Decimal | None = Field(None, ge=0, description="Updated order subtotal")
    currency: str | None = Field(None, min_length=3, max_length=3, description="Updated currency")
    items: list[CreateOrderItemDTO] | None = Field(None, description="Order items")
    notes: str | None = Field(None, description="Order notes")
    invoice_data: InvoiceDataDTO | None = Field(
        None,
        alias="invoiceData",
        description="VAT invoice data (Faktura)",
    )

    @property
    def total_amount(self) -> Decimal | None:
        return self.total
