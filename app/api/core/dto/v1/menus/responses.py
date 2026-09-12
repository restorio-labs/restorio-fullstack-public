from datetime import datetime

from pydantic import Field

from core.dto.v1.common import BaseDTO


class MenuItemDTO(BaseDTO):
    name: str = Field(..., description="Menu item name")
    price: float = Field(..., description="Menu item price")
    promoted: bool = Field(..., description="Promotion flag")
    is_available: bool = Field(
        default=True, alias="isAvailable", description="Whether item is available"
    )
    desc: str = Field(..., description="Menu item description")
    tags: list[str] = Field(default_factory=list, description="Menu item tags")
    image_url: str | None = Field(
        default=None, alias="imageUrl", description="Public image URL when set"
    )


class MenuCategoryDTO(BaseDTO):
    name: str = Field(..., description="Category name")
    order: int = Field(..., description="Category display order")
    items: list[MenuItemDTO] = Field(default_factory=list, description="Category items")


class TenantMenuResponseDTO(BaseDTO):
    menu: dict[str, dict] = Field(..., description="Raw menu payload stored in MongoDB")
    categories: list[MenuCategoryDTO] = Field(
        default_factory=list, description="Normalized category view"
    )
    updated_at: datetime | None = Field(None, alias="updatedAt", serialization_alias="updatedAt")
