from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import KITCHEN_ORDERS_COLLECTION
from core.foundation.logging.logger import logger
from core.models.archived_order import ArchivedOrder
from core.models.tenant import Tenant
from services.payment_service import build_waiter_settlement_transaction


def _decimal_from(value: Any, default: Decimal = Decimal("0")) -> Decimal:
    if value is None or value == "":
        return default

    try:
        return Decimal(str(value))
    except (ArithmeticError, ValueError, TypeError):
        return default


def _sum_items_total(items: Any) -> Decimal:
    if not isinstance(items, list):
        return Decimal("0")

    total = Decimal("0")
    for item in items:
        if not isinstance(item, dict):
            continue

        item_total = item.get("totalPrice", item.get("total_price"))
        if item_total is not None:
            total += _decimal_from(item_total)
            continue

        base_price = _decimal_from(item.get("basePrice", item.get("base_price")))
        quantity = _decimal_from(item.get("quantity", 1), Decimal("1"))
        total += base_price * quantity

    return total


def _resolve_order_amounts(order_doc: dict[str, Any]) -> tuple[Decimal, Decimal, Decimal]:
    items_total = _sum_items_total(order_doc.get("items"))
    tax = _decimal_from(order_doc.get("tax"))
    subtotal = _decimal_from(order_doc.get("subtotal"))
    total = _decimal_from(order_doc.get("total"))

    if subtotal <= 0 and items_total > 0:
        subtotal = items_total

    if total <= 0:
        if subtotal > 0:
            total = subtotal + tax
        elif items_total > 0:
            subtotal = items_total
            total = items_total + tax

    return subtotal, tax, total


class ArchiveService:
    async def archive_order(
        self,
        db: AsyncIOMotorDatabase,
        session: AsyncSession,
        tenant_id: str,
        restaurant_id: str,
        order_doc: dict[str, Any],
        *,
        pg_tenant: Tenant,
    ) -> ArchivedOrder:
        created_at = order_doc.get("createdAt")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif not isinstance(created_at, datetime):
            created_at = datetime.now(UTC)

        subtotal, tax, total = _resolve_order_amounts(order_doc)

        archived = ArchivedOrder(
            original_order_id=str(order_doc["_id"]),
            tenant_id=tenant_id,
            restaurant_id=restaurant_id,
            table_id=order_doc.get("tableId"),
            table_label=order_doc.get("table", ""),
            status=order_doc.get("status", "ready"),
            payment_status=order_doc.get("paymentStatus", "completed"),
            rejection_reason=order_doc.get("rejectionReason"),
            subtotal=subtotal,
            tax=tax,
            total=total,
            currency="PLN",
            notes=order_doc.get("notes"),
            items_snapshot=order_doc.get("items", []),
            order_created_at=created_at,
            archived_at=datetime.now(UTC),
        )

        session.add(archived)
        if order_doc.get("source") != "mobile":
            waiter_tx = build_waiter_settlement_transaction(pg_tenant, order_doc)
            if waiter_tx is not None:
                session.add(waiter_tx)
        logger.info(
            "Archiving order %s for restaurant %s into archived_orders",
            order_doc["_id"],
            restaurant_id,
        )
        await session.commit()
        await session.refresh(archived)
        logger.info(
            "Archived order %s as row %s; deleting Mongo document next",
            order_doc["_id"],
            archived.id,
        )

        await db[KITCHEN_ORDERS_COLLECTION].delete_one({"_id": order_doc["_id"]})
        logger.info(
            "Deleted Mongo kitchen_order %s after archive commit",
            order_doc["_id"],
        )

        return archived
