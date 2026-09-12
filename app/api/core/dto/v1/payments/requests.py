from datetime import date
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import Field

from core.dto.v1.common import BaseDTO, EntityId, PaymentProvider, PaymentStatus


class CreatePaymentDTO(BaseDTO):
    order_id: EntityId = Field(..., description="Order identifier")
    provider: PaymentProvider = Field(..., description="Payment provider")
    amount: Decimal = Field(..., ge=0, description="Payment amount")
    external_reference: str | None = Field(
        None, max_length=255, description="External payment reference"
    )


class CreateTransactionDTO(BaseDTO):
    tenant_id: EntityId = Field(..., description="Tenant identifier")
    amount: int = Field(..., gt=0, description="Transaction amount in minor units")
    email: str = Field(..., description="Payer email address")
    order: dict[str, Any] | None = Field(default=None, description="Order details")
    note: str | None = Field(default=None, description="Additional notes")


class VerifyP24TransactionDTO(BaseDTO):
    session_id: UUID = Field(
        ..., description="Transaction session identifier (Przelewy24 sessionId)"
    )


class TransactionListQueryDTO(BaseDTO):
    date_from: date | None = Field(default=None, description="Filter by start date")
    date_to: date | None = Field(default=None, description="Filter by end date")
    page: int = Field(default=1, ge=1, description="Page number")
    pagination: int = Field(default=20, ge=1, le=100, description="Items per page")


class UpdatePaymentDTO(BaseDTO):
    status: PaymentStatus | None = Field(None, description="Payment status")
    external_reference: str | None = Field(
        None, max_length=255, description="External payment reference"
    )


class UpdateP24ConfigDTO(BaseDTO):
    p24_merchantid: int = Field(
        ..., ge=0, le=999_999, description="Przelewy24 merchant ID (max 6 digits)"
    )
    p24_api: str = Field(
        ..., min_length=32, max_length=32, description="Przelewy24 API key (exactly 32 characters)"
    )
    p24_crc: str = Field(
        ..., min_length=16, max_length=16, description="Przelewy24 CRC key (exactly 16 characters)"
    )
