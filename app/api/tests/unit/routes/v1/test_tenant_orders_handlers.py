from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import NAMESPACE_URL, uuid4, uuid5

from fastapi import HTTPException
import pytest
from starlette import status

from core.dto.v1.orders import CreateOrderDTO, CreateOrderItemDTO, UpdateOrderDTO
from core.foundation.http.responses import UnauthenticatedResponse
from core.models.enums import OrderStatus
from core.models.order import Order
from core.models.order_details import OrderDetails
from core.models.user import User
from routes.v1.tenants import orders as tenant_orders


def test_table_ref_to_uuid_passthrough() -> None:
    u = uuid4()
    assert tenant_orders._table_ref_to_uuid("pub", str(u)) == u


def test_table_ref_to_uuid_derived() -> None:
    out = tenant_orders._table_ref_to_uuid("pub", "table-a")
    assert out == uuid5(NAMESPACE_URL, "pub:table-a")


def test_build_order_response_minimal() -> None:
    ts = datetime.now(UTC)
    oid = uuid4()
    o = SimpleNamespace(
        id=oid,
        tenant_id=uuid4(),
        table_id=uuid4(),
        table_ref="t1",
        waiter_user_id=None,
        status=OrderStatus.READY,
        total_amount=Decimal("1.00"),
        currency="PLN",
        created_at=ts,
        updated_at=ts,
    )
    r = tenant_orders._build_order_response(o, None, {})
    assert r.waiter_name is None
    assert r.items == []


def test_build_order_response_with_waiter_and_details() -> None:
    ts = datetime.now(UTC)
    iid = uuid4()
    wid, oid = uuid4(), uuid4()
    w = SimpleNamespace(id=wid, name="A", surname="B")
    o = SimpleNamespace(
        id=oid,
        tenant_id=uuid4(),
        table_id=uuid4(),
        table_ref="t1",
        waiter_user_id=wid,
        status=OrderStatus.READY,
        total_amount=Decimal("2.00"),
        currency="PLN",
        created_at=ts,
        updated_at=ts,
    )
    d = SimpleNamespace(
        order_id=oid,
        notes="x",
        items_snapshot=[
            {
                "id": str(iid),
                "menuItemId": "m1",
                "name": "Burger",
                "quantity": 1,
                "basePrice": "2.00",
                "totalPrice": "2.00",
            }
        ],
    )
    r = tenant_orders._build_order_response(o, d, {wid: w})
    assert r.waiter_name == "A"
    assert r.notes == "x"
    assert len(r.items) == 1


@pytest.mark.asyncio
async def test_list_tenant_orders() -> None:
    ts = datetime.now(UTC)
    tid = uuid4()
    oid, wid = uuid4(), uuid4()
    order = SimpleNamespace(
        id=oid,
        tenant_id=tid,
        table_id=uuid4(),
        table_ref="a",
        waiter_user_id=wid,
        status=OrderStatus.READY,
        total_amount=Decimal("1.00"),
        currency="PLN",
        created_at=ts,
        updated_at=ts,
    )
    det = SimpleNamespace(order_id=oid, notes="n", items_snapshot=[])
    waiter = SimpleNamespace(id=wid, name="W", surname="K")

    n = 0
    step_orders = 1
    step_details = 2

    async def execute(_q: object) -> MagicMock:
        nonlocal n
        n += 1
        r = MagicMock()
        if n == step_orders:
            r.scalars.return_value.all.return_value = [order]
        elif n == step_details:
            r.scalars.return_value.all.return_value = [det]
        else:
            r.scalars.return_value.all.return_value = [waiter]
        return r

    session = MagicMock()
    session.execute = execute

    out = await tenant_orders.list_tenant_orders("p", tid, session)  # type: ignore[arg-type]
    assert "retrieved" in out.message
    assert len(out.data) == 1


@pytest.mark.asyncio
async def test_create_tenant_order_rejects_unauthenticated() -> None:
    req = MagicMock()
    req.state.user = None
    body = CreateOrderDTO(
        tableId="t1",
        items=[
            CreateOrderItemDTO(menuItemId="m1", name="A", quantity=1, basePrice=Decimal("1.00"))
        ],
    )
    with pytest.raises(UnauthenticatedResponse):
        await tenant_orders.create_tenant_order(
            "pub1",
            uuid4(),
            req,
            body,
            MagicMock(),
        )  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_create_tenant_order_rejects_invalid_sub_uuid() -> None:
    req = MagicMock()
    req.state.user = {"sub": "bad"}
    body = CreateOrderDTO(
        tableId="t1",
        items=[
            CreateOrderItemDTO(menuItemId="m1", name="A", quantity=1, basePrice=Decimal("1.00"))
        ],
    )
    with pytest.raises(UnauthenticatedResponse):
        await tenant_orders.create_tenant_order(
            "pub1",
            uuid4(),
            req,
            body,
            MagicMock(),
        )  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_create_tenant_order_success() -> None:
    expected_adds = 2
    tid, wid = uuid4(), uuid4()
    req = MagicMock()
    req.state.user = {"sub": str(wid)}
    item = CreateOrderItemDTO(
        id=str(uuid4()),
        menuItemId="m1",
        name="Burger",
        quantity=2,
        basePrice=Decimal("5.00"),
    )
    body = CreateOrderDTO(tableId="t1", items=[item], notes="n")
    waiter = User(
        id=wid,
        email="w@e.com",
        name="W",
        surname="K",
        password_hash="h",
    )
    added: list[object] = []

    def add(obj: object) -> None:
        added.append(obj)

    async def flush() -> None:
        now = datetime.now(UTC)
        for o in added:
            if isinstance(o, Order) and o.id is None:
                o.id = uuid4()
            if isinstance(o, Order):
                o.created_at = o.created_at or now
                o.updated_at = o.updated_at or now

    session = MagicMock()
    session.add = add
    session.flush = flush
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.get = AsyncMock(return_value=waiter)

    r = await tenant_orders.create_tenant_order(  # type: ignore[call-arg]
        "pub1", tid, req, body, session
    )
    assert "created" in r.message
    assert r.data.waiter_name == "W"
    assert len(added) == expected_adds


@pytest.mark.asyncio
async def test_update_tenant_order_not_found() -> None:
    tid, oid = uuid4(), uuid4()
    res = MagicMock()
    res.scalar_one_or_none.return_value = None
    session = MagicMock()
    session.execute = AsyncMock(return_value=res)
    with pytest.raises(HTTPException) as e:
        await tenant_orders.update_tenant_order(  # type: ignore[call-arg]
            "p",
            tid,
            oid,
            UpdateOrderDTO(status=OrderStatus.READY.value),
            session,
        )
    assert e.value.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_update_tenant_order_success() -> None:
    tid, oid, wid = uuid4(), uuid4(), uuid4()
    ts = datetime.now(UTC)
    order = Order(
        id=oid,
        tenant_id=tid,
        table_ref="t1",
        waiter_user_id=wid,
        status=OrderStatus.NEW,
        total_amount=Decimal("1.00"),
        currency="PLN",
    )
    order.created_at = ts
    order.updated_at = ts
    details = OrderDetails(order_id=oid, items_snapshot=[])
    waiter = User(
        id=wid,
        email="w@e.com",
        name="L",
        surname="M",
        password_hash="h",
    )
    res = MagicMock()
    res.scalar_one_or_none.return_value = order
    session = MagicMock()
    session.execute = AsyncMock(return_value=res)

    def get_side(model: type, pk: object) -> object | None:
        if model is OrderDetails:
            return details
        if model is User:
            return waiter
        return None

    session.get = AsyncMock(side_effect=get_side)
    session.commit = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    item = CreateOrderItemDTO(
        id=str(uuid4()),
        menuItemId="m1",
        name="A",
        quantity=1,
        basePrice=Decimal("2.00"),
    )
    body = UpdateOrderDTO(items=[item])
    r = await tenant_orders.update_tenant_order(  # type: ignore[call-arg]
        "p", tid, oid, body, session
    )
    assert "updated" in r.message
    assert r.data.items
