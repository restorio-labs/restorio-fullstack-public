from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest

from core.exceptions import BadRequestError, NotFoundResponse
from services.order_service import (
    INVALID_ORDER_STATUS_TRANSITION_CODE,
    KITCHEN_TERMINAL_BOARD_STATUSES,
    KITCHEN_TERMINAL_BOARD_VISIBILITY_HOURS,
    OrderService,
    _build_list_orders_query,
    _resolve_timezone,
    _serialize_order,
    _to_iso,
)


def test_to_iso_converts_utc_datetime_to_requested_timezone() -> None:
    value = datetime(2026, 4, 7, 19, 55, 30, 835000, tzinfo=UTC)

    result = _to_iso(value, timezone_name="Europe/Warsaw")

    assert result == "2026-04-07T21:55:30.835000+02:00"


def test_to_iso_uses_string_for_non_datetime_values() -> None:
    assert "plain" in _to_iso("plain", timezone_name="UTC")


def test_to_iso_none_uses_now() -> None:
    out = _to_iso(None, timezone_name="UTC")
    assert "T" in out


def test_to_iso_falls_back_to_utc_for_invalid_timezone() -> None:
    value = datetime(2026, 4, 7, 19, 55, 30, 835000, tzinfo=UTC)

    result = _to_iso(value, timezone_name="Mars/Olympus")

    assert result == "2026-04-07T19:55:30.835000+00:00"


def test_resolve_timezone_defaults_to_utc() -> None:
    timezone = _resolve_timezone(None)

    assert timezone.key == "UTC"


def _mongo_orders_coll() -> MagicMock:
    return MagicMock()


def _db_with_coll(coll: MagicMock) -> MagicMock:
    db = MagicMock()
    db.__getitem__.return_value = coll
    return db


@pytest.mark.asyncio
async def test_list_orders_applies_filter_and_sort() -> None:
    coll = _mongo_orders_coll()
    cursor = MagicMock()
    cursor.sort.return_value = cursor
    cursor.to_list = AsyncMock(
        return_value=[
            {
                "_id": "K-1",
                "restaurantId": "r1",
                "status": "new",
                "createdAt": datetime.now(UTC),
                "updatedAt": datetime.now(UTC),
            }
        ]
    )
    coll.find = MagicMock(return_value=cursor)
    db = _db_with_coll(coll)

    svc = OrderService()
    result = await svc.list_orders(db, "r1", status="new")

    assert len(result) == 1
    assert result[0]["id"] == "K-1"
    coll.find.assert_called_once_with({"restaurantId": "r1", "status": "new"})


def test_build_list_orders_query_excludes_old_terminal_orders() -> None:
    query = _build_list_orders_query("r1")

    assert query["restaurantId"] == "r1"
    assert "$or" in query
    assert query["$or"][0]["status"]["$nin"] == list(KITCHEN_TERMINAL_BOARD_STATUSES)
    terminal_clause = query["$or"][1]
    assert terminal_clause["status"]["$in"] == list(KITCHEN_TERMINAL_BOARD_STATUSES)
    cutoff = terminal_clause["updatedAt"]["$gte"]
    assert datetime.now(UTC) - cutoff <= timedelta(hours=KITCHEN_TERMINAL_BOARD_VISIBILITY_HOURS + 1)


def test_build_list_orders_query_limits_rejected_status_by_updated_at() -> None:
    query = _build_list_orders_query("r1", status="rejected")

    assert query["status"] == "rejected"
    assert "updatedAt" in query
    assert "$or" not in query


def test_build_list_orders_query_keeps_active_status_filter_simple() -> None:
    query = _build_list_orders_query("r1", status="new")

    assert query == {"restaurantId": "r1", "status": "new"}


@pytest.mark.asyncio
async def test_get_order_raises_not_found() -> None:
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(return_value=None)
    db = _db_with_coll(coll)

    svc = OrderService()
    with pytest.raises(NotFoundResponse):
        await svc.get_order(db, "r1", "missing")


@pytest.mark.asyncio
async def test_get_order_returns_serialized() -> None:
    doc = {
        "_id": "K-1",
        "restaurantId": "r1",
        "createdAt": datetime.now(UTC),
        "updatedAt": datetime.now(UTC),
    }
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(return_value=doc)
    db = _db_with_coll(coll)

    svc = OrderService()
    result = await svc.get_order(db, "r1", "K-1")

    assert result["id"] == "K-1"


@pytest.mark.asyncio
async def test_create_order_inserts_and_returns() -> None:
    coll = _mongo_orders_coll()
    coll.insert_one = AsyncMock()
    db = _db_with_coll(coll)

    svc = OrderService()
    result = await svc.create_order(
        db,
        "r1",
        {"tableId": "t1", "items": [{"name": "Soup"}]},
    )

    assert result["restaurantId"] == "r1"
    assert result["status"] == "new"
    coll.insert_one.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_order_not_found() -> None:
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(return_value=None)
    db = _db_with_coll(coll)
    with pytest.raises(NotFoundResponse):
        await OrderService().update_order(db, "r1", "K-1", {})


@pytest.mark.asyncio
async def test_delete_order_not_found() -> None:
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(return_value=None)
    db = _db_with_coll(coll)
    with pytest.raises(NotFoundResponse):
        await OrderService().delete_order(db, "r1", "K-1")


@pytest.mark.asyncio
async def test_get_order_for_archive_not_found() -> None:
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(return_value=None)
    db = _db_with_coll(coll)
    with pytest.raises(NotFoundResponse):
        await OrderService().get_order_for_archive(db, "r1", "K-1")


@pytest.mark.asyncio
async def test_update_order_maps_items_and_totals() -> None:
    existing = {
        "_id": "K-1",
        "restaurantId": "r1",
        "status": "new",
        "createdAt": datetime.now(UTC),
        "updatedAt": datetime.now(UTC),
    }
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(side_effect=[existing, {**existing, "total": 20.0}])
    coll.update_one = AsyncMock()
    db = _db_with_coll(coll)

    svc = OrderService()
    await svc.update_order(
        db,
        "r1",
        "K-1",
        {
            "items": [
                {
                    "menuItemId": "m1",
                    "name": "Beer",
                    "quantity": 2,
                    "basePrice": 5,
                    "totalPrice": 10,
                }
            ],
            "total": 20,
            "subtotal": 18,
            "table": "T5",
            "notes": "extra lime",
        },
    )

    coll.update_one.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_order_sets_status_when_present() -> None:
    existing = {
        "_id": "K-1",
        "restaurantId": "r1",
        "status": "new",
        "createdAt": datetime.now(UTC),
        "updatedAt": datetime.now(UTC),
    }
    after = {**existing, "status": "preparing"}
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(side_effect=[existing, after])
    coll.update_one = AsyncMock()
    db = _db_with_coll(coll)
    await OrderService().update_order(db, "r1", "K-1", {"status": "preparing"})
    call = coll.update_one.await_args
    assert call[0][1]["$set"]["status"] == "preparing"


@pytest.mark.asyncio
async def test_update_status_not_found() -> None:
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(return_value=None)
    db = _db_with_coll(coll)
    with pytest.raises(NotFoundResponse):
        await OrderService().update_status(db, "r1", "K-1", "preparing")


@pytest.mark.asyncio
async def test_update_status_invalid_transition() -> None:
    doc = {
        "_id": "K-1",
        "restaurantId": "r1",
        "status": "new",
        "createdAt": datetime.now(UTC),
        "updatedAt": datetime.now(UTC),
    }
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(return_value=doc)
    db = _db_with_coll(coll)

    svc = OrderService()
    with pytest.raises(BadRequestError) as exc:
        await svc.update_status(db, "r1", "K-1", "paid")

    assert exc.value.details["code"] == INVALID_ORDER_STATUS_TRANSITION_CODE


@pytest.mark.asyncio
async def test_update_status_rejected_with_reason_sets_field() -> None:
    doc = {
        "_id": "K-1",
        "restaurantId": "r1",
        "status": "new",
        "createdAt": datetime.now(UTC),
        "updatedAt": datetime.now(UTC),
    }
    out_doc = {**doc, "status": "rejected", "rejectionReason": "bad"}
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(side_effect=[doc, out_doc])
    coll.update_one = AsyncMock()
    db = _db_with_coll(coll)
    result = await OrderService().update_status(
        db, "r1", "K-1", "rejected", rejection_reason="No stock"
    )
    assert result["status"] == "rejected"
    set_arg = coll.update_one.await_args[0][1]["$set"]
    assert set_arg["rejectionReason"] == "No stock"


@pytest.mark.asyncio
async def test_update_status_rejected_requires_reason() -> None:
    doc = {
        "_id": "K-1",
        "restaurantId": "r1",
        "status": "new",
        "createdAt": datetime.now(UTC),
        "updatedAt": datetime.now(UTC),
    }
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(return_value=doc)
    db = _db_with_coll(coll)

    svc = OrderService()
    with pytest.raises(BadRequestError, match="Rejection reason"):
        await svc.update_status(db, "r1", "K-1", "rejected", rejection_reason=None)


@pytest.mark.asyncio
async def test_update_status_valid_transition() -> None:
    doc = {
        "_id": "K-1",
        "restaurantId": "r1",
        "status": "new",
        "createdAt": datetime.now(UTC),
        "updatedAt": datetime.now(UTC),
    }
    updated = {**doc, "status": "preparing"}
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(side_effect=[doc, updated])
    coll.update_one = AsyncMock()
    db = _db_with_coll(coll)

    svc = OrderService()
    result = await svc.update_status(db, "r1", "K-1", "preparing")

    assert result["status"] == "preparing"


@pytest.mark.asyncio
async def test_delete_order_removes_and_returns_snapshot() -> None:
    doc = {
        "_id": "K-1",
        "restaurantId": "r1",
        "status": "paid",
        "createdAt": datetime.now(UTC),
        "updatedAt": datetime.now(UTC),
    }
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(return_value=doc)
    coll.delete_one = AsyncMock()
    db = _db_with_coll(coll)

    svc = OrderService()
    result = await svc.delete_order(db, "r1", "K-1")

    assert result["id"] == "K-1"
    coll.delete_one.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_order_for_archive_rejects_wrong_status() -> None:
    doc = {
        "_id": "K-1",
        "restaurantId": "r1",
        "status": "new",
    }
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(return_value=doc)
    db = _db_with_coll(coll)

    svc = OrderService()
    with pytest.raises(BadRequestError, match="archived"):
        await svc.get_order_for_archive(db, "r1", "K-1")


@pytest.mark.asyncio
async def test_get_order_for_archive_returns_doc_when_terminal() -> None:
    doc = {"_id": "K-1", "restaurantId": "r1", "status": "paid"}
    coll = _mongo_orders_coll()
    coll.find_one = AsyncMock(return_value=doc)
    db = _db_with_coll(coll)

    svc = OrderService()
    out = await svc.get_order_for_archive(db, "r1", "K-1")

    assert out["status"] == "paid"


def test_serialize_order_uses_now_when_timestamps_missing() -> None:
    doc = {"_id": "x", "restaurantId": "r"}
    out = _serialize_order(doc)
    assert "createdAt" in out
    assert "T" in out["createdAt"]
