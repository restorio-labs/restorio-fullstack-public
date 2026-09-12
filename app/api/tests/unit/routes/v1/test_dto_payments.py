from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from pydantic import ValidationError
import pytest

from core.dto.v1.common import PaymentProvider, PaymentStatus
from core.dto.v1.payments import CreatePaymentDTO, PaymentResponseDTO, UpdatePaymentDTO


class TestCreatePaymentDTO:
    def test_valid_creation(self) -> None:
        order_id = uuid4()
        dto = CreatePaymentDTO(
            order_id=order_id,
            provider=PaymentProvider.PRZELEWY24,
            amount=Decimal("50.00"),
        )
        assert dto.order_id == order_id
        assert dto.provider == PaymentProvider.PRZELEWY24
        assert dto.amount == Decimal("50.00")
        assert dto.external_reference is None

    def test_with_external_reference(self) -> None:
        order_id = uuid4()
        dto = CreatePaymentDTO(
            order_id=order_id,
            provider=PaymentProvider.CASH,
            amount=Decimal("25.50"),
            external_reference="EXT-12345",
        )
        assert dto.external_reference == "EXT-12345"

    def test_negative_amount(self) -> None:
        order_id = uuid4()
        with pytest.raises(ValidationError):
            CreatePaymentDTO(
                order_id=order_id,
                provider=PaymentProvider.TERMINAL,
                amount=Decimal("-10.00"),
            )


class TestUpdatePaymentDTO:
    def test_update_status_only(self) -> None:
        dto = UpdatePaymentDTO(status=PaymentStatus.COMPLETED)
        assert dto.status == PaymentStatus.COMPLETED
        assert dto.external_reference is None

    def test_update_external_reference_only(self) -> None:
        dto = UpdatePaymentDTO(external_reference="REF-999")
        assert dto.status is None
        assert dto.external_reference == "REF-999"

    def test_full_update(self) -> None:
        dto = UpdatePaymentDTO(
            status=PaymentStatus.COMPLETED,
            external_reference="REF-123",
        )
        assert dto.status == PaymentStatus.COMPLETED
        assert dto.external_reference == "REF-123"


class TestPaymentResponseDTO:
    def test_valid_response(self) -> None:
        payment_id = uuid4()
        order_id = uuid4()
        now = datetime.now(UTC)

        dto = PaymentResponseDTO(
            id=payment_id,
            order_id=order_id,
            provider=PaymentProvider.PRZELEWY24,
            status=PaymentStatus.PENDING,
            amount=Decimal("100.00"),
            external_reference=None,
            created_at=now,
            updated_at=now,
        )

        assert dto.id == payment_id
        assert dto.order_id == order_id
        assert dto.provider == PaymentProvider.PRZELEWY24
        assert dto.status == PaymentStatus.PENDING
        assert dto.amount == Decimal("100.00")
        assert dto.external_reference is None

    def test_with_external_reference(self) -> None:
        payment_id = uuid4()
        order_id = uuid4()
        now = datetime.now(UTC)

        dto = PaymentResponseDTO(
            id=payment_id,
            order_id=order_id,
            provider=PaymentProvider.TERMINAL,
            status=PaymentStatus.COMPLETED,
            amount=Decimal("75.50"),
            external_reference="TERM-456",
            created_at=now,
            updated_at=now,
        )

        assert dto.external_reference == "TERM-456"
