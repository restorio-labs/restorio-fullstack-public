from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from services.tenant_mobile_config_service import TenantMobileConfigService


@pytest.mark.asyncio
async def test_get_by_tenant_id() -> None:
    tid = uuid4()
    row = SimpleNamespace(tenant_id=tid)
    r = MagicMock()
    r.scalar_one_or_none = MagicMock(return_value=row)
    s = MagicMock()
    s.execute = AsyncMock(return_value=r)
    out = await TenantMobileConfigService().get_by_tenant_id(s, tid)
    assert out is row
    s.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_upsert_creates() -> None:
    tid = uuid4()
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=None)
    s = MagicMock()
    s.add = MagicMock()
    s.flush = AsyncMock()
    s.execute = AsyncMock(return_value=r1)

    out = await TenantMobileConfigService().upsert(
        s, tid, page_title="P", theme_override=None, landing_content=None
    )
    assert out.page_title == "P"
    s.add.assert_called_once()
    s.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_upsert_updates() -> None:
    tid = uuid4()
    existing = SimpleNamespace(
        tenant_id=tid, page_title="Old", theme_override={}, landing_content={}
    )
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=existing)
    s = MagicMock()
    s.execute = AsyncMock(return_value=r1)
    s.flush = AsyncMock()

    out = await TenantMobileConfigService().upsert(
        s, tid, page_title="New", theme_override=None, landing_content=None
    )
    assert out.page_title == "New"
    s.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_copy_theme_from() -> None:
    src, dst = uuid4(), uuid4()
    source_row = SimpleNamespace(tenant_id=src, theme_override={"a": 1})
    n = 0

    async def ex(q: object) -> MagicMock:
        nonlocal n
        n += 1
        r = MagicMock()
        if n == 1:
            r.scalar_one_or_none = MagicMock(return_value=source_row)
        else:
            r.scalar_one_or_none = MagicMock(return_value=None)
        return r

    s = MagicMock()
    s.add = MagicMock()
    s.flush = AsyncMock()
    s.execute = ex
    out = await TenantMobileConfigService().copy_theme_override_from(s, dst, src)
    assert out.theme_override == {"a": 1}


@pytest.mark.asyncio
async def test_set_favicon_creates() -> None:
    tid = uuid4()
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=None)
    s = MagicMock()
    s.execute = AsyncMock(return_value=r1)
    s.add = MagicMock()
    s.flush = AsyncMock()
    out = await TenantMobileConfigService().set_favicon_key(s, tid, "k1")
    assert out.favicon_object_key == "k1"


@pytest.mark.asyncio
async def test_set_favicon_updates_existing() -> None:
    tid = uuid4()
    existing = SimpleNamespace(
        tenant_id=tid,
        favicon_object_key="old",
        page_title="T",
        theme_override=None,
        landing_content=None,
    )
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=existing)
    s = MagicMock()
    s.execute = AsyncMock(return_value=r1)
    s.flush = AsyncMock()
    out = await TenantMobileConfigService().set_favicon_key(s, tid, "k2")
    assert out.favicon_object_key == "k2"
    s.add.assert_not_called()
    s.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_copy_theme_override_updates_existing() -> None:
    dst, src = uuid4(), uuid4()
    source_row = SimpleNamespace(tenant_id=src, theme_override={"a": 1})
    target_existing = SimpleNamespace(
        tenant_id=dst,
        theme_override={"b": 2},
        page_title="P",
        landing_content=None,
        favicon_object_key=None,
    )
    n = 0

    async def ex(_q: object) -> MagicMock:
        nonlocal n
        n += 1
        r = MagicMock()
        if n == 1:
            r.scalar_one_or_none = MagicMock(return_value=source_row)
        else:
            r.scalar_one_or_none = MagicMock(return_value=target_existing)
        return r

    s = MagicMock()
    s.execute = ex
    s.flush = AsyncMock()
    out = await TenantMobileConfigService().copy_theme_override_from(s, dst, src)
    assert out is target_existing
    assert out.theme_override == {"a": 1}
    s.add.assert_not_called()
    s.flush.assert_awaited_once()
