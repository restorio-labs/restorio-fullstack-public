from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Index, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from core.foundation.database.database import Base


class ArchivedOrder(Base):
    __tablename__ = "archived_orders"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    original_order_id: Mapped[str] = mapped_column(String(64), nullable=False)
    tenant_id: Mapped[str] = mapped_column(String(64), nullable=False)
    restaurant_id: Mapped[str] = mapped_column(String(64), nullable=False)
    table_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    table_label: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    payment_status: Mapped[str] = mapped_column(String(32), nullable=False, default="completed")
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    tax: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="PLN")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    items_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)
    order_created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    archived_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        Index("idx_archived_orders_tenant_restaurant", "tenant_id", "restaurant_id"),
        Index("idx_archived_orders_archived_at", "archived_at"),
        Index("idx_archived_orders_status", "status"),
    )
