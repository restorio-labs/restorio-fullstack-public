from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from pydantic import ValidationError
import pytest

from core.dto.v1.common import OrderStatus
from core.dto.v1.orders import (
    CreateOrderDTO,
    CreateOrderItemDTO,
    OrderItemResponseDTO,
    OrderResponseDTO,
    UpdateOrderDTO,
)


class TestCreateOrderItemDTO:
    QUANTITY = 2

    def test_valid_creation(self) -> None:
        dto = CreateOrderItemDTO(
            product_id="prod-123",
            name="Burger",
            quantity=2,
            unit_price=Decimal("15.99"),
        )
        assert dto.product_id == "prod-123"
        assert dto.name == "Burger"
        assert dto.quantity == self.QUANTITY
        assert dto.unit_price == Decimal("15.99")
        assert dto.modifiers == []

    def test_with_modifiers(self) -> None:
        dto = CreateOrderItemDTO(
            product_id="prod-123",
            name="Burger",
            quantity=2,
            unit_price=Decimal("15.99"),
            modifiers=["mod-1", "mod-2"],
        )
        assert dto.modifiers == ["mod-1", "mod-2"]

    def test_invalid_quantity_zero(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            CreateOrderItemDTO(
                product_id="prod-123",
                name="Burger",
                quantity=0,
                unit_price=Decimal("15.99"),
            )
        errors = exc_info.value.errors()
        assert any("quantity" in str(err) for err in errors)

    def test_invalid_quantity_negative(self) -> None:
        with pytest.raises(ValidationError):
            CreateOrderItemDTO(
                product_id="prod-123",
                name="Burger",
                quantity=-1,
                unit_price=Decimal("15.99"),
            )


class TestCreateOrderDTO:
    ITEMS_COUNT = 2

    def test_valid_creation(self) -> None:
        table_id = "table-123"
        dto = CreateOrderDTO(
            table_id=table_id,
            items=[
                CreateOrderItemDTO(
                    product_id="prod-1", name="Pizza", quantity=1, unit_price=Decimal("25.50")
                ),
                CreateOrderItemDTO(
                    product_id="prod-2", name="Burger", quantity=2, unit_price=Decimal("15.99")
                ),
            ],
        )
        assert dto.table_id == table_id
        assert len(dto.items) == self.ITEMS_COUNT

    def test_empty_items_list_is_allowed(self) -> None:
        table_id = "table-123"
        dto = CreateOrderDTO(
            table_id=table_id,
            items=[],
        )
        assert dto.table_id == table_id
        assert dto.items == []


class TestUpdateOrderDTO:
    def test_partial_update_status(self) -> None:
        dto = UpdateOrderDTO(status=OrderStatus.PAID)
        assert dto.status == OrderStatus.PAID
        assert dto.total_amount is None
        assert dto.currency is None

    def test_partial_update_amount(self) -> None:
        dto = UpdateOrderDTO(total_amount=Decimal("99.99"))
        assert dto.total_amount == Decimal("99.99")
        assert dto.status is None

    def test_full_update(self) -> None:
        dto = UpdateOrderDTO(
            status=OrderStatus.PAID,
            total_amount=Decimal("150.50"),
            currency="EUR",
        )
        assert dto.status == OrderStatus.PAID
        assert dto.total_amount == Decimal("150.50")
        assert dto.currency == "EUR"

    def test_negative_amount(self) -> None:
        with pytest.raises(ValidationError):
            UpdateOrderDTO(total_amount=Decimal("-10.00"))


class TestOrderItemResponseDTO:
    QUANTITY = 2

    def test_valid_response(self) -> None:
        item_id = uuid4()
        dto = OrderItemResponseDTO(
            id=item_id,
            product_id="prod-123",
            name="Burger",
            quantity=2,
            unit_price=Decimal("15.99"),
        )
        assert dto.id == item_id
        assert dto.product_id == "prod-123"
        assert dto.name == "Burger"
        assert dto.quantity == self.QUANTITY
        assert dto.unit_price == Decimal("15.99")

    def test_modifiers_property(self) -> None:
        item_id = uuid4()
        dto = OrderItemResponseDTO(
            id=item_id,
            product_id="prod-123",
            name="Burger",
            quantity=1,
            unit_price=Decimal("15.99"),
            selectedModifiers=["extra-cheese", "no-onions"],
        )
        assert dto.modifiers == ["extra-cheese", "no-onions"]
        assert dto.selected_modifiers == dto.modifiers

    def test_modifiers_property_empty(self) -> None:
        item_id = uuid4()
        dto = OrderItemResponseDTO(
            id=item_id,
            product_id="prod-123",
            name="Burger",
            quantity=1,
            unit_price=Decimal("15.99"),
        )
        assert dto.modifiers == []


class TestOrderResponseDTO:
    def test_valid_response_without_items(self) -> None:
        order_id = uuid4()
        tenant_id = uuid4()
        table_id = uuid4()
        now = datetime.now(UTC)

        dto = OrderResponseDTO(
            id=order_id,
            tenant_id=tenant_id,
            table_id=table_id,
            status=OrderStatus.PLACED,
            total_amount=Decimal("25.50"),
            currency="PLN",
            created_at=now,
            updated_at=now,
        )

        assert dto.id == order_id
        assert dto.tenant_id == tenant_id
        assert dto.table_id == table_id
        assert dto.status == OrderStatus.PLACED
        assert dto.total_amount == Decimal("25.50")
        assert dto.currency == "PLN"
        assert dto.items == []

    def test_valid_response_with_items(self) -> None:
        order_id = uuid4()
        tenant_id = uuid4()
        table_id = uuid4()
        item_id = uuid4()
        now = datetime.now(UTC)

        dto = OrderResponseDTO(
            id=order_id,
            tenant_id=tenant_id,
            table_id=table_id,
            status=OrderStatus.PLACED,
            total_amount=Decimal("25.50"),
            currency="PLN",
            created_at=now,
            updated_at=now,
            items=[
                OrderItemResponseDTO(
                    id=item_id,
                    product_id="prod-1",
                    name="Pizza",
                    quantity=1,
                    unit_price=Decimal("25.50"),
                )
            ],
        )

        assert len(dto.items) == 1
        assert dto.items[0].name == "Pizza"
