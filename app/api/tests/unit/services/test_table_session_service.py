from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from sqlalchemy.engine import Result

from core.exceptions import BadRequestError, ConflictError, NotFoundResponse
from core.models import AuditLog, TableSessionOrigin, TableSessionStatus
from services.table_session_service import TableSessionService


def _sql_session_from_elements(
    *element_rows: list[object],
) -> AsyncMock:
    mock_result = MagicMock(spec=Result)
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = list(element_rows)
    mock_result.scalars.return_value = mock_scalars

    sa = AsyncMock()
    sa.execute = AsyncMock(return_value=mock_result)
    return sa


def _result_with(
    *,
    all_rows: list | None = None,
    scalar: object = None,
    scalar_id: str = "no-id-call",
) -> MagicMock:
    m = MagicMock(spec=Result)
    sc = MagicMock()
    sc.all.return_value = all_rows if all_rows is not None else []
    m.scalars.return_value = sc
    if scalar_id == "use-scalar":
        m.scalar_one_or_none.return_value = scalar
    return m


def _make_tenant() -> SimpleNamespace:
    tid = uuid4()
    return SimpleNamespace(
        id=tid,
        public_id="pub-rest-1",
        slug="cafe",
    )


def _table_row(
    *,
    table_ref: str = "t-1",
    table_number: int = 1,
    label: str | None = "L",
) -> list[dict]:
    return [
        {
            "type": "table",
            "id": table_ref,
            "tableNumber": table_number,
            **({"label": label} if label is not None else {}),
        }
    ]


def _ts_mock(
    *,
    status: TableSessionStatus = TableSessionStatus.ACTIVE,
    origin: TableSessionOrigin = TableSessionOrigin.MOBILE,
    table_ref: str = "t-1",
    table_number: int | None = 3,
    lock_token: str = "lt-1",
    expires_at: datetime | None = None,
) -> object:
    now = datetime.now(UTC)
    ex = expires_at if expires_at is not None else now + timedelta(hours=1)
    return SimpleNamespace(
        id=uuid4(),
        status=status,
        origin=origin,
        table_ref=table_ref,
        table_number=table_number,
        lock_token=lock_token,
        expires_at=ex,
        session_id=None,
        last_seen_at=now,
        ip_hash=None,
        client_fingerprint_hash=None,
        waiter_user_id=None,
    )


def _sql_session() -> MagicMock:
    s = MagicMock()
    s.flush = AsyncMock()
    return s


@pytest.mark.asyncio
async def test_resolve_table_identity_by_table_ref() -> None:
    el = {
        "type": "table",
        "id": "t-1",
        "tableNumber": 5,
        "label": "  A1  ",
    }
    session = _sql_session_from_elements([el])
    tid = uuid4()

    svc = TableSessionService()
    out = await svc.resolve_table_identity(session, tid, table_ref="t-1", table_number=None)

    assert out.table_ref == "t-1"
    assert out.table_number == 5  # noqa: PLR2004
    assert out.table_label == "A1"


@pytest.mark.asyncio
async def test_resolve_table_identity_skips_empty_id() -> None:
    bad = {"type": "table", "id": "   ", "tableNumber": 1}
    good = {"type": "table", "id": "ok", "tableNumber": 1, "label": "X"}
    session = _sql_session_from_elements([bad, good])
    tid = uuid4()

    svc = TableSessionService()
    out = await svc.resolve_table_identity(session, tid, table_number=1, table_ref=None)

    assert out.table_ref == "ok"


@pytest.mark.asyncio
async def test_resolve_table_identity_by_table_number() -> None:
    el = {"type": "table", "id": "r-9", "tableNumber": 9, "label": "B"}
    session = _sql_session_from_elements([el])
    tid = uuid4()

    svc = TableSessionService()
    out = await svc.resolve_table_identity(session, tid, table_number=9, table_ref=None)

    assert out.table_ref == "r-9"
    assert out.table_number == 9  # noqa: PLR2004
    assert out.table_label == "B"


@pytest.mark.asyncio
async def test_resolve_table_identity_skips_non_list_and_bad_elements() -> None:
    el = {
        "type": "table",
        "id": "t-x",
        "tableNumber": 1,
    }
    session = _sql_session_from_elements("not-a-list", [], [el, "skip"], [el])
    tid = uuid4()

    svc = TableSessionService()
    out = await svc.resolve_table_identity(session, tid, table_number=1, table_ref=None)

    assert out.table_ref == "t-x"


@pytest.mark.asyncio
async def test_resolve_table_identity_fallback_to_table_ref() -> None:
    session = _sql_session_from_elements()
    tid = uuid4()

    svc = TableSessionService()
    out = await svc.resolve_table_identity(session, tid, table_ref="orphan", table_number=None)

    assert out.table_ref == "orphan"
    assert out.table_number is None
    assert out.table_label is None


@pytest.mark.asyncio
async def test_resolve_table_identity_rejects_duplicate_table_number_across_canvases() -> None:
    floor_a = [{"type": "table", "id": "e1", "tableNumber": 5}]
    floor_b = [{"type": "table", "id": "e2", "tableNumber": 5}]
    session = _sql_session_from_elements(floor_a, floor_b)
    tid = uuid4()

    svc = TableSessionService()
    with pytest.raises(BadRequestError):
        await svc.resolve_table_identity(session, tid, table_number=5, table_ref=None)


@pytest.mark.asyncio
async def test_resolve_table_identity_disambiguates_duplicate_numbers_with_table_ref() -> None:
    floor_a = [{"type": "table", "id": "e1", "tableNumber": 5}]
    floor_b = [{"type": "table", "id": "e2", "tableNumber": 5}]
    session = _sql_session_from_elements(floor_a, floor_b)
    tid = uuid4()

    svc = TableSessionService()
    out = await svc.resolve_table_identity(session, tid, table_ref="e2", table_number=None)

    assert out.table_ref == "e2"
    assert out.table_number == 5  # noqa: PLR2004


@pytest.mark.asyncio
async def test_resolve_table_identity_not_found_for_number() -> None:
    session = _sql_session_from_elements()
    tid = uuid4()

    svc = TableSessionService()
    with pytest.raises(NotFoundResponse):
        await svc.resolve_table_identity(session, tid, table_number=99, table_ref=None)


@pytest.mark.asyncio
async def test_list_active_sessions() -> None:
    tid = uuid4()
    r_expire = _result_with(all_rows=[])
    r_list = _result_with(all_rows=[_ts_mock()])

    session = _sql_session()
    session.execute = AsyncMock(side_effect=[r_expire, r_list])
    session.flush = AsyncMock()

    svc = TableSessionService()
    out = await svc.list_active_sessions(session, tid)

    assert len(out) == 1


@pytest.mark.asyncio
async def test_list_active_sessions_expires_stale() -> None:
    tid = uuid4()
    past = datetime.now(UTC) - timedelta(minutes=5)
    stale = _ts_mock(expires_at=past, lock_token="x")

    r_expire = _result_with(all_rows=[stale])
    r_list = _result_with(all_rows=[])

    session = _sql_session()
    session.execute = AsyncMock(side_effect=[r_expire, r_list])
    session.flush = AsyncMock()

    svc = TableSessionService()
    out = await svc.list_active_sessions(session, tid)

    assert out == []
    assert session.flush.await_count >= 1


@pytest.mark.asyncio
async def test_acquire_mobile_session_creates_new() -> None:
    tenant = _make_tenant()
    floor = _result_with(all_rows=[_table_row()])
    expire = _result_with(all_rows=[])
    get_active = _result_with(scalar_id="use-scalar", scalar=None)

    session = _sql_session()
    session.execute = AsyncMock(side_effect=[floor, expire, get_active])
    session.flush = AsyncMock()

    coll = AsyncMock()
    coll.find_one = AsyncMock(return_value=None)
    db = MagicMock()
    db.__getitem__.return_value = coll

    svc = TableSessionService()
    got = await svc.acquire_mobile_session(
        session,
        db,
        tenant=tenant,
        table_number=1,
        table_ref=None,
        lock_token=None,
        session_id="sid-1",
        client_ip="1.1.1.1",
        client_fingerprint="fp",
    )

    assert got.table_ref == "t-1"
    assert got.origin == TableSessionOrigin.MOBILE
    assert got.session_id == "sid-1"
    session.add.assert_called_once()
    session.flush.assert_awaited()


@pytest.mark.asyncio
async def test_acquire_mobile_session_waiter_active_raises() -> None:
    tenant = _make_tenant()
    floor = _result_with(all_rows=[_table_row()])
    expire = _result_with(all_rows=[])
    wait = _ts_mock(origin=TableSessionOrigin.WAITER)
    get_active = _result_with(scalar_id="use-scalar", scalar=wait)

    session = _sql_session()
    session.execute = AsyncMock(side_effect=[floor, expire, get_active])

    db = MagicMock()
    db.__getitem__.return_value = AsyncMock()

    svc = TableSessionService()
    with pytest.raises(ConflictError, match="served by staff"):
        await svc.acquire_mobile_session(
            session,
            db,
            tenant=tenant,
            table_number=1,
            table_ref=None,
            lock_token=None,
            session_id=None,
            client_ip=None,
            client_fingerprint=None,
        )


@pytest.mark.asyncio
async def test_acquire_mobile_session_refresh_same_lock() -> None:
    tenant = _make_tenant()
    mobile = _ts_mock(lock_token="same", table_ref="t-1")
    floor = _result_with(all_rows=[_table_row()])
    expire = _result_with(all_rows=[])
    get_active = _result_with(scalar_id="use-scalar", scalar=mobile)

    session = _sql_session()
    session.execute = AsyncMock(side_effect=[floor, expire, get_active])
    session.flush = AsyncMock()

    db = MagicMock()
    coll = AsyncMock()
    coll.find_one = AsyncMock(return_value=None)
    db.__getitem__.return_value = coll

    svc = TableSessionService()
    out = await svc.acquire_mobile_session(
        session,
        db,
        tenant=tenant,
        table_number=1,
        table_ref=None,
        lock_token="same",
        session_id="new-sid",
        client_ip="2.2.2.2",
        client_fingerprint="g",
    )

    assert out is mobile
    assert out.session_id == "new-sid"


@pytest.mark.asyncio
async def test_acquire_mobile_session_other_mobile_lock_raises() -> None:
    tenant = _make_tenant()
    mobile = _ts_mock(lock_token="a", table_ref="t-1")
    floor = _result_with(all_rows=[_table_row()])
    expire = _result_with(all_rows=[])
    get_active = _result_with(scalar_id="use-scalar", scalar=mobile)

    session = _sql_session()
    session.execute = AsyncMock(side_effect=[floor, expire, get_active])
    db = MagicMock()
    db.__getitem__.return_value = AsyncMock()

    svc = TableSessionService()
    with pytest.raises(ConflictError, match="unavailable"):
        await svc.acquire_mobile_session(
            session,
            db,
            tenant=tenant,
            table_number=1,
            table_ref=None,
            lock_token="b",
            session_id=None,
            client_ip=None,
            client_fingerprint=None,
        )


@pytest.mark.asyncio
async def test_acquire_mobile_session_kitchen_order_blocks() -> None:
    tenant = _make_tenant()
    floor = _result_with(all_rows=[_table_row()])
    expire = _result_with(all_rows=[])
    get_active = _result_with(scalar_id="use-scalar", scalar=None)

    session = _sql_session()
    session.execute = AsyncMock(side_effect=[floor, expire, get_active])
    coll = AsyncMock()
    coll.find_one = AsyncMock(return_value={"_id": "k1"})
    db = MagicMock()
    db.__getitem__.return_value = coll

    svc = TableSessionService()
    with pytest.raises(ConflictError, match="served by staff"):
        await svc.acquire_mobile_session(
            session,
            db,
            tenant=tenant,
            table_number=1,
            table_ref=None,
            lock_token=None,
            session_id=None,
            client_ip=None,
            client_fingerprint=None,
        )


@pytest.mark.asyncio
async def test_refresh_mobile_session() -> None:
    lock = "lt-x"
    mobile = _ts_mock(lock_token=lock)
    r1 = _result_with(scalar_id="use-scalar", scalar=mobile)

    session = _sql_session()
    session.execute = AsyncMock(side_effect=[r1])
    session.flush = AsyncMock()

    svc = TableSessionService()
    out = await svc.refresh_mobile_session(
        session, lock_token=lock, client_ip="1.1.1.1", client_fingerprint="f"
    )

    assert out is mobile
    session.flush.assert_awaited()


@pytest.mark.asyncio
async def test_refresh_mobile_session_not_active() -> None:
    lock = "lt-x"
    done = _ts_mock(lock_token=lock, status=TableSessionStatus.RELEASED)
    r1 = _result_with(scalar_id="use-scalar", scalar=done)
    session = _sql_session()
    session.execute = AsyncMock(return_value=r1)
    session.flush = AsyncMock()

    svc = TableSessionService()
    with pytest.raises(ConflictError, match="no longer active"):
        await svc.refresh_mobile_session(
            session, lock_token=lock, client_ip=None, client_fingerprint=None
        )


@pytest.mark.asyncio
async def test_refresh_mobile_session_not_mobile_origin() -> None:
    lock = "lt-x"
    waiter = _ts_mock(lock_token=lock, origin=TableSessionOrigin.WAITER)
    r1 = _result_with(scalar_id="use-scalar", scalar=waiter)
    session = _sql_session()
    session.execute = AsyncMock(return_value=r1)
    session.flush = AsyncMock()

    svc = TableSessionService()
    with pytest.raises(ConflictError, match="Only mobile"):
        await svc.refresh_mobile_session(
            session, lock_token=lock, client_ip=None, client_fingerprint=None
        )


@pytest.mark.asyncio
async def test_release_mobile_session() -> None:
    lock = "lt-r"
    mobile = _ts_mock(lock_token=lock)
    r1 = _result_with(scalar_id="use-scalar", scalar=mobile)
    session = _sql_session()
    session.execute = AsyncMock(return_value=r1)
    session.flush = AsyncMock()

    svc = TableSessionService()
    out = await svc.release_mobile_session(session, lock_token=lock)

    assert out.status == TableSessionStatus.RELEASED
    session.flush.assert_awaited()


@pytest.mark.asyncio
async def test_mark_completed_by_session_id() -> None:
    ts = _ts_mock()
    r1 = _result_with(all_rows=[ts])
    session = _sql_session()
    session.execute = AsyncMock(return_value=r1)
    session.flush = AsyncMock()

    svc = TableSessionService()
    await svc.mark_completed_by_session_id(session, session_id="s-completed")

    session.flush.assert_awaited()


@pytest.mark.asyncio
async def test_acquire_waiter_session_refresh_waiter() -> None:
    tenant = _make_tenant()
    waiter = _ts_mock(origin=TableSessionOrigin.WAITER, table_ref="tb")
    wuid = uuid4()
    r0 = _result_with(all_rows=[])
    r1 = _result_with(scalar_id="use-scalar", scalar=waiter)

    session = _sql_session()
    session.execute = AsyncMock(side_effect=[r0, r1])
    session.flush = AsyncMock()

    svc = TableSessionService()
    out = await svc.acquire_waiter_session(
        session,
        tenant=tenant,
        table_ref="tb",
        table_label="Lab",
        waiter_user_id=wuid,
    )

    assert out is waiter
    assert out.waiter_user_id == wuid
    session.flush.assert_awaited()


@pytest.mark.asyncio
async def test_acquire_waiter_session_mobile_lock_raises() -> None:
    tenant = _make_tenant()
    mobile = _ts_mock(origin=TableSessionOrigin.MOBILE, table_ref="tb")
    r0 = _result_with(all_rows=[])
    r1 = _result_with(scalar_id="use-scalar", scalar=mobile)
    session = _sql_session()
    session.execute = AsyncMock(side_effect=[r0, r1])

    svc = TableSessionService()
    with pytest.raises(ConflictError, match="locked by a mobile"):
        await svc.acquire_waiter_session(
            session, tenant=tenant, table_ref="tb", table_label="L", waiter_user_id=None
        )


@pytest.mark.asyncio
async def test_acquire_waiter_session_creates() -> None:
    tenant = _make_tenant()
    r0 = _result_with(all_rows=[])
    r1 = _result_with(scalar_id="use-scalar", scalar=None)
    session = _sql_session()
    session.execute = AsyncMock(side_effect=[r0, r1])
    session.flush = AsyncMock()

    svc = TableSessionService()
    out = await svc.acquire_waiter_session(
        session,
        tenant=tenant,
        table_ref="n1",
        table_label="L2",
        waiter_user_id=None,
        table_number=2,
    )

    assert out.table_ref == "n1"
    assert out.origin == TableSessionOrigin.WAITER
    session.add.assert_called_once()
    session.flush.assert_awaited()


@pytest.mark.asyncio
async def test_release_waiter_table_none() -> None:
    tid = uuid4()
    r0 = _result_with(all_rows=[])
    r1 = _result_with(scalar_id="use-scalar", scalar=None)
    session = _sql_session()
    session.execute = AsyncMock(side_effect=[r0, r1])
    session.flush = AsyncMock()

    svc = TableSessionService()
    out = await svc.release_waiter_table(
        session, tenant_id=tid, table_ref="t", actor_user_id=uuid4(), reason="x"
    )

    assert out is None


@pytest.mark.asyncio
async def test_release_waiter_table_with_audit() -> None:
    tid = uuid4()
    ts = _ts_mock()
    r0 = _result_with(all_rows=[])
    r1 = _result_with(scalar_id="use-scalar", scalar=ts)
    session = _sql_session()
    session.execute = AsyncMock(side_effect=[r0, r1])
    session.flush = AsyncMock()

    svc = TableSessionService()
    out = await svc.release_waiter_table(
        session, tenant_id=tid, table_ref="t", actor_user_id=uuid4(), reason="pos closed"
    )

    assert out is ts
    add_args = [c.args[0] for c in session.add.call_args_list if c.args]
    assert any(isinstance(x, AuditLog) for x in add_args)


@pytest.mark.asyncio
async def test_release_by_table_ref_noop() -> None:
    session = _sql_session()
    svc = TableSessionService()
    await svc.release_by_table_ref(session, tenant_id=uuid4(), table_ref=None)
    session.execute.assert_not_called()


@pytest.mark.asyncio
async def test_release_by_table_ref_no_session() -> None:
    tid = uuid4()
    r0 = _result_with(all_rows=[])
    r1 = _result_with(scalar_id="use-scalar", scalar=None)
    session = _sql_session()
    session.execute = AsyncMock(side_effect=[r0, r1])
    session.flush = AsyncMock()

    svc = TableSessionService()
    await svc.release_by_table_ref(session, tenant_id=tid, table_ref="z")

    session.flush.assert_not_called()


@pytest.mark.asyncio
async def test_release_by_table_ref_completes() -> None:
    tid = uuid4()
    ts = _ts_mock()
    r0 = _result_with(all_rows=[])
    r1 = _result_with(scalar_id="use-scalar", scalar=ts)
    session = _sql_session()
    session.execute = AsyncMock(side_effect=[r0, r1])
    session.flush = AsyncMock()

    svc = TableSessionService()
    await svc.release_by_table_ref(
        session, tenant_id=tid, table_ref="z", final_status=TableSessionStatus.COMPLETED
    )

    assert ts.status == TableSessionStatus.COMPLETED
    session.flush.assert_awaited()


@pytest.mark.asyncio
async def test_get_by_lock_token_not_found() -> None:
    r1 = _result_with(scalar_id="use-scalar", scalar=None)
    session = _sql_session()
    session.execute = AsyncMock(return_value=r1)
    svc = TableSessionService()
    with pytest.raises(NotFoundResponse):
        await svc._get_by_lock_token(session, "missing")


@pytest.mark.asyncio
async def test_resolve_new_lock_token_preferred_free() -> None:
    r_check = _result_with(scalar_id="use-scalar", scalar=None)
    session = _sql_session()
    session.execute = AsyncMock(return_value=r_check)
    svc = TableSessionService()
    out = await svc._resolve_new_lock_token(session, "my-pref")
    assert out == "my-pref"


@pytest.mark.asyncio
async def test_resolve_new_lock_token_preferred_taken() -> None:
    r_check = _result_with(scalar_id="use-scalar", scalar=uuid4())
    session = _sql_session()
    session.execute = AsyncMock(return_value=r_check)
    svc = TableSessionService()
    out = await svc._resolve_new_lock_token(session, "taken")
    assert len(out) > 0


@pytest.mark.asyncio
async def test_list_table_refs_with_active_kitchen_orders() -> None:
    async def adocs() -> object:
        yield {"tableId": "a"}
        yield {"tableId": "  "}
        yield {"tableId": "b"}

    coll = MagicMock()
    coll.find.return_value = adocs()
    db = MagicMock()
    db.__getitem__.return_value = coll

    svc = TableSessionService()
    refs = await svc.list_table_refs_with_active_kitchen_orders(db, tenant_public_id="r1")
    assert refs == {"a", "b"}


@pytest.mark.asyncio
async def test_has_active_waiter_order() -> None:
    coll = AsyncMock()
    coll.find_one = AsyncMock(return_value={"_id": "1"})
    db = MagicMock()
    db.__getitem__.return_value = coll

    svc = TableSessionService()
    assert await svc._has_active_waiter_order(db, "p", "tref") is True


def test_hash_value_and_generate_token() -> None:
    svc = TableSessionService()
    assert svc._hash_value(None) is None
    assert len(svc._hash_value("x") or "") == 64  # noqa: PLR2004
    assert len(svc._generate_lock_token()) > 0
