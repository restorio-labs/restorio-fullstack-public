from datetime import UTC, datetime

from fastapi import Request

from routes.v1.public.public import (
    _coerce_float,
    _coerce_optional_int,
    _extract_client_fingerprint,
    _public_table_session_response,
)
from services.payment_service import mongo_payment_status_from_transaction


def test_coerce_float() -> None:
    assert _coerce_float(3) == 3.0  # noqa: PLR2004
    assert _coerce_float("x") == 0.0


def test_coerce_optional_int() -> None:
    assert _coerce_optional_int(5) == 5  # noqa: PLR2004
    assert _coerce_optional_int("42") == 42  # noqa: PLR2004
    assert _coerce_optional_int("4.2") is None


def test_extract_client_fingerprint() -> None:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [(b"x-device-fingerprint", b"  dev-1  ")],
    }
    assert _extract_client_fingerprint(Request(scope)) == "dev-1"

    empty = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [(b"user-agent", b"  ")],
    }
    assert _extract_client_fingerprint(Request(empty)) is None


def test_mongo_payment_status_from_transaction() -> None:
    assert mongo_payment_status_from_transaction(0) == "pending"
    assert mongo_payment_status_from_transaction(1) == "completed"
    assert mongo_payment_status_from_transaction(2) == "completed"
    assert mongo_payment_status_from_transaction(3) == "refunded"
    assert mongo_payment_status_from_transaction(99) == "pending"


def test_public_table_session_response_dto() -> None:
    dt = datetime.now(UTC)
    res = _public_table_session_response(
        lock_token="l",
        expires_at=dt,
        owner_type="customer",
        table_ref="t-1",
        table_number=3,
    )
    assert res.table_ref == "t-1"
    assert res.table_number == 3  # noqa: PLR2004
