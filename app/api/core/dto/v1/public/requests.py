from pydantic import Field

from core.dto.v1.common import BaseDTO, InvoiceDataDTO


class PublicOrderItemDTO(BaseDTO):
    name: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0, alias="unitPrice")


class PublicCreateOrderPaymentDTO(BaseDTO):
    tenant_slug: str = Field(..., min_length=1, max_length=255, alias="tenantSlug")
    table_number: int = Field(..., ge=0, alias="tableNumber")
    table_ref: str | None = Field(default=None, alias="tableRef", max_length=255)
    lock_token: str | None = Field(default=None, alias="lockToken", max_length=128)
    email: str = Field(..., min_length=1, max_length=255)
    items: list[PublicOrderItemDTO] = Field(..., min_length=1)
    note: str | None = Field(default=None, max_length=1024)
    invoice_data: InvoiceDataDTO | None = Field(default=None, alias="invoiceData")


class PublicAcquireTableSessionDTO(BaseDTO):
    tenant_slug: str = Field(..., min_length=1, max_length=255, alias="tenantSlug")
    table_number: int = Field(..., ge=0, alias="tableNumber")
    table_ref: str | None = Field(default=None, alias="tableRef", max_length=255)
    lock_token: str | None = Field(default=None, alias="lockToken", max_length=128)


class PublicRefreshTableSessionDTO(BaseDTO):
    lock_token: str = Field(..., alias="lockToken", min_length=1, max_length=128)


class PublicReleaseTableSessionDTO(BaseDTO):
    lock_token: str = Field(..., alias="lockToken", min_length=1, max_length=128)
