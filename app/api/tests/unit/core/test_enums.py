from core.models.enums import (
    OrderStatus,
    PaymentProvider,
    PaymentStatus,
    TenantStatus,
)


class TestTenantStatus:
    def test_tenant_status_values(self) -> None:
        assert TenantStatus.ACTIVE.value == "active"
        assert TenantStatus.SUSPENDED.value == "suspended"
        assert TenantStatus.INACTIVE.value == "inactive"

    def test_tenant_status_enum_membership(self) -> None:
        assert TenantStatus.ACTIVE in TenantStatus
        assert TenantStatus.SUSPENDED in TenantStatus
        assert TenantStatus.INACTIVE in TenantStatus


class TestOrderStatus:
    def test_order_status_values(self) -> None:
        assert OrderStatus.PLACED.value == "placed"
        assert OrderStatus.PAID.value == "paid"
        assert OrderStatus.CANCELLED.value == "cancelled"

    def test_order_status_enum_membership(self) -> None:
        assert OrderStatus.PLACED in OrderStatus
        assert OrderStatus.PAID in OrderStatus
        assert OrderStatus.CANCELLED in OrderStatus


class TestPaymentProvider:
    def test_payment_provider_values(self) -> None:
        assert PaymentProvider.PRZELEWY24.value == "przelewy24"
        assert PaymentProvider.CASH.value == "cash"
        assert PaymentProvider.TERMINAL.value == "terminal"
        assert PaymentProvider.OTHER.value == "other"

    def test_payment_provider_enum_membership(self) -> None:
        assert PaymentProvider.PRZELEWY24 in PaymentProvider
        assert PaymentProvider.CASH in PaymentProvider
        assert PaymentProvider.TERMINAL in PaymentProvider
        assert PaymentProvider.OTHER in PaymentProvider


class TestPaymentStatus:
    def test_payment_status_values(self) -> None:
        assert PaymentStatus.PENDING.value == "pending"
        assert PaymentStatus.COMPLETED.value == "completed"
        assert PaymentStatus.FAILED.value == "failed"
        assert PaymentStatus.REFUNDED.value == "refunded"

    def test_payment_status_enum_membership(self) -> None:
        assert PaymentStatus.PENDING in PaymentStatus
        assert PaymentStatus.COMPLETED in PaymentStatus
        assert PaymentStatus.FAILED in PaymentStatus
        assert PaymentStatus.REFUNDED in PaymentStatus
