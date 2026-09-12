from datetime import datetime

from pydantic import Field

from core.dto.v1.common import BaseDTO, EntityId, TenantStatus
from core.dto.v1.floor_canvases import FloorCanvasResponseDTO


class TenantResponseDTO(BaseDTO):
    id: str = Field(..., description="Public tenant identifier")
    name: str = Field(..., description="Tenant name")
    slug: str = Field(..., description="URL-friendly tenant identifier")
    status: TenantStatus = Field(..., description="Tenant status")
    active_layout_version_id: EntityId | None = Field(
        None, alias="activeLayoutVersionId", serialization_alias="activeLayoutVersionId"
    )
    floor_canvases: list[FloorCanvasResponseDTO] = Field(
        default_factory=list,
        alias="floorCanvases",
        serialization_alias="floorCanvases",
    )
    created_at: datetime = Field(
        ...,
        alias="createdAt",
        serialization_alias="createdAt",
        description="Timestamp when tenant was created",
    )


class TenantSummaryResponseDTO(BaseDTO):
    id: str = Field(..., description="Public tenant identifier")
    name: str = Field(..., description="Tenant name")
    slug: str = Field(..., description="URL-friendly tenant identifier")
    status: TenantStatus = Field(..., description="Tenant status")
    active_layout_version_id: EntityId | None = Field(
        None, alias="activeLayoutVersionId", serialization_alias="activeLayoutVersionId"
    )
    floor_canvas_count: int = Field(
        ..., alias="floorCanvasCount", serialization_alias="floorCanvasCount"
    )
    created_at: datetime = Field(
        ...,
        alias="createdAt",
        serialization_alias="createdAt",
        description="Timestamp when tenant was created",
    )
