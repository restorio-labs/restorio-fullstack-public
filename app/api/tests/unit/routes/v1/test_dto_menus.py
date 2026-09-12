from pydantic import ValidationError
import pytest

from core.dto.v1.menus import (
    MenuCategoryDTO,
    MenuCategoryInputDTO,
    MenuItemDTO,
    MenuItemInputDTO,
    TenantMenuResponseDTO,
    UpsertTenantMenuDTO,
)


class TestMenuItemInputDTO:
    BURGER_PRICE = 29.99

    def test_valid_creation(self) -> None:
        dto = MenuItemInputDTO(
            name="Burger",
            price=self.BURGER_PRICE,
            promoted=True,
            desc="Classic burger",
            tags=["beef", "spicy"],
            is_available=True,
        )
        assert dto.name == "Burger"
        assert dto.price == self.BURGER_PRICE
        assert dto.promoted is True
        assert dto.desc == "Classic burger"
        assert dto.tags == ["beef", "spicy"]
        assert dto.is_available is True

    def test_optional_image_url(self) -> None:
        dto = MenuItemInputDTO(
            name="Soup",
            price=10,
            image_url="https://example.com/a.png",
            is_available=True,
        )
        assert dto.image_url == "https://example.com/a.png"


class TestMenuCategoryInputDTO:
    def test_category_requires_non_negative_order(self) -> None:
        with pytest.raises(ValidationError):
            MenuCategoryInputDTO(
                name="Mains",
                order=-1,
            )


class TestUpsertTenantMenuDTO:
    def test_nested_payload(self) -> None:
        dto = UpsertTenantMenuDTO(
            categories=[
                MenuCategoryInputDTO(
                    name="Mains",
                    order=0,
                    items=[
                        MenuItemInputDTO(
                            name="Burger",
                            price=21.5,
                            promoted=True,
                            is_available=True,
                            desc="Chef special",
                            tags=["beef"],
                        )
                    ],
                )
            ]
        )
        assert len(dto.categories) == 1
        assert dto.categories[0].items[0].name == "Burger"


class TestMenuItemDTO:
    def test_response_shape(self) -> None:
        dto = MenuItemDTO(
            name="Soup",
            price=12.5,
            promoted=False,
            is_available=True,
            desc="Tomato soup",
            tags=["vegan"],
        )
        assert dto.name == "Soup"
        assert dto.tags == ["vegan"]


class TestTenantMenuResponseDTO:
    def test_includes_aliases(self) -> None:
        payload = TenantMenuResponseDTO(
            menu={"0": {"__category": {"name": "Mains", "order": 0}}},
            categories=[MenuCategoryDTO(name="Mains", order=0, items=[])],
        )
        dumped = payload.model_dump(by_alias=True)
        assert "updatedAt" in dumped
        assert dumped["menu"]["0"]["__category"]["name"] == "Mains"
        assert len(dumped["categories"]) == 1
