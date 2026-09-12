from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from starlette import status
from starlette.requests import Request

from core.dto.v1.public import (
    PublicAcquireTableSessionDTO,
    PublicRefreshTableSessionDTO,
    PublicReleaseTableSessionDTO,
)
from core.exceptions import NotFoundResponse
from core.models.enums import TenantStatus
from core.models.tenant import Tenant
from routes.v1.public import public as public_routes
from services.mongo_menu_service import MENU_COLLECTION


def _tenant() -> Tenant:
    return Tenant(
        id=uuid4(),
        public_id="pub-1",
        name="R",
        slug="r1",
        status=TenantStatus.ACTIVE,
    )


@pytest.mark.asyncio
async def test_get_public_tenant_info() -> None:
    t = _tenant()
    svc = MagicMock()
    svc.get_tenant_by_slug = AsyncMock(return_value=t)
    session = MagicMock()
    mc = SimpleNamespace(
        page_title="P", landing_content=None, theme_override=None, favicon_object_key="k"
    )
    with patch("routes.v1.public.public.tenant_mobile_config_service") as mcs:
        mcs.get_by_tenant_id = AsyncMock(return_value=mc)
        r = await public_routes.get_public_tenant_info("r1", session, svc)  # type: ignore[arg-type]
    assert r.data.name == "R"


@pytest.mark.asyncio
async def test_get_public_tenant_info_with_landing_dict() -> None:
    t = _tenant()
    svc = MagicMock()
    svc.get_tenant_by_slug = AsyncMock(return_value=t)
    session = MagicMock()
    mc = SimpleNamespace(
        page_title="T",
        landing_content={"headline": "H", "uiLocale": "pl"},
        theme_override=None,
        favicon_object_key=None,
    )
    with patch("routes.v1.public.public.tenant_mobile_config_service") as mcs:
        mcs.get_by_tenant_id = AsyncMock(return_value=mc)
        r = await public_routes.get_public_tenant_info("r1", session, svc)  # type: ignore[arg-type]
    assert r.data.landing_content is not None
    assert r.data.landing_content.headline == "H"


@pytest.mark.asyncio
async def test_get_public_tenant_menu_non_dict_menu_treated_as_empty() -> None:
    t = _tenant()
    svc = MagicMock()
    svc.get_tenant_by_slug = AsyncMock(return_value=t)
    coll = MagicMock()
    coll.find_one = AsyncMock(
        return_value={"menu": "bad", "categories": [], "updatedAt": "2020-01-01T00:00:00Z"}
    )

    class _DB:
        def __getitem__(self, name: str) -> MagicMock:
            assert name == MENU_COLLECTION
            return coll

    db = _DB()
    session = MagicMock()
    r = await public_routes.get_public_tenant_menu("r1", session, svc, db)  # type: ignore[arg-type]
    assert r.data.menu == {}


@pytest.mark.asyncio
async def test_get_public_tenant_favicon_stream() -> None:
    t = _tenant()
    svc = MagicMock()
    svc.get_tenant_by_slug = AsyncMock(return_value=t)
    stream = MagicMock()
    stream.read.return_value = b"ico"
    st = MagicMock()
    st.get_object_stream.return_value = stream
    session = MagicMock()
    mc = SimpleNamespace(
        favicon_object_key="key/fav.ico", landing_content=None, page_title=None, theme_override=None
    )
    with patch("routes.v1.public.public.tenant_mobile_config_service") as mcs:
        mcs.get_by_tenant_id = AsyncMock(return_value=mc)
        res = await public_routes.get_public_tenant_favicon("r1", session, svc, st)  # type: ignore[arg-type]
    assert res.status_code == status.HTTP_200_OK
    stream.close.assert_called_once()


@pytest.mark.asyncio
async def test_get_public_tenant_favicon_404() -> None:
    t = _tenant()
    svc = MagicMock()
    svc.get_tenant_by_slug = AsyncMock(return_value=t)
    session = MagicMock()
    with patch("routes.v1.public.public.tenant_mobile_config_service") as mcs:
        mcs.get_by_tenant_id = AsyncMock(return_value=None)
        with pytest.raises(NotFoundResponse):
            await public_routes.get_public_tenant_favicon(  # type: ignore[call-arg]
                "r1", session, svc, MagicMock()
            )


@pytest.mark.asyncio
async def test_get_public_tenant_menu_empty() -> None:
    t = _tenant()
    svc = MagicMock()
    svc.get_tenant_by_slug = AsyncMock(return_value=t)
    coll = MagicMock()
    coll.find_one = AsyncMock(return_value=None)

    class _DB:
        def __getitem__(self, name: str) -> MagicMock:
            assert name == MENU_COLLECTION
            return coll

    db = _DB()
    session = MagicMock()
    r = await public_routes.get_public_tenant_menu("r1", session, svc, db)  # type: ignore[arg-type]
    assert "not yet" in r.message


class _Sess:
    def __init__(self) -> None:
        self.tid = uuid4()
        self.expires = datetime(2026, 1, 1, tzinfo=UTC)
        self.table_ref = "t-1"
        self.origin = SimpleNamespace(value="customer")

    @property
    def lock_token(self) -> str:
        return "lt"

    @property
    def expires_at(self) -> datetime:
        return self.expires


@pytest.mark.asyncio
async def test_get_public_tables_overview() -> None:
    t = _tenant()
    t.id = uuid4()
    svc = MagicMock()
    svc.get_tenant_by_slug = AsyncMock(return_value=t)
    ts = MagicMock()
    srow = _Sess()
    ts.list_active_sessions = AsyncMock(return_value=[srow])
    ts.list_table_refs_with_active_kitchen_orders = AsyncMock(return_value=set())
    canvas = SimpleNamespace(
        name="C",
        width=1,
        height=1,
        elements=[
            {
                "type": "table",
                "id": " t-1 ",
                "tableNumber": 1,
                "x": 0,
                "y": 0,
                "w": 1,
                "h": 1,
                "label": " L ",
                "seats": 2,
            }
        ],
    )
    r_exec = MagicMock()
    r_exec.scalars.return_value.all.return_value = [canvas]
    session = MagicMock()
    session.execute = AsyncMock(return_value=r_exec)
    db = MagicMock()

    r = await public_routes.get_public_tables_overview(  # type: ignore[call-arg]
        "r1", session, svc, ts, db
    )
    assert "overview" in r.message
    assert len(r.data.canvases) == 1


def _ts() -> object:
    return SimpleNamespace(
        lock_token="lt",
        expires_at=datetime(2026, 1, 1, tzinfo=UTC),
        origin=SimpleNamespace(value="customer"),
        table_ref="a",
        table_number=1,
    )


@pytest.mark.asyncio
async def test_refresh_public_table_session() -> None:
    ts = MagicMock()
    ts.refresh_mobile_session = AsyncMock(return_value=_ts())
    session = MagicMock()
    http = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/x",
            "headers": [],
        }
    )
    b = PublicRefreshTableSessionDTO(lock_token="a" * 5)
    r = await public_routes.refresh_public_table_session(  # type: ignore[call-arg]
        b, http, session, ts
    )
    assert "refreshed" in r.message


@pytest.mark.asyncio
async def test_release_public_table_session() -> None:
    ts = MagicMock()
    ts.release_mobile_session = AsyncMock(return_value=_ts())
    session = MagicMock()
    b = PublicReleaseTableSessionDTO(lock_token="a" * 5)
    r = await public_routes.release_public_table_session(b, session, ts)  # type: ignore[call-arg]
    assert "released" in r.message


@pytest.mark.asyncio
async def test_acquire_public_table_session() -> None:
    t = _tenant()
    tsvc = MagicMock()
    tsvc.get_tenant_by_slug = AsyncMock(return_value=t)
    tss = MagicMock()
    tss.acquire_mobile_session = AsyncMock(return_value=_ts())
    coll = MagicMock()
    db = type("DB", (), {"__getitem__": lambda _self, _n: coll})()
    session = MagicMock()
    body = PublicAcquireTableSessionDTO(
        tenant_slug="r1", table_number=1, table_ref="a", lock_token="x"
    )
    http = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/x",
            "headers": [],
        }
    )
    r = await public_routes.acquire_public_table_session(  # type: ignore[call-arg]
        body, http, session, tsvc, tss, db
    )
    assert "acquired" in r.message
