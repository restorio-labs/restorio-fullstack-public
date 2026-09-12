from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.foundation.database.database import Base
from core.models.enums import OrderStatus

if TYPE_CHECKING:
    from core.models.order_details import OrderDetails
    from core.models.payment import Payment
    from core.models.tenant import Tenant
    from core.models.user import User


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    table_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        nullable=True,
    )
    table_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    waiter_user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(
            OrderStatus,
            name="order_status",
            create_constraint=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=OrderStatus.PLACED,
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="PLN")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="orders")
    assigned_waiter: Mapped[User | None] = relationship("User", foreign_keys=[waiter_user_id])
    details: Mapped[OrderDetails | None] = relationship(
        "OrderDetails", back_populates="order", cascade="all, delete-orphan", uselist=False
    )
    payments: Mapped[list[Payment]] = relationship(
        "Payment", back_populates="order", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("total_amount >= 0", name="check_total_amount_non_negative"),
        Index("idx_orders_tenant_id_created_at", "tenant_id", "created_at"),
        Index("idx_orders_table_id", "table_id"),
        Index("idx_orders_table_ref", "table_ref"),
        Index("idx_orders_waiter_user_id", "waiter_user_id"),
        Index("idx_orders_status", "status"),
    )
