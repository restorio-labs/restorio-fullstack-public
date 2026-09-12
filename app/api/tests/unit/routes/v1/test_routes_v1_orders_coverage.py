from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest
from starlette.requests import Request

from core.dto.v1.orders import CreateOrderDTO, UpdateOrderDTO, UpdateOrderStatusDTO
from core.exceptions import BadRequestError
from core.models.enums import TenantStatus
from core.models.tenant import Tenant
from routes.v1 import orders as orders_routes


def _scope() -> dict:
    return {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [(b"x-timezone", b"Europe/Warsaw")],
    }


def _req() -> Request:
    return Request(_scope())


def _kitchen_order() -> dict:
    now = datetime.now(UTC)
    return {
        "id": "o-1",
        "restaurantId": "r1",
        "tableId": "t1",
        "sessionId": "",
        "items": [
            {
                "id": str(uuid4()),
                "menuItemId": "m1",
                "name": "A",
                "quantity": 1,
                "basePrice": "1.00",
                "totalPrice": "1.00",
            }
        ],
        "status": "pending",
        "paymentStatus": "pending",
        "subtotal": 0.0,
        "tax": 0.0,
        "total": 1.0,
        "table": "T1",
        "time": "",
        "notes": None,
        "rejectionReason": None,
        "createdAt": now,
        "updatedAt": now,
    }


@pytest.mark.asyncio
@patch.object(orders_routes.ws_manager, "broadcast", new_callable=AsyncMock)
async def test_list_orders(_bc: AsyncMock) -> None:
    svc = MagicMock()
    svc.list_orders = AsyncMock(return_value=[_kitchen_order()])
    db = MagicMock()
    r = await orders_routes.list_orders("tp1", _req(), db, svc, uuid4(), object())  # type: ignore[arg-type]
    assert "retrieved" in r.message
    svc.list_orders.assert_awaited_once()
    a = svc.list_orders.await_args
    assert a.kwargs.get("status") is None
    assert a.kwargs.get("timezone_name") == "Europe/Warsaw"


@pytest.mark.asyncio
async def test_list_archived_orders_with_since() -> None:
    n = 0
    a1 = SimpleNamespace(
        id=uuid4(),
        original_order_id="x",
        tenant_id="t",
        restaurant_id="tp",
        table_id="tb",
        table_label="L",
        status="s",
        payment_status="p",
        total=1,
        currency="PLN",
        notes=None,
        order_created_at=datetime.now(UTC),
        archived_at=datetime.now(UTC),
    )

    async def ex(_q: object) -> MagicMock:
        nonlocal n
        n += 1
        r = MagicMock()
        if n == 1:
            r.scalar_one = MagicMock(return_value=2)
        else:
            r.scalars = MagicMock(return_value=MagicMock(all=MagicMock(return_value=[a1])))
        return r

    session = MagicMock()
    session.execute = ex
    out = await orders_routes.list_archived_orders(
        "tp1", session, uuid4(), object(), page=1, page_size=10, since_hours=1
    )  # type: ignore[arg-type]
    assert out.total == 2  # noqa: PLR2004


@pytest.mark.asyncio
async def test_list_archived_orders_without_since_returns_all() -> None:
    a1 = SimpleNamespace(
        id=uuid4(),
        original_order_id="old",
        tenant_id="t",
        restaurant_id="tp",
        table_id="tb",
        table_label="L",
        status="paid",
        payment_status="completed",
        total=1,
        currency="PLN",
        notes=None,
        order_created_at=datetime.now(UTC),
        archived_at=datetime.now(UTC),
    )

    async def ex(_q: object) -> MagicMock:
        r = MagicMock()
        if not hasattr(ex, "called"):
            ex.called = True
            r.scalar_one = MagicMock(return_value=1)
        else:
            r.scalars = MagicMock(return_value=MagicMock(all=MagicMock(return_value=[a1])))
        return r

    session = MagicMock()
    session.execute = ex
    out = await orders_routes.list_archived_orders(
        "tp1", session, uuid4(), object(), page=1, page_size=10, since_hours=None
    )  # type: ignore[arg-type]
    assert out.total == 1
    assert out.items[0].original_order_id == "old"


@pytest.mark.asyncio
async def test_get_order() -> None:
    svc = MagicMock()
    svc.get_order = AsyncMock(return_value=_kitchen_order())
    db = MagicMock()
    r = await orders_routes.get_order("tp", "o-1", _req(), db, svc, uuid4(), object())  # type: ignore[arg-type]
    assert "retrieved" in r.message
    assert r.data.id == "o-1"


@pytest.mark.asyncio
@patch.object(orders_routes.ws_manager, "broadcast", new_callable=AsyncMock)
async def test_create_order_with_table_and_waiter(_bc: AsyncMock) -> None:
    tid = uuid4()
    t = Tenant(
        id=tid,
        public_id="tp1",
        name="N",
        slug="s",
        status=TenantStatus.ACTIVE,
    )
    ts = MagicMock()
    ts.get_tenant_by_public_id = AsyncMock(return_value=t)
    tss = MagicMock()
    tss.acquire_waiter_session = AsyncMock()
    svc = MagicMock()
    svc.create_order = AsyncMock(return_value=_kitchen_order())
    item = CreateOrderDTO.model_validate(  # type: ignore[call-arg]
        {
            "tableId": "tref",
            "table": "L",
            "items": [
                {
                    "menuItemId": "m1",
                    "name": "A",
                    "quantity": 1,
                    "basePrice": 1.0,
                    "totalPrice": 1.0,
                }
            ],
        }
    )
    req = Request(_scope())
    subject = str(uuid4())
    req.state.user = {"sub": subject}
    session = MagicMock()
    db = MagicMock()
    await orders_routes.create_order(
        "tp1",
        item,
        req,
        db,
        svc,
        session,
        ts,
        tss,
        tid,
        object(),  # type: ignore[arg-type]
    )
    tss.acquire_waiter_session.assert_awaited_once()
    wargs = tss.acquire_waiter_session.call_args[1]
    assert wargs["waiter_user_id"] == UUID(subject)


@pytest.mark.asyncio
@patch.object(orders_routes.ws_manager, "broadcast", new_callable=AsyncMock)
async def test_create_order_invalid_sub_skips_waiter(_bc: AsyncMock) -> None:
    tid = uuid4()
    t = Tenant(
        id=tid,
        public_id="tp1",
        name="N",
        slug="s",
        status=TenantStatus.ACTIVE,
    )
    ts = MagicMock()
    ts.get_tenant_by_public_id = AsyncMock(return_value=t)
    tss = MagicMock()
    tss.acquire_waiter_session = AsyncMock()
    svc = MagicMock()
    svc.create_order = AsyncMock(return_value=_kitchen_order())
    item = CreateOrderDTO.model_validate(  # type: ignore[call-arg]
        {
            "tableId": "tref",
            "items": [
                {
                    "menuItemId": "m1",
                    "name": "A",
                    "quantity": 1,
                    "basePrice": 1.0,
                    "totalPrice": 1.0,
                }
            ],
        }
    )
    req = Request(_scope())
    req.state.user = {"sub": "not-uuid"}
    await orders_routes.create_order(
        "tp1",
        item,
        req,
        MagicMock(),
        svc,
        MagicMock(),
        ts,
        tss,
        tid,
        object(),  # type: ignore[arg-type]
    )
    assert tss.acquire_waiter_session.call_args[1]["waiter_user_id"] is None


@pytest.mark.asyncio
@patch.object(orders_routes.ws_manager, "broadcast", new_callable=AsyncMock)
async def test_update_order(_bc: AsyncMock) -> None:
    svc = MagicMock()
    svc.update_order = AsyncMock(return_value=_kitchen_order())
    p = UpdateOrderDTO.model_validate({"status": "ready"})
    r = await orders_routes.update_order(
        "tp",
        "o1",
        p,
        _req(),
        MagicMock(),
        svc,
        uuid4(),
        object(),  # type: ignore[arg-type]
    )
    assert "updated" in r.message


@pytest.mark.asyncio
@patch.object(orders_routes.ws_manager, "broadcast", new_callable=AsyncMock)
async def test_update_order_status(_bc: AsyncMock) -> None:
    svc = MagicMock()
    svc.update_status = AsyncMock(return_value=_kitchen_order())
    p = UpdateOrderStatusDTO(status="rejected", rejection_reason="x")
    r = await orders_routes.update_order_status(
        "tp",
        "o1",
        p,
        _req(),
        MagicMock(),
        svc,
        uuid4(),
        object(),  # type: ignore[arg-type]
    )
    assert "status" in r.message


@pytest.mark.asyncio
@patch.object(orders_routes.ws_manager, "broadcast", new_callable=AsyncMock)
async def test_delete_order(_bc: AsyncMock) -> None:
    svc = MagicMock()
    svc.delete_order = AsyncMock(
        return_value={"tableId": "tb1", "id": "o1", "status": "done", "total": 1.0}
    )
    tss = MagicMock()
    tss.release_by_table_ref = AsyncMock()
    tid = uuid4()
    await orders_routes.delete_order(
        "tp",
        "o1",
        _req(),
        MagicMock(),
        svc,
        MagicMock(),
        tss,
        tid,
        object(),  # type: ignore[arg-type]
    )
    tss.release_by_table_ref.assert_awaited_once()


@pytest.mark.asyncio
@patch.object(orders_routes.ws_manager, "broadcast", new_callable=AsyncMock)
async def test_archive_order(_bc: AsyncMock) -> None:
    tid = uuid4()
    order_doc: dict = {"_id": "1", "restaurantId": "r", "tableId": "ta"}
    svc = MagicMock()
    svc.get_order_for_archive = AsyncMock(return_value=order_doc)
    arch = SimpleNamespace(id=uuid4())
    tss = MagicMock()
    tss.release_by_table_ref = AsyncMock()
    tsvc = MagicMock()
    tsvc.get_tenant = AsyncMock(
        return_value=Tenant(
            id=tid,
            public_id="pub",
            name="n",
            slug="s",
            status=TenantStatus.ACTIVE,
            p24_merchantid=1,
            p24_api="k" * 32,
            p24_crc="crc",
        )
    )
    with patch.object(orders_routes, "_archive_service") as ar:
        ar.archive_order = AsyncMock(return_value=arch)
        r = await orders_routes.archive_order(
            "tp",
            "o1",
            MagicMock(),
            MagicMock(),
            svc,
            tss,
            tsvc,
            tid,
            object(),  # type: ignore[arg-type]
        )
    assert "archived" in r.message
    tsvc.get_tenant.assert_awaited_once()


@pytest.mark.asyncio
@patch.object(orders_routes.ws_manager, "broadcast", new_callable=AsyncMock)
async def test_refund_order_rejected(_bc: AsyncMock) -> None:
    tid = uuid4()
    order = {
        "status": "rejected",
        "total": 10.0,
        "rejectionReason": "x",
        "tableId": "tr",
    }
    svc = MagicMock()
    svc.get_order = AsyncMock(return_value=order)
    svc.update_status = AsyncMock(return_value=_kitchen_order())
    tss = MagicMock()
    tss.release_by_table_ref = AsyncMock()
    with patch.object(orders_routes, "_refund_service") as rf:
        rf.process_refund = AsyncMock(return_value={"ok": True})
        r = await orders_routes.refund_order(  # type: ignore[call-arg]
            "tp", "o1", MagicMock(), svc, MagicMock(), tss, tid, object()
        )
    assert r.data.get("ok") is True
    rf.process_refund.assert_awaited_once()


@pytest.mark.asyncio
async def test_refund_order_not_rejected() -> None:
    svc = MagicMock()
    svc.get_order = AsyncMock(return_value={"status": "ready", "total": 1})
    with pytest.raises(BadRequestError, match="Only rejected"):
        await orders_routes.refund_order(  # type: ignore[call-arg]
            "tp", "o1", MagicMock(), svc, MagicMock(), MagicMock(), uuid4(), object()
        )


@pytest.mark.asyncio
async def test_list_table_sessions() -> None:
    tid = uuid4()
    srow = SimpleNamespace(
        id=uuid4(),
        table_ref="a",
        table_number=1,
        table_label="L",
        origin=SimpleNamespace(value="w"),
        status=SimpleNamespace(value="active"),
        session_id="psid-1",
        waiter_user_id=None,
        acquired_at=datetime.now(UTC),
        last_seen_at=datetime.now(UTC),
        expires_at=datetime.now(UTC) + timedelta(hours=1),
    )
    tss = MagicMock()
    tss.list_active_sessions = AsyncMock(return_value=[srow])
    r = await orders_routes.list_table_sessions(  # type: ignore[call-arg]
        "tp", MagicMock(), tss, tid, object()
    )
    assert "sessions" in r.message
    assert len(r.data) == 1


@pytest.mark.asyncio
@patch.object(orders_routes.ws_manager, "broadcast", new_callable=AsyncMock)
async def test_unlock_table_session(_bc: AsyncMock) -> None:
    tid = uuid4()
    tss = MagicMock()
    tss.release_waiter_table = AsyncMock(return_value=object())
    req = Request(_scope())
    req.state.user = {"sub": str(uuid4())}
    r = await orders_routes.unlock_table_session(  # type: ignore[call-arg]
        "tp", "tref", req, MagicMock(), tss, tid, object()
    )
    assert "unlocked" in r.message
    assert r.data.get("tableRef") == "tref"


@pytest.mark.asyncio
@patch.object(orders_routes.ws_manager, "broadcast", new_callable=AsyncMock)
async def test_unlock_table_session_invalid_sub_uuid(_bc: AsyncMock) -> None:
    tid = uuid4()
    tss = MagicMock()
    tss.release_waiter_table = AsyncMock(return_value=None)
    req = Request(_scope())
    req.state.user = {"sub": "not-a-uuid"}
    r = await orders_routes.unlock_table_session(  # type: ignore[call-arg]
        "tp", "tref", req, MagicMock(), tss, tid, object()
    )
    tss.release_waiter_table.assert_awaited_once()
    assert r.data.get("released") is False
