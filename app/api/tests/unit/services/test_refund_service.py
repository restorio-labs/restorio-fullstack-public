import pytest

from services.refund_service import RefundService


@pytest.mark.asyncio
async def test_process_refund_returns_pending_payload() -> None:
    service = RefundService()
    result = await service.process_refund("order-1", 12.5, "customer request")

    assert result == {
        "orderId": "order-1",
        "amount": 12.5,
        "reason": "customer request",
        "status": "pending",
    }
