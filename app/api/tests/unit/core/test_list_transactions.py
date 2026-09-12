from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

from core.dto.v1.payments import TransactionListItemDTO, TransactionListQueryDTO
from core.foundation.http.responses import PaginatedResponse
from routes.v1.payments.transactions import list_transactions


def _make_transaction(**overrides):
    defaults = {
        "session_id": uuid4(),
        "tenant_id": uuid4(),
        "merchant_id": 12345,
        "pos_id": 12345,
        "amount": 10000,
        "currency": "PLN",
        "description": "Test payment",
        "email": "user@example.com",
        "country": "PL",
        "language": "pl",
        "url_return": "http://localhost:3000/payment/return",
        "url_status": "http://localhost:3000/api/v1/payments/status",
        "sign": "a" * 96,
        "wait_for_result": True,
        "regulation_accept": True,
        "status": 0,
        "p24_order_id": None,
        "order": {"items": [{"name": "Pizza", "qty": 1}]},
        "note": "Test note",
        "created_at": datetime(2025, 6, 15, 12, 0, 0, tzinfo=UTC),
    }
    defaults.update(overrides)
    mock = Mock()
    for key, value in defaults.items():
        setattr(mock, key, value)
    return mock


@pytest.fixture
def tenant_id():
    return uuid4()


@pytest.fixture
def mock_session():
    return AsyncMock()


@pytest.fixture
def mock_p24_service():
    service = Mock()
    service.get_transactions_page = AsyncMock()
    return service


@pytest.mark.asyncio
async def test_list_transactions_returns_paginated_response(
    tenant_id, mock_session, mock_p24_service
):
    transactions = [_make_transaction(tenant_id=tenant_id) for _ in range(3)]
    mock_p24_service.get_transactions_page.return_value = (transactions, 3)

    result = await list_transactions(
        tenant_id=tenant_id,
        session=mock_session,
        p24_service=mock_p24_service,
        query=TransactionListQueryDTO(),
    )

    assert isinstance(result, PaginatedResponse)
    assert result.total == 3  # noqa: PLR2004
    assert result.page == 1
    assert result.page_size == 20  # noqa: PLR2004
    assert result.total_pages == 1
    assert len(result.items) == 3  # noqa: PLR2004

    mock_p24_service.get_transactions_page.assert_called_once_with(
        mock_session,
        tenant_id,
        date_from=None,
        date_to=None,
        page=1,
        pagination=20,
    )


@pytest.mark.asyncio
async def test_list_transactions_with_date_filters(tenant_id, mock_session, mock_p24_service):
    mock_p24_service.get_transactions_page.return_value = ([], 0)

    result = await list_transactions(
        tenant_id=tenant_id,
        session=mock_session,
        p24_service=mock_p24_service,
        query=TransactionListQueryDTO(
            date_from=date(2025, 1, 1),
            date_to=date(2025, 6, 30),
        ),
    )

    assert result.total == 0
    assert result.items == []
    mock_p24_service.get_transactions_page.assert_called_once_with(
        mock_session,
        tenant_id,
        date_from=date(2025, 1, 1),
        date_to=date(2025, 6, 30),
        page=1,
        pagination=20,
    )


@pytest.mark.asyncio
async def test_list_transactions_with_custom_pagination(tenant_id, mock_session, mock_p24_service):
    transactions = [_make_transaction(tenant_id=tenant_id) for _ in range(5)]
    mock_p24_service.get_transactions_page.return_value = (transactions, 25)

    result = await list_transactions(
        tenant_id=tenant_id,
        session=mock_session,
        p24_service=mock_p24_service,
        query=TransactionListQueryDTO(page=3, pagination=5),
    )

    assert result.page == 3  # noqa: PLR2004
    assert result.page_size == 5  # noqa: PLR2004
    assert result.total == 25  # noqa: PLR2004
    assert result.total_pages == 5  # noqa: PLR2004
    assert len(result.items) == 5  # noqa: PLR2004

    mock_p24_service.get_transactions_page.assert_called_once_with(
        mock_session,
        tenant_id,
        date_from=None,
        date_to=None,
        page=3,
        pagination=5,
    )


@pytest.mark.asyncio
async def test_list_transactions_maps_dto_fields(tenant_id, mock_session, mock_p24_service):
    txn = _make_transaction(
        tenant_id=tenant_id,
        amount=5000,
        email="payer@example.com",
        status=1,
        description="Zamówienie #42",
        p24_order_id=987654,
        order={"table": 5},
        note="Notatka",
    )
    mock_p24_service.get_transactions_page.return_value = ([txn], 1)

    result = await list_transactions(
        tenant_id=tenant_id,
        session=mock_session,
        p24_service=mock_p24_service,
        query=TransactionListQueryDTO(),
    )

    item = result.items[0]
    assert isinstance(item, TransactionListItemDTO)
    assert item.session_id == txn.session_id
    assert item.p24_order_id == 987654  # noqa: PLR2004
    assert item.amount == 5000  # noqa: PLR2004
    assert item.email == "payer@example.com"
    assert item.status == 1
    assert item.description == "Zamówienie #42"
    assert item.order == {"table": 5}
    assert item.note == "Notatka"


@pytest.mark.asyncio
async def test_list_transactions_empty_result(tenant_id, mock_session, mock_p24_service):
    mock_p24_service.get_transactions_page.return_value = ([], 0)

    result = await list_transactions(
        tenant_id=tenant_id,
        session=mock_session,
        p24_service=mock_p24_service,
        query=TransactionListQueryDTO(),
    )

    assert result.items == []
    assert result.total == 0
    assert result.total_pages == 0


@pytest.mark.asyncio
async def test_list_transactions_nullable_fields(tenant_id, mock_session, mock_p24_service):
    txn = _make_transaction(
        tenant_id=tenant_id,
        p24_order_id=None,
        order=None,
        note=None,
    )
    mock_p24_service.get_transactions_page.return_value = ([txn], 1)

    result = await list_transactions(
        tenant_id=tenant_id,
        session=mock_session,
        p24_service=mock_p24_service,
        query=TransactionListQueryDTO(),
    )

    item = result.items[0]
    assert item.p24_order_id is None
    assert item.order is None
    assert item.note is None
