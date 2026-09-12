from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.foundation.database.database import Base

if TYPE_CHECKING:
    from core.models.tenant import Tenant


class Transaction(Base):
    __tablename__ = "transactions"

    session_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    merchant_id: Mapped[int] = mapped_column(Integer(), nullable=False)
    pos_id: Mapped[int] = mapped_column(Integer(), nullable=False)
    amount: Mapped[int] = mapped_column(Integer(), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="PLN")
    description: Mapped[str] = mapped_column(String(1024), nullable=False, default="")
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(String(2), nullable=False, default="PL")
    language: Mapped[str] = mapped_column(String(2), nullable=False, default="pl")
    url_return: Mapped[str] = mapped_column(String(512), nullable=False)
    url_status: Mapped[str] = mapped_column(String(512), nullable=False)
    sign: Mapped[str] = mapped_column(String(96), nullable=False)
    wait_for_result: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    regulation_accept: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)
    status: Mapped[int] = mapped_column(SmallInteger(), nullable=False, default=0)
    p24_order_id: Mapped[int | None] = mapped_column(BigInteger(), nullable=True)
    order: Mapped[dict[str, Any] | None] = mapped_column(JSONB(), nullable=True)
    note: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="transactions")

    __table_args__ = (
        CheckConstraint("status >= 0 AND status <= 3", name="check_transaction_status_range"),
        CheckConstraint("amount > 0", name="check_transaction_amount_positive"),
        Index("idx_transactions_tenant_id", "tenant_id"),
        Index("idx_transactions_status", "status"),
    )
