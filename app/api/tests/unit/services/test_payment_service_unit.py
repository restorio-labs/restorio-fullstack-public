from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from sqlalchemy.engine import Result
from starlette.requests import Request

from core.exceptions import BadRequestError, ConflictError, ExternalAPIError
from core.models.enums import TenantStatus
from core.models.tenant import Tenant
from core.models.transaction import Transaction
from services.external_client_service import ExternalClient
from services.payment_service import (
    P24Service,
    build_waiter_settlement_transaction,
    resolve_mobile_payment_return_base_url,
    return_url_with_session_id,
)


def _http_request_with_headers(headers: list[tuple[bytes, bytes]]) -> Request:
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/public/payments/create",
            "client": ("127.0.0.1", 1234),
            "headers": headers,
        }
    )


def test_resolve_mobile_payment_return_base_url_uses_origin_in_development() -> None:
    req = _http_request_with_headers([(b"origin", b"http://localhost:3003")])
    with (
        patch.dict("os.environ", {"ENV": "development"}, clear=False),
        patch("services.payment_service.settings") as mock_settings,
    ):
        mock_settings.MOBILE_APP_URL = "https://mobile.restorio.org"
        assert resolve_mobile_payment_return_base_url(req) == "http://localhost:3003"


def test_resolve_mobile_payment_return_base_url_uses_configured_in_production() -> None:
    req = _http_request_with_headers([(b"origin", b"http://localhost:3003")])
    with (
        patch.dict("os.environ", {"ENV": "production"}, clear=False),
        patch("services.payment_service.settings") as mock_settings,
    ):
        mock_settings.MOBILE_APP_URL = "https://mobile.restorio.org"
        assert resolve_mobile_payment_return_base_url(req) == "https://mobile.restorio.org"


def test_resolve_mobile_payment_return_base_url_falls_back_without_origin() -> None:
    req = _http_request_with_headers([])
    with (
        patch.dict("os.environ", {"ENV": "development"}, clear=False),
        patch("services.payment_service.settings") as mock_settings,
    ):
        mock_settings.MOBILE_APP_URL = "http://localhost:3003"
        assert resolve_mobile_payment_return_base_url(req) == "http://localhost:3003"


def test_return_url_with_session_id_merges_query() -> None:
    url = return_url_with_session_id("https://example.com/pay?return=1", "sess-abc")
    assert "sessionId=sess-abc" in url
    assert url.startswith("https://example.com/pay")


def test_map_p24_status_maps_known_and_refund() -> None:
    assert P24Service.map_p24_status_to_db(0) == 0
    assert P24Service.map_p24_status_to_db(1) == 1
    assert P24Service.map_p24_status_to_db(3) == 3  # noqa: PLR2004


def test_map_p24_status_rejects_unknown() -> None:
    with pytest.raises(BadRequestError, match="Unsupported"):
        P24Service.map_p24_status_to_db(99)


def test_validate_tenant_p24_credentials_requires_all() -> None:
    tenant = MagicMock(spec=Tenant)
    tenant.name = "T"
    tenant.p24_merchantid = None
    tenant.p24_api = "k"
    tenant.p24_crc = "c"

    with pytest.raises(BadRequestError, match="credentials"):
        P24Service.validate_tenant_p24_credentials(tenant)


def test_parse_p24_amount_minor() -> None:
    assert P24Service._parse_p24_amount_minor(True) is None
    assert P24Service._parse_p24_amount_minor(100) == 100  # noqa: PLR2004
    assert P24Service._parse_p24_amount_minor(100.0) == 100  # noqa: PLR2004
    assert P24Service._parse_p24_amount_minor(100.5) is None


def test_parse_p24_positive_int_id() -> None:
    assert P24Service._parse_p24_positive_int_id(True) is None
    assert P24Service._parse_p24_positive_int_id(0) is None
    assert P24Service._parse_p24_positive_int_id(5) == 5  # noqa: PLR2004
    assert P24Service._parse_p24_positive_int_id(5.0) == 5  # noqa: PLR2004


def test_order_id_from_p24_data_raises() -> None:
    with pytest.raises(BadRequestError, match="orderId"):
        P24Service._order_id_from_p24_data({})


def test_order_id_from_p24_data_ok() -> None:
    assert P24Service._order_id_from_p24_data({"orderId": 42}) == 42  # noqa: PLR2004


def test_przelewy24_verify_sign() -> None:
    sign = P24Service._przelewy24_verify_sign(
        session_id="s1", order_id=7, amount=100, currency="PLN", crc="c"
    )
    assert sign != ""
    assert len(sign) == 96  # noqa: PLR2004


@pytest.mark.asyncio
async def test_register_transaction_calls_external_post() -> None:
    ext = AsyncMock(spec=ExternalClient)
    ext.external_post_json = AsyncMock(return_value={"data": {"token": "x"}})

    svc = P24Service()
    result = await svc.register_transaction(
        ext,
        merchant_id=1,
        api_key="api",
        crc="crc",
        amount=1000,
        email="a@b.c",
    )

    assert result.session_id
    ext.external_post_json.assert_awaited_once()


@pytest.mark.asyncio
async def test_fetch_transaction_by_session_id_error_dict() -> None:
    ext = AsyncMock(spec=ExternalClient)
    ext.external_get_json = AsyncMock(return_value={"error": {"errorMessage": "bad"}})

    svc = P24Service()
    with pytest.raises(ExternalAPIError, match="bad"):
        await svc.fetch_transaction_by_session_id(ext, session_id="s", merchant_id=1, api_key="k")


@pytest.mark.asyncio
async def test_fetch_transaction_by_session_id_bad_response_code() -> None:
    ext = AsyncMock(spec=ExternalClient)
    ext.external_get_json = AsyncMock(return_value={"responseCode": 1, "data": {}})

    svc = P24Service()
    with pytest.raises(ExternalAPIError, match="responseCode"):
        await svc.fetch_transaction_by_session_id(ext, session_id="s", merchant_id=1, api_key="k")


@pytest.mark.asyncio
async def test_fetch_transaction_by_session_id_missing_data() -> None:
    ext = AsyncMock(spec=ExternalClient)
    ext.external_get_json = AsyncMock(return_value={"responseCode": 0})

    svc = P24Service()
    with pytest.raises(BadRequestError, match="missing data"):
        await svc.fetch_transaction_by_session_id(ext, session_id="s", merchant_id=1, api_key="k")


@pytest.mark.asyncio
async def test_apply_p24_lookup_mismatch_amount() -> None:
    ext = AsyncMock(spec=ExternalClient)
    ext.external_get_json = AsyncMock(
        return_value={
            "responseCode": 0,
            "data": {"amount": 100, "currency": "PLN", "status": 1},
        }
    )

    tenant = MagicMock(spec=Tenant)
    tenant.p24_merchantid = 1
    tenant.p24_api = "k"
    tenant.p24_crc = "c"

    tx = MagicMock(spec=Transaction)
    tx.amount = 999
    tx.currency = "PLN"

    svc = P24Service()
    with pytest.raises(ConflictError, match="amount"):
        await svc.apply_p24_lookup_to_transaction(ext, transaction=tx, tenant=tenant)


@pytest.mark.asyncio
async def test_verify_transaction_fetches_order_id_and_calls_put() -> None:
    tid = uuid4()
    sid = uuid4()
    ext = AsyncMock(spec=ExternalClient)
    expected_p24_order = 9
    ext.external_get_json = AsyncMock(
        return_value={"responseCode": 0, "data": {"orderId": expected_p24_order}}
    )
    ext.external_put_json = AsyncMock(return_value={"data": {"status": 0}})
    tx = MagicMock(spec=Transaction)
    tx.tenant_id = tid
    tx.session_id = sid
    tx.p24_order_id = None
    tx.amount = 100
    tx.currency = "PLN"
    tx.merchant_id = 1
    tx.pos_id = 1
    ten = MagicMock(spec=Tenant)
    ten.id = tid
    ten.p24_merchantid = 1
    ten.p24_api = "k"
    ten.p24_crc = "crc"
    svc = P24Service()
    await svc.verify_transaction_at_przelewy24(ext, transaction=tx, tenant=ten)
    ext.external_get_json.assert_awaited_once()
    ext.external_put_json.assert_awaited_once()
    assert tx.p24_order_id == expected_p24_order


@pytest.mark.asyncio
async def test_verify_transaction_rejects_tenant_mismatch() -> None:
    tid, other = uuid4(), uuid4()
    ext = AsyncMock(spec=ExternalClient)
    tx = MagicMock(spec=Transaction)
    tx.tenant_id = tid
    ten = MagicMock(spec=Tenant)
    ten.id = other
    ten.p24_merchantid = 1
    ten.p24_api = "a"
    ten.p24_crc = "c"
    svc = P24Service()
    with pytest.raises(BadRequestError, match="does not belong"):
        await svc.verify_transaction_at_przelewy24(ext, transaction=tx, tenant=ten)


@pytest.mark.asyncio
async def test_fetch_transaction_error_string() -> None:
    ext = AsyncMock(spec=ExternalClient)
    ext.external_get_json = AsyncMock(return_value={"error": "plain error", "data": {"orderId": 1}})
    svc = P24Service()
    with pytest.raises(ExternalAPIError, match="plain error"):
        await svc.fetch_transaction_by_session_id(ext, session_id="s", merchant_id=1, api_key="k")


@pytest.mark.asyncio
async def test_apply_p24_lookup_invalid_status() -> None:
    ext = AsyncMock(spec=ExternalClient)
    ext.external_get_json = AsyncMock(
        return_value={
            "responseCode": 0,
            "data": {
                "amount": 5,
                "currency": "PLN",
                "status": "x",
            },
        }
    )
    tx = MagicMock(spec=Transaction)
    tx.amount = 5
    tx.currency = "PLN"
    ten = MagicMock(spec=Tenant)
    ten.p24_merchantid = 1
    ten.p24_api = "a"
    ten.p24_crc = "c"
    svc = P24Service()
    with pytest.raises(BadRequestError, match="Invalid"):
        await svc.apply_p24_lookup_to_transaction(ext, transaction=tx, tenant=ten)


@pytest.mark.asyncio
async def test_apply_p24_lookup_currency_mismatch() -> None:
    ext = AsyncMock(spec=ExternalClient)
    ext.external_get_json = AsyncMock(
        return_value={
            "responseCode": 0,
            "data": {
                "amount": 5,
                "currency": "EUR",
                "status": 0,
            },
        }
    )
    tx = MagicMock(spec=Transaction)
    tx.amount = 5
    tx.currency = "PLN"
    ten = MagicMock(spec=Tenant)
    ten.p24_merchantid = 1
    ten.p24_api = "a"
    ten.p24_crc = "c"
    svc = P24Service()
    with pytest.raises(ConflictError, match="currency"):
        await svc.apply_p24_lookup_to_transaction(ext, transaction=tx, tenant=ten)


@pytest.mark.asyncio
async def test_get_transactions_page_paginates() -> None:
    tenant_id = uuid4()
    tx = MagicMock(spec=Transaction)

    mock_result_count = MagicMock(spec=Result)
    mock_result_count.scalar_one.return_value = 1

    mock_result_items = MagicMock(spec=Result)
    mock_result_items.scalars.return_value.all.return_value = [tx]

    session = AsyncMock()
    session.execute = AsyncMock(side_effect=[mock_result_count, mock_result_items])

    svc = P24Service()
    items, total = await svc.get_transactions_page(
        session,
        tenant_id,
        date_from=date(2026, 1, 1),
        date_to=date(2026, 12, 31),
        page=1,
        pagination=10,
    )

    assert total == 1
    assert items == [tx]


def test_p24_notification_status_url_uses_frontend_base(monkeypatch: pytest.MonkeyPatch) -> None:
    import services.payment_service as pay_svc

    monkeypatch.setattr(pay_svc.settings, "API_BASE_URL", "")
    monkeypatch.setattr(pay_svc.settings, "FRONTEND_URL", "https://app.example.com")
    monkeypatch.setattr(pay_svc.settings, "API_V1_PREFIX", "/api/v1")
    assert pay_svc.p24_notification_status_url() == "https://app.example.com/api/v1/payments/status"


def test_p24_notification_status_url_prefers_api_base_url(monkeypatch: pytest.MonkeyPatch) -> None:
    import services.payment_service as pay_svc

    monkeypatch.setattr(pay_svc.settings, "API_BASE_URL", "https://api.restorio.org")
    monkeypatch.setattr(pay_svc.settings, "FRONTEND_URL", "https://restorio.org")
    monkeypatch.setattr(pay_svc.settings, "API_V1_PREFIX", "/api/v1")
    assert pay_svc.p24_notification_status_url() == "https://api.restorio.org/api/v1/payments/status"


def test_build_waiter_settlement_transaction_skips_non_positive_total() -> None:
    tenant = Tenant(
        id=uuid4(),
        public_id="pub",
        name="N",
        slug="sl",
        status=TenantStatus.ACTIVE,
        p24_merchantid=9,
        p24_api="k" * 32,
        p24_crc="crc",
    )
    assert build_waiter_settlement_transaction(tenant, {"_id": "K1", "total": 0}) is None


def test_build_waiter_settlement_transaction_builds_paid_row() -> None:
    tenant = Tenant(
        id=uuid4(),
        public_id="pub",
        name="N",
        slug="sl",
        status=TenantStatus.ACTIVE,
        p24_merchantid=9,
        p24_api="k" * 32,
        p24_crc="crc",
    )
    tx = build_waiter_settlement_transaction(
        tenant,
        {"_id": "K-XY", "total": 12.34, "table": "Stolik 2", "notes": "nap"},
    )
    assert tx is not None
    assert tx.amount == 1234
    assert tx.status == 1
    assert tx.p24_order_id is None
    assert tx.tenant_id == tenant.id
    assert "K-XY" in tx.description
