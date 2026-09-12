from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.foundation.database.database import Base
from core.models.enums import TableSessionOrigin, TableSessionStatus

if TYPE_CHECKING:
    from core.models.tenant import Tenant
    from core.models.user import User


class TableSession(Base):
    __tablename__ = "table_sessions"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    waiter_user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    tenant_public_id: Mapped[str] = mapped_column(String(64), nullable=False)
    tenant_slug: Mapped[str | None] = mapped_column(String(255), nullable=True)
    table_ref: Mapped[str] = mapped_column(String(255), nullable=False)
    table_number: Mapped[int | None] = mapped_column(nullable=True)
    table_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    lock_token: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    origin: Mapped[TableSessionOrigin] = mapped_column(
        Enum(
            TableSessionOrigin,
            name="table_session_origin",
            create_constraint=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    status: Mapped[TableSessionStatus] = mapped_column(
        Enum(
            TableSessionStatus,
            name="table_session_status",
            create_constraint=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        default=TableSessionStatus.ACTIVE,
    )
    session_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    client_fingerprint_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    acquired_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="table_sessions")
    waiter_user: Mapped[User | None] = relationship("User", foreign_keys=[waiter_user_id])

    __table_args__ = (
        Index("idx_table_sessions_tenant_table", "tenant_id", "table_ref"),
        Index("idx_table_sessions_status_expires", "status", "expires_at"),
        Index("idx_table_sessions_session_id", "session_id"),
    )
