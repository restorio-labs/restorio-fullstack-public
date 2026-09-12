from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from starlette.requests import Request

from core.dto.v1.public import PublicCreateOrderPaymentDTO
from core.exceptions import BadRequestError, NotFoundResponse
from core.models.enums import TenantStatus
from core.models.tenant import Tenant
from core.models.transaction import Transaction
from routes.v1.public import public as public_routes


def _http_req(client_ip: str = "1.1.1.1") -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/p",
            "client": ("1.1.1.1", 1234),
            "headers": [
                (b"host", b"example.com"),
                (b"x-device-fingerprint", b"dev-1"),
            ],
        }
    )


def _tenant() -> Tenant:
    tid = uuid4()
    return Tenant(
        id=tid,
        public_id="pub-ord",
        name="Resto",
        slug="resto",
        status=TenantStatus.ACTIVE,
        p24_merchantid=1,
        p24_api="api-key-32-chars-abcdefghijklmnop",
        p24_crc="crc16ch",
    )


def _payment_dto(*, with_invoice: bool = False) -> PublicCreateOrderPaymentDTO:
    base = {
        "tenantSlug": "resto",
        "tableNumber": 3,
        "tableRef": "t-a",
        "lockToken": "a" * 8,
        "email": "a@b.com",
        "items": [{"name": "Pizza", "quantity": 1, "unitPrice": 12.5}],
        "note": "n",
    }
    if with_invoice:
        base["invoiceData"] = {
            "companyName": "C",
            "nip": "1234563218",
            "street": "S 1",
            "city": "W",
            "postalCode": "00-001",
            "country": "PL",
        }
    return PublicCreateOrderPaymentDTO.model_validate(base)


class _MongoBridge:
    def __init__(self, coll: MagicMock, kitchen_coll: MagicMock | None = None) -> None:
        self._coll = coll
        self._kitchen_coll = kitchen_coll or MagicMock()

    def __getitem__(self, name: str) -> MagicMock:
        if name == "kitchen_orders":
            return self._kitchen_coll
        return self._coll


def _p24_ok_from_kwargs(
    p24_data: dict,
    **kwargs: object,
) -> SimpleNamespace:
    mid = int(kwargs["merchant_id"])  # type: ignore[arg-type]
    return SimpleNamespace(
        session_id=kwargs["session_id"],
        merchant_id=mid,
        pos_id=mid,
        amount=kwargs["amount"],
        currency="PLN",
        description=kwargs["description"],
        email=kwargs["email"],
        country="PL",
        language="pl",
        url_return=kwargs.get("url_return", ""),
        url_status=kwargs.get("url_status", ""),
        sign="sig",
        wait_for_result=True,
        regulation_accept=True,
        p24_response=p24_data,
    )


@pytest.mark.asyncio
async def test_create_public_order_payment_happy() -> None:
    t = _tenant()
    tsvc = MagicMock()
    tsvc.get_tenant_by_slug = AsyncMock(return_value=t)
    p24 = MagicMock()
    p24.validate_tenant_p24_credentials = MagicMock()
    ext = MagicMock()
    tss = MagicMock()
    tsess = SimpleNamespace(
        lock_token="lt",
        expires_at=datetime.now(UTC) + timedelta(hours=1),
        table_ref="tref-1",
        origin=SimpleNamespace(value="customer"),
    )
    tss.acquire_mobile_session = AsyncMock(return_value=tsess)

    captured: dict = {}

    async def reg(_ec: object, **kwargs: object) -> SimpleNamespace:
        captured.update(kwargs)
        return _p24_ok_from_kwargs({"data": {"token": "tok123"}}, **kwargs)

    p24.register_transaction = reg

    ins = AsyncMock()
    coll = MagicMock()
    coll.insert_one = ins

    db = _MongoBridge(coll)

    pg_session = MagicMock()
    pg_session.add = MagicMock()
    pg_session.flush = AsyncMock()
    http = _http_req()
    dto = _payment_dto(with_invoice=True)

    with (
        patch.object(public_routes.settings, "MOBILE_APP_URL", "https://app.example/m"),
        patch.object(public_routes.settings, "PRZELEWY24_API_URL", "https://p24/sandbox/api/v1"),
    ):
        r = await public_routes.create_public_order_payment(  # type: ignore[call-arg]
            dto, http, pg_session, tsvc, p24, ext, tss, db
        )
    assert "created" in r.message
    assert r.data.token == "tok123"
    ins.assert_awaited_once()
    tss.acquire_mobile_session.assert_awaited_once()
    assert captured["amount"] > 0


@pytest.mark.asyncio
async def test_create_public_order_payment_rejects_zero_total() -> None:
    t = _tenant()
    tsvc = MagicMock()
    tsvc.get_tenant_by_slug = AsyncMock(return_value=t)
    p24 = MagicMock()
    p24.validate_tenant_p24_credentials = MagicMock()
    dto = PublicCreateOrderPaymentDTO.model_validate(
        {
            "tenantSlug": "resto",
            "tableNumber": 1,
            "email": "a@b.com",
            "items": [{"name": "Free", "quantity": 1, "unitPrice": 0.0}],
        }
    )
    with pytest.raises(BadRequestError, match="greater than zero"):
        await public_routes.create_public_order_payment(  # type: ignore[call-arg]
            dto,
            _http_req(),
            MagicMock(),
            tsvc,
            p24,
            MagicMock(),
            MagicMock(),
            MagicMock(),
        )


@pytest.mark.asyncio
async def test_create_public_order_payment_fails_without_p24_token() -> None:
    t = _tenant()
    tsvc = MagicMock()
    tsvc.get_tenant_by_slug = AsyncMock(return_value=t)
    p24 = MagicMock()
    p24.validate_tenant_p24_credentials = MagicMock()
    tss = MagicMock()
    tss.acquire_mobile_session = AsyncMock(
        return_value=SimpleNamespace(
            lock_token="l",
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            table_ref="r",
            origin=SimpleNamespace(value="customer"),
        )
    )
    p24.register_transaction = AsyncMock(
        return_value=_p24_ok_from_kwargs(
            {"data": {}},
            session_id="x",
            merchant_id=1,
            amount=1000,
            description="d",
            email="a@b.com",
            url_return="u",
            url_status="u2",
        )
    )
    pg_session = MagicMock()
    pg_session.add = MagicMock()
    pg_session.flush = AsyncMock()
    with pytest.raises(BadRequestError, match="no token"):
        await public_routes.create_public_order_payment(  # type: ignore[call-arg]
            _payment_dto(),
            _http_req(),
            pg_session,
            tsvc,
            p24,
            MagicMock(),
            tss,
            MagicMock(),
        )


@pytest.mark.asyncio
async def test_sync_public_transaction_not_found() -> None:
    sid = uuid4()
    res = MagicMock()
    res.scalar_one_or_none = MagicMock(return_value=None)
    pg = MagicMock()
    pg.execute = AsyncMock(return_value=res)
    with pytest.raises(NotFoundResponse):
        await public_routes.sync_public_transaction_from_p24(  # type: ignore[call-arg]
            sid, pg, MagicMock(), MagicMock(), MagicMock(), MagicMock(), MagicMock()
        )


@pytest.mark.asyncio
async def test_sync_public_transaction_rejects_non_int_p24_status() -> None:
    sid = uuid4()
    tx = Transaction(
        session_id=sid,
        tenant_id=uuid4(),
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
    pg.flush = AsyncMock()
    tsvc = MagicMock()
    tsvc.get_tenant = AsyncMock(return_value=_tenant())
    p24 = MagicMock()
    p24.apply_p24_lookup_to_transaction = AsyncMock(
        return_value=({"status": "bad", "amount": 1000, "currency": "PLN"}, 0)
    )
    m_coll = MagicMock()
    m_coll.update_one = AsyncMock()
    m_coll.find_one = AsyncMock(return_value=None)
    db = _MongoBridge(m_coll)
    tss = MagicMock()
    tss.mark_completed_by_session_id = AsyncMock()
    with pytest.raises(BadRequestError, match="Invalid Przelewy24 transaction status"):
        await public_routes.sync_public_transaction_from_p24(  # type: ignore[call-arg]
            sid, pg, tsvc, p24, MagicMock(), tss, db
        )


@pytest.mark.asyncio
async def test_sync_public_transaction_paid_marks_session_completed() -> None:
    sid = uuid4()
    tenant = _tenant()
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
        assert tenant.id == transaction.tenant_id
        transaction.status = 1
        return (
            {
                "status": 1,
                "statement": "st",
                "date": "d1",
                "dateOfTransaction": "d2",
                "amount": 1000,
                "currency": "PLN",
            },
            0,
        )

    res = MagicMock()
    res.scalar_one_or_none = MagicMock(return_value=tx)
    pg = MagicMock()
    pg.execute = AsyncMock(return_value=res)
    pg.flush = AsyncMock()
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

    out = await public_routes.sync_public_transaction_from_p24(  # type: ignore[call-arg]
        sid, pg, tsvc, p24, MagicMock(), tss, db
    )
    assert "synced" in out.message
    tss.mark_completed_by_session_id.assert_awaited_once()
    pg.flush.assert_awaited_once()
    kitchen_coll.insert_one.assert_awaited_once()
