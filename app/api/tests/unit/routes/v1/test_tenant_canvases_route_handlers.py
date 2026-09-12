from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.dto.v1.floor_canvases import (
    CreateFloorCanvasDTO,
    FloorTableElementDTO,
    UpdateFloorCanvasDTO,
)
from routes.v1.tenants import canvases as canvases_routes


@pytest.mark.asyncio
async def test_list_floor_canvases() -> None:
    tid = uuid4()
    now = datetime.now(UTC)
    fc = SimpleNamespace(
        id=uuid4(),
        tenant_id=tid,
        name="C",
        width=1,
        height=1,
        elements=[],
        version=1,
        created_at=now,
        updated_at=now,
    )
    svc = MagicMock()
    svc.list_canvases = AsyncMock(return_value=[fc])
    r = await canvases_routes.list_floor_canvases(tid, MagicMock(), svc)  # type: ignore[arg-type]
    assert len(r.data) == 1


@pytest.mark.asyncio
async def test_get_floor_canvas() -> None:
    tid, cid = uuid4(), uuid4()
    now = datetime.now(UTC)
    fc = SimpleNamespace(
        id=cid,
        tenant_id=tid,
        name="C",
        width=1,
        height=1,
        elements=[],
        version=1,
        created_at=now,
        updated_at=now,
    )
    svc = MagicMock()
    svc.get_canvas = AsyncMock(return_value=fc)
    r = await canvases_routes.get_floor_canvas(tid, cid, MagicMock(), svc)  # type: ignore[arg-type]
    assert r.data.id == cid


@pytest.mark.asyncio
async def test_create_floor_canvas() -> None:
    tid = uuid4()
    el = FloorTableElementDTO(id="e1", x=0, y=0, w=1, h=1, tableNumber=1, seats=2)
    body = CreateFloorCanvasDTO(name="C", width=10, height=8, elements=[el])
    now = datetime.now(UTC)
    fc = SimpleNamespace(
        id=uuid4(),
        tenant_id=tid,
        name=body.name,
        width=body.width,
        height=body.height,
        elements=[],
        version=1,
        created_at=now,
        updated_at=now,
    )
    svc = MagicMock()
    svc.create_canvas = AsyncMock(return_value=fc)
    r = await canvases_routes.create_floor_canvas(tid, body, MagicMock(), svc)  # type: ignore[arg-type]
    assert "created" in r.message
    assert r.data.name == "C"


@pytest.mark.asyncio
async def test_update_floor_canvas() -> None:
    tid, cid = uuid4(), uuid4()
    el = FloorTableElementDTO(id="e1", x=0, y=0, w=1, h=1, tableNumber=1, seats=2)
    body = UpdateFloorCanvasDTO(name="N", elements=[el])
    now = datetime.now(UTC)
    fc = SimpleNamespace(
        id=cid,
        tenant_id=tid,
        name="N",
        width=8,
        height=6,
        elements=[],
        version=2,
        created_at=now,
        updated_at=now,
    )
    svc = MagicMock()
    svc.ensure_valid_table_numeration = MagicMock()
    svc.update_canvas = AsyncMock(return_value=fc)
    r = await canvases_routes.update_floor_canvas(tid, cid, body, MagicMock(), svc)  # type: ignore[arg-type]
    svc.ensure_valid_table_numeration.assert_called_once()
    assert "updated" in r.message


@pytest.mark.asyncio
async def test_delete_floor_canvas() -> None:
    tid, cid = uuid4(), uuid4()
    svc = MagicMock()
    svc.delete_canvas = AsyncMock()
    r = await canvases_routes.delete_floor_canvas(tid, cid, MagicMock(), svc)  # type: ignore[arg-type]
    assert str(cid) in r.message


@pytest.mark.asyncio
async def test_list_canvas_versions() -> None:
    tid, cid = uuid4(), uuid4()
    svc = MagicMock()
    svc.list_versions = AsyncMock(return_value=[{"v": 1}])
    r = await canvases_routes.list_canvas_versions(tid, cid, MagicMock(), svc, limit=5)  # type: ignore[arg-type]
    assert r.data[0]["v"] == 1


@pytest.mark.asyncio
async def test_get_canvas_version() -> None:
    tid, cid = uuid4(), uuid4()
    svc = MagicMock()
    svc.get_version = AsyncMock(return_value={"snapshot": {}})
    r = await canvases_routes.get_canvas_version(tid, cid, 2, MagicMock(), svc)  # type: ignore[arg-type]
    assert r.data["snapshot"] == {}
