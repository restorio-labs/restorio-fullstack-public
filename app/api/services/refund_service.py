import logging
from typing import Any

logger = logging.getLogger(__name__)


class RefundService:
    async def process_refund(
        self,
        order_id: str,
        amount: float,
        reason: str,
    ) -> dict[str, Any]:
        logger.info(
            "Refund requested: order=%s amount=%.2f reason=%s",
            order_id,
            amount,
            reason,
        )
        return {
            "orderId": order_id,
            "amount": amount,
            "reason": reason,
            "status": "pending",
        }
