from datetime import datetime
from typing import Any

from pydantic import Field

from core.dto.v1.common import BaseDTO
from core.dto.v1.tenants.mobile_config import MobileLandingContentDTO


class PublicTenantInfoResponseDTO(BaseDTO):
    name: str = Field(..., description="Restaurant name")
    slug: str = Field(..., description="Restaurant slug")
    page_title: str | None = Field(
        None, alias="pageTitle", description="Mobile browser title override"
    )
    favicon_path: str | None = Field(
        None,
        alias="faviconPath",
        description="Relative API path to favicon when configured",
    )
    theme_override: dict[str, Any] | None = Field(
        None, alias="themeOverride", description="Theme CSS variable overrides for mobile"
    )
    landing_content: MobileLandingContentDTO | None = Field(
        None,
        alias="landingContent",
        description="Optional mobile landing copy overrides",
    )


class PublicCreateOrderPaymentResponseDTO(BaseDTO):
    token: str = Field(..., description="P24 transaction token for redirect")
    redirect_url: str = Field(..., alias="redirectUrl", description="Full P24 redirect URL")
    lock_token: str = Field(..., alias="lockToken", description="Opaque table lock token")
    expires_at: str = Field(..., alias="expiresAt", description="Lease expiration ISO datetime")
    table_status: str = Field(..., alias="tableStatus", description="Current table session status")
    owner_type: str = Field(..., alias="ownerType", description="Current lock owner type")


class PublicFloorTableStatusDTO(BaseDTO):
    id: str = Field(..., description="Stable table element id (table ref)")
    table_number: int | None = Field(None, alias="tableNumber")
    label: str | None = None
    x: float = 0
    y: float = 0
    w: float
    h: float
    rotation: float | None = None
    seats: int | None = None
    status: str = Field(
        ...,
        description="open = wolny / available, closed = zajęty / in use",
    )
    reserved_until: datetime | None = Field(
        None,
        alias="reservedUntil",
        description="When status is closed, approximate time to recheck availability (session lock expiry or fallback)",
    )


class PublicFloorCanvasOverviewDTO(BaseDTO):
    name: str
    width: int
    height: int
    tables: list[PublicFloorTableStatusDTO]


class PublicTablesOverviewResponseDTO(BaseDTO):
    canvases: list[PublicFloorCanvasOverviewDTO]


class PublicTableSessionResponseDTO(BaseDTO):
    lock_token: str = Field(..., alias="lockToken", description="Opaque table lock token")
    expires_at: str = Field(..., alias="expiresAt", description="Lease expiration ISO datetime")
    table_status: str = Field(..., alias="tableStatus", description="Current table session status")
    owner_type: str = Field(..., alias="ownerType", description="Current lock owner type")
    table_ref: str = Field(..., alias="tableRef", description="Canonical table reference")
    table_number: int | None = Field(None, alias="tableNumber", description="Human table number")
    message: str | None = Field(None, description="Optional explanatory message")


class PublicP24TransactionSyncResponseDTO(BaseDTO):
    session_id: str = Field(..., alias="sessionId", serialization_alias="sessionId")
    status: int = Field(..., description="Status stored in DB after sync (mirrors P24 0/1/2)")
    p24_order_id: int | None = Field(None, alias="p24OrderId", serialization_alias="p24OrderId")
    amount: int
    currency: str
    p24_status: int = Field(
        ...,
        alias="p24Status",
        serialization_alias="p24Status",
        description="Raw status from Przelewy24",
    )
    response_code: int = Field(..., alias="responseCode", serialization_alias="responseCode")
    statement: str | None = None
    date: str | None = None
    date_of_transaction: str | None = Field(
        None, alias="dateOfTransaction", serialization_alias="dateOfTransaction"
    )
