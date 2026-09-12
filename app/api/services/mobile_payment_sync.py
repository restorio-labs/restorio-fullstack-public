from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import KITCHEN_ORDERS_COLLECTION, ORDERS_COLLECTION
from core.models.tenant import Tenant
from core.models.transaction import Transaction
from services.payment_service import (
    MONGO_PAYMENT_STATUS_COMPLETED,
    TX_STATUS_ACCEPTED,
    TX_STATUS_PAID,
    TX_STATUS_REFUNDED,
    mongo_payment_status_from_transaction,
)
from services.table_session_service import TableSessionService

MONGO_ORDER_STATUS_NEW = "new"


def mobile_kitchen_order_id(session_id_str: str) -> str:
    compact = session_id_str.replace("-", "").upper()
    return f"M-{compact}"


def mobile_order_dict_from_transaction(transaction: Transaction) -> dict[str, Any] | None:
    order = transaction.order
    if not isinstance(order, dict):
        return None
    items = order.get("items")
    if not isinstance(items, list):
        items = []
    note: str | None
    raw_note = order.get("note")
    if isinstance(raw_note, str):
        note = raw_note
    elif transaction.note:
        note = transaction.note
    else:
        note = None
    inv = order.get("invoiceData")
    inv_dict = inv if isinstance(inv, dict) else None
    return {
        "_id": str(transaction.session_id),
        "tableRef": order.get("tableRef"),
        "tableNumber": order.get("tableNumber"),
        "items": items,
        "totalAmount": transaction.amount,
        "note": note,
        "invoiceData": inv_dict,
    }


def build_mobile_kitchen_order_document(
    mobile_order: dict[str, Any],
    *,
    restaurant_public_id: str,
    session_id_str: str,
    now: datetime,
) -> dict[str, Any]:
    kitchen_order: dict[str, Any] = {
        "_id": mobile_kitchen_order_id(session_id_str),
        "restaurantId": restaurant_public_id,
        "tableId": mobile_order.get("tableRef"),
        "sessionId": session_id_str,
        "items": [
            {
                "id": f"item-{i}",
                "menuItemId": "",
                "name": item.get("name", ""),
                "quantity": item.get("quantity", 1),
                "basePrice": float(item.get("unitPrice", 0)),
                "selectedModifiers": [],
                "totalPrice": float(item.get("unitPrice", 0)) * item.get("quantity", 1),
            }
            for i, item in enumerate(mobile_order.get("items", []))
        ],
        "status": MONGO_ORDER_STATUS_NEW,
        "paymentStatus": MONGO_PAYMENT_STATUS_COMPLETED,
        "subtotal": mobile_order.get("totalAmount", 0) / 100,
        "tax": 0,
        "total": mobile_order.get("totalAmount", 0) / 100,
        "table": f"Stolik {mobile_order.get('tableNumber', '?')}",
        "time": now.strftime("%H:%M"),
        "notes": mobile_order.get("note"),
        "rejectionReason": None,
        "createdAt": now,
        "updatedAt": now,
        "source": "mobile",
        "mobileOrderId": str(mobile_order.get("_id")),
    }
    inv = mobile_order.get("invoiceData")
    if isinstance(inv, dict) and inv:
        kitchen_order["invoiceData"] = inv
    return kitchen_order


async def apply_mobile_payment_mongo_and_session_effects(
    db: AsyncIOMotorDatabase,
    pg_session: AsyncSession,
    table_session_service: TableSessionService,
    *,
    tenant: Tenant,
    transaction: Transaction,
    session_id_str: str,
) -> None:
    now = datetime.now(UTC)
    payment_status = mongo_payment_status_from_transaction(transaction.status)
    mobile_order = await db[ORDERS_COLLECTION].find_one({"sessionId": session_id_str})

    await db[ORDERS_COLLECTION].update_one(
        {"sessionId": session_id_str},
        {"$set": {"paymentStatus": payment_status, "updatedAt": now}},
    )

    if transaction.status in (TX_STATUS_PAID, TX_STATUS_ACCEPTED):
        payload = mobile_order
        if payload is None:
            payload = mobile_order_dict_from_transaction(transaction)
        if payload is not None:
            kitchen_order = build_mobile_kitchen_order_document(
                payload,
                restaurant_public_id=tenant.public_id,
                session_id_str=session_id_str,
                now=now,
            )
            try:
                await db[KITCHEN_ORDERS_COLLECTION].insert_one(kitchen_order)
            except DuplicateKeyError:
                pass

        await table_session_service.mark_completed_by_session_id(
            pg_session,
            session_id=session_id_str,
        )

    if transaction.status == TX_STATUS_REFUNDED:
        await table_session_service.mark_completed_by_session_id(
            pg_session,
            session_id=session_id_str,
        )
