from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from starlette.requests import Request
from starlette.responses import Response

from core.dto.v1 import CreateTenantDTO, UpdateTenantDTO
from core.foundation.http.responses import UnauthenticatedResponse
from core.models.enums import AccountType, TenantStatus
from routes.v1.tenants import tenants as tenants_routes


def _req_with_user() -> Request:
    r = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    r.state.user = {"sub": str(uuid4()), "account_type": AccountType.OWNER.value}
    return r


def _req_sub_invalid() -> Request:
    r = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    r.state.user = {"sub": "not-uuid", "account_type": AccountType.OWNER.value}
    return r


@pytest.mark.asyncio
async def test_list_tenants_success() -> None:
    t = SimpleNamespace(
        public_id="p1",
        name="A",
        slug="a",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[],
        created_at=datetime.now(UTC),
    )
    svc = MagicMock()
    svc.list_tenants = AsyncMock(return_value=[t])
    r = await tenants_routes.list_tenants(_req_with_user(), MagicMock(), svc)  # type: ignore[arg-type]
    assert len(r.data) == 1


@pytest.mark.asyncio
async def test_list_tenants_unauthenticated() -> None:
    r = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    with pytest.raises(UnauthenticatedResponse):
        await tenants_routes.list_tenants(r, MagicMock(), MagicMock())  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_list_tenants_rejects_non_uuid_sub() -> None:
    with pytest.raises(ValueError, match="badly formed hexadecimal"):
        await tenants_routes.list_tenants(_req_sub_invalid(), MagicMock(), MagicMock())  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_create_tenant() -> None:
    out = SimpleNamespace(
        public_id="pub",
        name="B",
        slug="b",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[],
        created_at=datetime.now(UTC),
    )
    svc = MagicMock()
    svc.create_tenant = AsyncMock(return_value=out)
    body = CreateTenantDTO(name="B", slug="b", status=TenantStatus.ACTIVE)
    session = MagicMock()
    session.scalars = AsyncMock(return_value=[])
    session.execute = AsyncMock(return_value=MagicMock(all=MagicMock(return_value=[])))
    session.scalar = AsyncMock(return_value=None)
    security = MagicMock()
    security.create_access_token = MagicMock(return_value="t")

    with patch("routes.v1.tenants.tenants.set_auth_cookies"):
        r = await tenants_routes.create_tenant(
            AccountType.OWNER,
            _req_with_user(),
            Response(),
            body,
            session,
            svc,
            security,
        )
    assert "created" in r.message
    assert r.data.id == "pub"


@pytest.mark.asyncio
async def test_get_tenant() -> None:
    tid = uuid4()
    t = SimpleNamespace(
        public_id="pub",
        name="A",
        slug="a",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[],
        created_at=datetime.now(UTC),
    )
    svc = MagicMock()
    svc.get_tenant = AsyncMock(return_value=t)
    r = await tenants_routes.get_tenant(tid, MagicMock(), svc)  # type: ignore[arg-type]
    assert r.data.slug == "a"


@pytest.mark.asyncio
async def test_update_tenant() -> None:
    tid = uuid4()
    t = SimpleNamespace(
        public_id="pub",
        name="N",
        slug="n",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[],
        created_at=datetime.now(UTC),
    )
    svc = MagicMock()
    svc.update_tenant = AsyncMock(return_value=t)
    r = await tenants_routes.update_tenant(  # type: ignore[call-arg]
        AccountType.OWNER,
        tid,
        UpdateTenantDTO(name="N", slug="n", status=TenantStatus.ACTIVE),
        MagicMock(),
        svc,
    )
    assert "updated" in r.message


@pytest.mark.asyncio
async def test_delete_tenant() -> None:
    tid = uuid4()
    svc = MagicMock()
    svc.delete_tenant = AsyncMock()
    r = await tenants_routes.delete_tenant(AccountType.OWNER, tid, MagicMock(), svc)  # type: ignore[arg-type]
    assert "deleted" in r.message
