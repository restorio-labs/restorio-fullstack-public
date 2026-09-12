from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from motor.motor_asyncio import AsyncIOMotorDatabase

from core.constants import KITCHEN_ORDERS_COLLECTION
from core.exceptions import BadRequestError, NotFoundResponse

INVALID_ORDER_STATUS_TRANSITION_CODE = "INVALID_ORDER_STATUS_TRANSITION"
KITCHEN_TERMINAL_BOARD_STATUSES = frozenset({"rejected", "cancelled", "refunded"})
KITCHEN_TERMINAL_BOARD_VISIBILITY_HOURS = 24

_VALID_TRANSITIONS: dict[str, set[str]] = {
    "new": {"preparing", "rejected"},
    "preparing": {"ready_to_serve", "rejected"},
    "ready_to_serve": {"delivered", "paid"},
    "delivered": {"paid"},
    "ready": set(),
    "rejected": {"refunded", "new"},
    "refunded": set(),
    "paid": set(),
}


class OrderService:
    async def list_orders(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        status: str | None = None,
        timezone_name: str | None = None,
    ) -> list[dict[str, Any]]:
        query = _build_list_orders_query(restaurant_id, status=status)

        cursor = db[KITCHEN_ORDERS_COLLECTION].find(query).sort("createdAt", -1)
        orders = await cursor.to_list(length=500)
        return [_serialize_order(o, timezone_name=timezone_name) for o in orders]

    async def get_order(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        order_id: str,
        timezone_name: str | None = None,
    ) -> dict[str, Any]:
        doc = await db[KITCHEN_ORDERS_COLLECTION].find_one(
            {"_id": order_id, "restaurantId": restaurant_id}
        )
        if not doc:
            msg = "Order"
            raise NotFoundResponse(msg, order_id)
        return _serialize_order(doc, timezone_name=timezone_name)

    async def create_order(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        data: dict[str, Any],
        timezone_name: str | None = None,
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        order_id = data.get("id") or f"K-{uuid4().hex[:6].upper()}"
        timezone = _resolve_timezone(timezone_name)

        doc: dict[str, Any] = {
            "_id": order_id,
            "restaurantId": restaurant_id,
            "tableId": data.get("tableId"),
            "sessionId": data.get("sessionId", ""),
            "items": data.get("items", []),
            "status": "new",
            "paymentStatus": data.get("paymentStatus", "pending"),
            "subtotal": data.get("subtotal", 0),
            "tax": data.get("tax", 0),
            "total": data.get("total", 0),
            "table": data.get("table", ""),
            "time": data.get("time", now.astimezone(timezone).strftime("%H:%M")),
            "notes": data.get("notes"),
            "rejectionReason": None,
            "createdAt": now,
            "updatedAt": now,
        }
        inv = data.get("invoiceData")
        if isinstance(inv, dict) and inv:
            doc["invoiceData"] = inv

        await db[KITCHEN_ORDERS_COLLECTION].insert_one(doc)
        return _serialize_order(doc, timezone_name=timezone_name)

    async def update_order(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        order_id: str,
        data: dict[str, Any],
        timezone_name: str | None = None,
    ) -> dict[str, Any]:
        doc = await db[KITCHEN_ORDERS_COLLECTION].find_one(
            {"_id": order_id, "restaurantId": restaurant_id}
        )
        if not doc:
            msg = "Order"
            raise NotFoundResponse(msg, order_id)

        update: dict[str, Any] = {"updatedAt": datetime.now(UTC)}

        if "items" in data:
            items = data["items"]
            if isinstance(items, list):
                update["items"] = [
                    {
                        "id": item.get("id", ""),
                        "menuItemId": item.get("menuItemId", item.get("menu_item_id", "")),
                        "name": item.get("name", ""),
                        "quantity": item.get("quantity", 1),
                        "basePrice": float(item.get("basePrice", item.get("base_price", 0))),
                        "selectedModifiers": item.get(
                            "selectedModifiers", item.get("selected_modifiers", [])
                        ),
                        "totalPrice": float(item.get("totalPrice", item.get("total_price", 0))),
                    }
                    for item in items
                ]
        if "notes" in data:
            update["notes"] = data["notes"]
        if "invoiceData" in data:
            update["invoiceData"] = data["invoiceData"]
        if "total" in data:
            update["total"] = float(data["total"])
        if "subtotal" in data:
            update["subtotal"] = float(data["subtotal"])
        if "table" in data:
            update["table"] = data["table"]
        if data.get("status"):
            update["status"] = data["status"]

        await db[KITCHEN_ORDERS_COLLECTION].update_one(
            {"_id": order_id},
            {"$set": update},
        )

        updated = await db[KITCHEN_ORDERS_COLLECTION].find_one({"_id": order_id})
        return _serialize_order(updated, timezone_name=timezone_name)

    async def update_status(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        order_id: str,
        new_status: str,
        rejection_reason: str | None = None,
        timezone_name: str | None = None,
    ) -> dict[str, Any]:
        doc = await db[KITCHEN_ORDERS_COLLECTION].find_one(
            {"_id": order_id, "restaurantId": restaurant_id}
        )
        if not doc:
            msg = "Order"
            raise NotFoundResponse(msg, order_id)

        current = doc["status"]
        allowed = _VALID_TRANSITIONS.get(current, set())
        if new_status not in allowed:
            msg = f"Cannot transition from '{current}' to '{new_status}'"
            raise BadRequestError(
                msg,
                details={
                    "code": INVALID_ORDER_STATUS_TRANSITION_CODE,
                    "current": current,
                    "new_status": new_status,
                },
            )

        if new_status == "rejected" and not rejection_reason:
            msg = "Rejection reason is required"
            raise BadRequestError(msg)

        update: dict[str, Any] = {
            "status": new_status,
            "updatedAt": datetime.now(UTC),
        }
        if rejection_reason:
            update["rejectionReason"] = rejection_reason

        await db[KITCHEN_ORDERS_COLLECTION].update_one(
            {"_id": order_id},
            {"$set": update},
        )

        updated = await db[KITCHEN_ORDERS_COLLECTION].find_one({"_id": order_id})
        return _serialize_order(updated, timezone_name=timezone_name)

    async def delete_order(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        order_id: str,
        timezone_name: str | None = None,
    ) -> dict[str, Any]:
        doc = await db[KITCHEN_ORDERS_COLLECTION].find_one(
            {"_id": order_id, "restaurantId": restaurant_id}
        )
        if not doc:
            msg = "Order"
            raise NotFoundResponse(msg, order_id)

        await db[KITCHEN_ORDERS_COLLECTION].delete_one({"_id": order_id})
        return _serialize_order(doc, timezone_name=timezone_name)

    async def get_order_for_archive(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        order_id: str,
    ) -> dict[str, Any]:
        doc = await db[KITCHEN_ORDERS_COLLECTION].find_one(
            {"_id": order_id, "restaurantId": restaurant_id}
        )
        if not doc:
            msg = "Order"
            raise NotFoundResponse(msg, order_id)

        if doc["status"] not in (
            "ready",
            "ready_to_serve",
            "delivered",
            "paid",
            "refunded",
            "rejected",
        ):
            msg = (
                "Only orders with status 'ready', 'ready_to_serve', 'delivered', 'paid', 'refunded' or 'rejected' "
                "can be archived"
            )
            raise BadRequestError(msg)
        return doc


def _build_list_orders_query(restaurant_id: str, *, status: str | None = None) -> dict[str, Any]:
    cutoff = datetime.now(UTC) - timedelta(hours=KITCHEN_TERMINAL_BOARD_VISIBILITY_HOURS)

    if status is not None:
        query: dict[str, Any] = {"restaurantId": restaurant_id, "status": status}
        if status in KITCHEN_TERMINAL_BOARD_STATUSES:
            query["updatedAt"] = {"$gte": cutoff}
        return query

    return {
        "restaurantId": restaurant_id,
        "$or": [
            {"status": {"$nin": list(KITCHEN_TERMINAL_BOARD_STATUSES)}},
            {
                "status": {"$in": list(KITCHEN_TERMINAL_BOARD_STATUSES)},
                "updatedAt": {"$gte": cutoff},
            },
        ],
    }


def _resolve_timezone(timezone_name: str | None) -> ZoneInfo:
    if timezone_name is None or timezone_name.strip() == "":
        return ZoneInfo("UTC")

    try:
        return ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError:
        return ZoneInfo("UTC")


def _serialize_order(doc: dict[str, Any], *, timezone_name: str | None = None) -> dict[str, Any]:
    result: dict[str, Any] = {
        "id": doc["_id"],
        "restaurantId": doc.get("restaurantId", ""),
        "tableId": doc.get("tableId"),
        "sessionId": doc.get("sessionId", ""),
        "items": doc.get("items", []),
        "status": doc.get("status", "new"),
        "paymentStatus": doc.get("paymentStatus", "pending"),
        "subtotal": doc.get("subtotal", 0),
        "tax": doc.get("tax", 0),
        "total": doc.get("total", 0),
        "table": doc.get("table", ""),
        "time": doc.get("time", ""),
        "notes": doc.get("notes"),
        "rejectionReason": doc.get("rejectionReason"),
        "createdAt": _to_iso(doc.get("createdAt"), timezone_name=timezone_name),
        "updatedAt": _to_iso(doc.get("updatedAt"), timezone_name=timezone_name),
    }
    inv = doc.get("invoiceData")
    if inv is not None:
        result["invoiceData"] = inv
    return result


def _to_iso(value: Any, *, timezone_name: str | None = None) -> str:
    timezone = _resolve_timezone(timezone_name)

    if isinstance(value, datetime):
        aware_value = value if value.tzinfo is not None else value.replace(tzinfo=UTC)
        return aware_value.astimezone(timezone).isoformat()
    if value is None:
        return datetime.now(UTC).astimezone(timezone).isoformat()
    return str(value)
