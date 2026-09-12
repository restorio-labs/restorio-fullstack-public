from __future__ import annotations

from datetime import datetime
import secrets
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.foundation.database.database import Base
from core.models.enums import TenantStatus


def _generate_public_id() -> str:
    return secrets.token_urlsafe(16)


if TYPE_CHECKING:
    from core.models.audit_log import AuditLog
    from core.models.floor_canvas import FloorCanvas
    from core.models.order import Order
    from core.models.table_session import TableSession
    from core.models.tenant_mobile_config import TenantMobileConfig
    from core.models.tenant_profile import TenantProfile
    from core.models.tenant_role import TenantRole
    from core.models.transaction import Transaction


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    public_id: Mapped[str] = mapped_column(
        String(32), nullable=False, unique=True, default=_generate_public_id, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    owner_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", use_alter=True),
        nullable=True,
    )
    status: Mapped[TenantStatus] = mapped_column(
        Enum(TenantStatus, name="tenant_status", create_constraint=True),
        nullable=False,
        default=TenantStatus.ACTIVE,
    )
    active_layout_version_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("floor_canvases.id", ondelete="SET NULL", use_alter=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    p24_merchantid: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    p24_api: Mapped[str | None] = mapped_column(String(32), nullable=True)
    p24_crc: Mapped[str | None] = mapped_column(String(16), nullable=True)

    tenant_roles: Mapped[list[TenantRole]] = relationship(
        "TenantRole", back_populates="tenant", cascade="all, delete-orphan"
    )
    orders: Mapped[list[Order]] = relationship(
        "Order", back_populates="tenant", cascade="all, delete-orphan"
    )
    audit_logs: Mapped[list[AuditLog]] = relationship(
        "AuditLog", back_populates="tenant", cascade="all, delete-orphan"
    )
    floor_canvases: Mapped[list[FloorCanvas]] = relationship(
        "FloorCanvas",
        back_populates="tenant",
        cascade="all, delete-orphan",
        foreign_keys="FloorCanvas.tenant_id",
    )
    tenant_profile: Mapped[TenantProfile | None] = relationship(
        "TenantProfile", back_populates="tenant", uselist=False, cascade="all, delete-orphan"
    )
    mobile_config: Mapped[TenantMobileConfig | None] = relationship(
        "TenantMobileConfig", back_populates="tenant", uselist=False, cascade="all, delete-orphan"
    )
    transactions: Mapped[list[Transaction]] = relationship(
        "Transaction", back_populates="tenant", cascade="all, delete-orphan"
    )
    table_sessions: Mapped[list[TableSession]] = relationship(
        "TableSession", back_populates="tenant", cascade="all, delete-orphan"
    )
