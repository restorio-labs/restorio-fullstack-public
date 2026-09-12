from datetime import datetime
from typing import Literal

from pydantic import ConfigDict, Field

from core.dto.v1.common import BaseDTO, EntityId


class FloorElementBaseResponseDTO(BaseDTO):
    id: str = Field(..., description="Element identifier")
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")
    w: float = Field(..., description="Width")
    h: float = Field(..., description="Height")
    rotation: float | None = Field(None, description="Rotation in degrees")
    zone_id: str | None = Field(
        None, alias="zoneId", serialization_alias="zoneId", description="Associated zone id"
    )

    model_config = ConfigDict(populate_by_name=True)


class FloorTableElementResponseDTO(FloorElementBaseResponseDTO):
    type: Literal["table"] = "table"
    table_number: int = Field(..., alias="tableNumber", serialization_alias="tableNumber")
    seats: int = Field(...)
    label: str | None = Field(None)


class FloorTableGroupElementResponseDTO(FloorElementBaseResponseDTO):
    type: Literal["tableGroup"] = "tableGroup"
    table_numbers: list[int] = Field(..., alias="tableNumbers", serialization_alias="tableNumbers")
    seats: int = Field(...)


class FloorBarElementResponseDTO(FloorElementBaseResponseDTO):
    type: Literal["bar"] = "bar"
    label: str | None = Field(None)


class FloorZoneElementResponseDTO(FloorElementBaseResponseDTO):
    type: Literal["zone"] = "zone"
    name: str = Field(...)
    color: str | None = Field(None)


class FloorWallElementResponseDTO(FloorElementBaseResponseDTO):
    type: Literal["wall"] = "wall"


class FloorEntranceElementResponseDTO(FloorElementBaseResponseDTO):
    type: Literal["entrance"] = "entrance"
    label: str | None = Field(None)


FloorElementResponseDTO = (
    FloorTableElementResponseDTO
    | FloorTableGroupElementResponseDTO
    | FloorBarElementResponseDTO
    | FloorZoneElementResponseDTO
    | FloorWallElementResponseDTO
    | FloorEntranceElementResponseDTO
)


class FloorCanvasResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Canvas identifier")
    tenant_id: EntityId = Field(
        ..., alias="tenantId", serialization_alias="tenantId", description="Tenant identifier"
    )
    name: str = Field(..., description="Canvas name")
    width: int = Field(..., description="Canvas width in pixels")
    height: int = Field(..., description="Canvas height in pixels")
    elements: list[FloorElementResponseDTO] = Field(..., description="Floor elements")
    version: int = Field(..., description="Canvas version")
    created_at: datetime = Field(..., alias="createdAt", serialization_alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt", serialization_alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)
