from typing import Literal

from pydantic import Field

from core.dto.v1.common import BaseDTO


class FloorElementBaseDTO(BaseDTO):
    id: str = Field(..., description="Element identifier")
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")
    w: float = Field(..., description="Width")
    h: float = Field(..., description="Height")
    rotation: float | None = Field(None, description="Rotation in degrees")
    zone_id: str | None = Field(None, alias="zoneId", description="Associated zone id")


class FloorTableElementDTO(FloorElementBaseDTO):
    type: Literal["table"] = "table"
    table_number: int = Field(..., alias="tableNumber", description="Table display number")
    seats: int = Field(..., gt=0, description="Number of seats")
    label: str | None = Field(None, description="Table label")


class FloorTableGroupElementDTO(FloorElementBaseDTO):
    type: Literal["tableGroup"] = "tableGroup"
    table_numbers: list[int] = Field(..., alias="tableNumbers", description="Table display numbers")
    seats: int = Field(..., gt=0, description="Total seats")


class FloorBarElementDTO(FloorElementBaseDTO):
    type: Literal["bar"] = "bar"
    label: str | None = Field(None, description="Bar label")


class FloorZoneElementDTO(FloorElementBaseDTO):
    type: Literal["zone"] = "zone"
    name: str = Field(..., description="Zone name")
    color: str | None = Field(None, description="Zone color (hex)")


class FloorWallElementDTO(FloorElementBaseDTO):
    type: Literal["wall"] = "wall"


class FloorEntranceElementDTO(FloorElementBaseDTO):
    type: Literal["entrance"] = "entrance"
    label: str | None = Field(None, description="Entrance label")


FloorElementDTO = (
    FloorTableElementDTO
    | FloorTableGroupElementDTO
    | FloorBarElementDTO
    | FloorZoneElementDTO
    | FloorWallElementDTO
    | FloorEntranceElementDTO
)


class CreateFloorCanvasDTO(BaseDTO):
    name: str = Field(..., min_length=1, max_length=255, description="Canvas name")
    width: int = Field(800, gt=0, description="Canvas width in pixels")
    height: int = Field(600, gt=0, description="Canvas height in pixels")
    elements: list[FloorElementDTO] = Field(default_factory=list, description="Floor elements")


class UpdateFloorCanvasDTO(BaseDTO):
    name: str | None = Field(None, min_length=1, max_length=255, description="Canvas name")
    width: int | None = Field(None, gt=0, description="Canvas width in pixels")
    height: int | None = Field(None, gt=0, description="Canvas height in pixels")
    elements: list[FloorElementDTO] | None = Field(None, description="Floor elements")
