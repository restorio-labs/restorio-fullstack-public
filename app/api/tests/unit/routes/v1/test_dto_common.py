from pydantic import ValidationError
import pytest

from core.dto.v1.common import (
    BaseDTO,
    CurrencyCode,
    OrderStatus,
    PaymentProvider,
    PaymentStatus,
    TenantStatus,
)


class TestEnums:
    def test_tenant_status_values(self) -> None:
        assert TenantStatus.ACTIVE.value == "active"
        assert TenantStatus.SUSPENDED.value == "suspended"
        assert TenantStatus.INACTIVE.value == "inactive"

    def test_order_status_values(self) -> None:
        assert OrderStatus.PLACED.value == "placed"
        assert OrderStatus.PAID.value == "paid"
        assert OrderStatus.CANCELLED.value == "cancelled"

    def test_payment_provider_values(self) -> None:
        assert PaymentProvider.PRZELEWY24.value == "przelewy24"
        assert PaymentProvider.TERMINAL.value == "terminal"
        assert PaymentProvider.CASH.value == "cash"
        assert PaymentProvider.OTHER.value == "other"

    def test_payment_status_values(self) -> None:
        assert PaymentStatus.PENDING.value == "pending"
        assert PaymentStatus.COMPLETED.value == "completed"
        assert PaymentStatus.FAILED.value == "failed"
        assert PaymentStatus.REFUNDED.value == "refunded"


class TestCurrencyCode:
    def test_valid_currency_codes(self) -> None:
        class TestModel(BaseDTO):
            currency: CurrencyCode

        valid = TestModel(currency="USD")
        assert valid.currency == "USD"

        valid2 = TestModel(currency="PLN")
        assert valid2.currency == "PLN"

    def test_invalid_currency_code_too_short(self) -> None:
        class TestModel(BaseDTO):
            currency: CurrencyCode

        with pytest.raises(ValidationError) as exc_info:
            TestModel(currency="US")

        errors = exc_info.value.errors()
        assert any("at least 3 characters" in str(err) for err in errors)

    def test_invalid_currency_code_too_long(self) -> None:
        class TestModel(BaseDTO):
            currency: CurrencyCode

        with pytest.raises(ValidationError) as exc_info:
            TestModel(currency="USDD")

        errors = exc_info.value.errors()
        assert any("at most 3 characters" in str(err) for err in errors)

    def test_invalid_currency_code_lowercase(self) -> None:
        class TestModel(BaseDTO):
            currency: CurrencyCode

        with pytest.raises(ValidationError):
            TestModel(currency="usd")
