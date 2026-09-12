from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.exceptions import BadRequestError, NotFoundResponse
from core.models.enums import TenantStatus
from core.models.tenant import Tenant
from core.models.transaction import Transaction
from routes.v1.payments import p24_status


def _tenant() -> Tenant:
    tid = uuid4()
    return Tenant(
        id=tid,
        public_id="pub-webhook",
        name="Resto",
        slug="resto",
        status=TenantStatus.ACTIVE,
        p24_merchantid=1,
        p24_api="api-key-32-chars-abcdefghijklmnop",
        p24_crc="crc16ch",
    )


class _MongoBridge:
    def __init__(self, coll: MagicMock, kitchen_coll: MagicMock | None = None) -> None:
        self._coll = coll
        self._kitchen_coll = kitchen_coll or MagicMock()

    def __getitem__(self, name: str) -> MagicMock:
        if name == "kitchen_orders":
            return self._kitchen_coll
        return self._coll


@pytest.mark.asyncio
async def test_p24_status_webhook_not_found() -> None:
    res = MagicMock()
    res.scalar_one_or_none = MagicMock(return_value=None)
    pg = MagicMock()
    pg.execute = AsyncMock(return_value=res)

    with pytest.raises(NotFoundResponse):
        await p24_status.p24_status_webhook(
            session=pg,
            tenant_service=MagicMock(),
            p24_service=MagicMock(),
            external_client=MagicMock(),
            table_session_service=MagicMock(),
            db=MagicMock(),
            merchantId=1,
            posId=1,
            sessionId="nonexistent",
            amount=1000,
            originAmount=1000,
            currency="PLN",
            orderId=123,
            methodId=1,
            statement="test",
            sign="sig",
        )


@pytest.mark.asyncio
async def test_p24_status_webhook_amount_mismatch() -> None:
    tenant = _tenant()
    tx = Transaction(
        session_id=uuid4(),
        tenant_id=tenant.id,
        merchant_id=1,
        pos_id=1,
        amount=1000,
        currency="PLN",
        description="d",
        email="a@b.com",
        country="PL",
        language="pl",
        url_return="u",
        url_status="u2",
        sign="s",
    )

    res = MagicMock()
    res.scalar_one_or_none = MagicMock(return_value=tx)
    pg = MagicMock()
    pg.execute = AsyncMock(return_value=res)

    with pytest.raises(BadRequestError, match="amount mismatch"):
        await p24_status.p24_status_webhook(
            session=pg,
            tenant_service=MagicMock(),
            p24_service=MagicMock(),
            external_client=MagicMock(),
            table_session_service=MagicMock(),
            db=MagicMock(),
            merchantId=1,
            posId=1,
            sessionId=str(tx.session_id),
            amount=2000,
            originAmount=2000,
            currency="PLN",
            orderId=123,
            methodId=1,
            statement="test",
            sign="sig",
        )


@pytest.mark.asyncio
async def test_p24_status_webhook_creates_kitchen_order_on_paid() -> None:
    tenant = _tenant()
    sid = uuid4()
    tx = Transaction(
        session_id=sid,
        tenant_id=tenant.id,
        merchant_id=1,
        pos_id=1,
        amount=1000,
        currency="PLN",
        description="d",
        email="a@b.com",
        country="PL",
        language="pl",
        url_return="u",
        url_status="u2",
        sign="s",
    )

    async def apply_p24(
        _ec: object,
        *,
        transaction: Transaction,
        tenant: Tenant,
    ) -> tuple[dict, int]:
        transaction.status = 1
        return ({"status": 1, "amount": 1000, "currency": "PLN"}, 0)

    res = MagicMock()
    res.scalar_one_or_none = MagicMock(return_value=tx)
    pg = MagicMock()
    pg.execute = AsyncMock(return_value=res)
    pg.commit = AsyncMock()

    tsvc = MagicMock()
    tsvc.get_tenant = AsyncMock(return_value=tenant)

    p24 = MagicMock()
    p24.apply_p24_lookup_to_transaction = apply_p24

    m_coll = MagicMock()
    m_coll.update_one = AsyncMock()
    m_coll.find_one = AsyncMock(
        return_value={
            "_id": "order-123",
            "tableRef": "t-1",
            "tableNumber": 3,
            "items": [{"name": "Pizza", "quantity": 1, "unitPrice": 10.0}],
            "totalAmount": 1000,
            "note": "test",
        }
    )
    kitchen_coll = MagicMock()
    kitchen_coll.insert_one = AsyncMock()
    db = _MongoBridge(m_coll, kitchen_coll)

    tss = MagicMock()
    tss.mark_completed_by_session_id = AsyncMock()

    out = await p24_status.p24_status_webhook(
        session=pg,
        tenant_service=tsvc,
        p24_service=p24,
        external_client=MagicMock(),
        table_session_service=tss,
        db=db,
        merchantId=1,
        posId=1,
        sessionId=str(sid),
        amount=1000,
        originAmount=1000,
        currency="PLN",
        orderId=123,
        methodId=1,
        statement="test",
        sign="sig",
    )

    assert "received" in out.message
    kitchen_coll.insert_one.assert_awaited_once()
    tss.mark_completed_by_session_id.assert_awaited_once()
    pg.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_p24_status_webhook_creates_kitchen_order_from_transaction_when_mongo_order_missing() -> None:
    tenant = _tenant()
    sid = uuid4()
    tx = Transaction(
        session_id=sid,
        tenant_id=tenant.id,
        merchant_id=1,
        pos_id=1,
        amount=1000,
        currency="PLN",
        description="d",
        email="a@b.com",
        country="PL",
        language="pl",
        url_return="u",
        url_status="u2",
        sign="s",
    )
    tx.order = {
        "tableRef": "t-1",
        "tableNumber": 3,
        "items": [{"name": "Pizza", "quantity": 1, "unitPrice": 10.0}],
        "note": "from-tx",
    }

    async def apply_p24(
        _ec: object,
        *,
        transaction: Transaction,
        tenant: Tenant,
    ) -> tuple[dict, int]:
        transaction.status = 1
        return ({"status": 1, "amount": 1000, "currency": "PLN"}, 0)

    res = MagicMock()
    res.scalar_one_or_none = MagicMock(return_value=tx)
    pg = MagicMock()
    pg.execute = AsyncMock(return_value=res)
    pg.commit = AsyncMock()

    tsvc = MagicMock()
    tsvc.get_tenant = AsyncMock(return_value=tenant)

    p24 = MagicMock()
    p24.apply_p24_lookup_to_transaction = apply_p24

    m_coll = MagicMock()
    m_coll.update_one = AsyncMock()
    m_coll.find_one = AsyncMock(return_value=None)
    kitchen_coll = MagicMock()
    kitchen_coll.insert_one = AsyncMock()
    db = _MongoBridge(m_coll, kitchen_coll)

    tss = MagicMock()
    tss.mark_completed_by_session_id = AsyncMock()

    out = await p24_status.p24_status_webhook(
        session=pg,
        tenant_service=tsvc,
        p24_service=p24,
        external_client=MagicMock(),
        table_session_service=tss,
        db=db,
        merchantId=1,
        posId=1,
        sessionId=str(sid),
        amount=1000,
        originAmount=1000,
        currency="PLN",
        orderId=123,
        methodId=1,
        statement="test",
        sign="sig",
    )

    assert "received" in out.message
    kitchen_coll.insert_one.assert_awaited_once()
    tss.mark_completed_by_session_id.assert_awaited_once()
    pg.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_p24_status_webhook_no_kitchen_order_when_unpaid() -> None:
    tenant = _tenant()
    sid = uuid4()
    tx = Transaction(
        session_id=sid,
        tenant_id=tenant.id,
        merchant_id=1,
        pos_id=1,
        amount=1000,
        currency="PLN",
        description="d",
        email="a@b.com",
        country="PL",
        language="pl",
        url_return="u",
        url_status="u2",
        sign="s",
    )

    async def apply_p24(
        _ec: object,
        *,
        transaction: Transaction,
        tenant: Tenant,
    ) -> tuple[dict, int]:
        transaction.status = 0
        return ({"status": 0, "amount": 1000, "currency": "PLN"}, 0)

    res = MagicMock()
    res.scalar_one_or_none = MagicMock(return_value=tx)
    pg = MagicMock()
    pg.execute = AsyncMock(return_value=res)
    pg.commit = AsyncMock()

    tsvc = MagicMock()
    tsvc.get_tenant = AsyncMock(return_value=tenant)

    p24 = MagicMock()
    p24.apply_p24_lookup_to_transaction = apply_p24

    m_coll = MagicMock()
    m_coll.update_one = AsyncMock()
    m_coll.find_one = AsyncMock(return_value=None)
    kitchen_coll = MagicMock()
    kitchen_coll.insert_one = AsyncMock()
    db = _MongoBridge(m_coll, kitchen_coll)

    tss = MagicMock()
    tss.mark_completed_by_session_id = AsyncMock()

    out = await p24_status.p24_status_webhook(
        session=pg,
        tenant_service=tsvc,
        p24_service=p24,
        external_client=MagicMock(),
        table_session_service=tss,
        db=db,
        merchantId=1,
        posId=1,
        sessionId=str(sid),
        amount=1000,
        originAmount=1000,
        currency="PLN",
        orderId=123,
        methodId=1,
        statement="test",
        sign="sig",
    )

    assert "received" in out.message
    kitchen_coll.insert_one.assert_not_awaited()
    tss.mark_completed_by_session_id.assert_not_awaited()
