from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.foundation.database.database import Base

if TYPE_CHECKING:
    from core.models.tenant import Tenant


class TenantProfile(Base):
    __tablename__ = "tenant_profiles"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    nip: Mapped[str] = mapped_column(String(10), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    logo: Mapped[str | None] = mapped_column("logo_url", String(512), nullable=True)

    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)

    address_street_name: Mapped[str] = mapped_column(String(255), nullable=False)
    address_street_number: Mapped[str] = mapped_column(String(20), nullable=False)
    address_city: Mapped[str] = mapped_column(String(100), nullable=False)
    address_postal_code: Mapped[str] = mapped_column(String(10), nullable=False)
    address_country: Mapped[str] = mapped_column(String(100), nullable=False, default="Polska")

    owner_first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    owner_last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    owner_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    contact_person_first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_person_last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_person_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_person_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    social_facebook: Mapped[str | None] = mapped_column(String(512), nullable=True)
    social_instagram: Mapped[str | None] = mapped_column(String(512), nullable=True)
    social_tiktok: Mapped[str | None] = mapped_column(String(512), nullable=True)
    social_website: Mapped[str | None] = mapped_column(String(512), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="tenant_profile")
