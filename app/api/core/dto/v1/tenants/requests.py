from pydantic import Field, field_validator

from core.dto.v1.common import BaseDTO, EntityId, TenantStatus
from core.foundation.slug import normalize_slug_letters


class CreateTenantDTO(BaseDTO):
    name: str = Field(..., min_length=1, max_length=255, description="Tenant name")
    slug: str = Field(
        ...,
        min_length=1,
        max_length=100,
        pattern="^[a-z0-9-]+$",
        description="URL-friendly tenant identifier",
    )
    status: TenantStatus = Field(default=TenantStatus.ACTIVE, description="Tenant status")

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        return normalize_slug_letters(value).lower()


class UpdateTenantDTO(BaseDTO):
    name: str | None = Field(None, min_length=1, max_length=255, description="Tenant name")
    slug: str | None = Field(
        None,
        min_length=1,
        max_length=100,
        pattern="^[a-z0-9-]+$",
        description="URL-friendly tenant identifier",
    )
    status: TenantStatus | None = Field(None, description="Tenant status")
    active_layout_version_id: EntityId | None = Field(
        None, alias="activeLayoutVersionId", description="Active floor canvas id"
    )

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        if value is None:
            return value
        return normalize_slug_letters(value).lower()
