from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from core.dto.v1.floor_canvases.requests import (
    CreateFloorCanvasDTO,
    FloorTableElementDTO,
    UpdateFloorCanvasDTO,
)
from core.exceptions import NotFoundResponse, ValidationError
from services.floor_canvas_service import FloorCanvasService


def _session_exec_chain(*results: MagicMock) -> tuple[MagicMock, AsyncMock]:
    session = MagicMock()
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.delete = AsyncMock()
    session.refresh = AsyncMock()
    session.flush = AsyncMock()
    session.execute = AsyncMock(side_effect=list(results))
    return session, session.execute


@pytest.mark.asyncio
async def test_list_canvases_raises_when_tenant_missing() -> None:
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=None)
    session = MagicMock()
    session.execute = AsyncMock(return_value=r1)
    with pytest.raises(NotFoundResponse):
        await FloorCanvasService().list_canvases(session, uuid4())


@pytest.mark.asyncio
async def test_list_canvases_returns_rows() -> None:
    tid = uuid4()
    c1 = SimpleNamespace(
        id=uuid4(), tenant_id=tid, name="A", version=1, created_at=object(), elements=[]
    )
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=tid)
    r2 = MagicMock()
    r2.scalars.return_value.all.return_value = [c1]
    session, _ = _session_exec_chain(r1, r2)

    svc = FloorCanvasService()
    out = await svc.list_canvases(session, tid)
    assert out == [c1]


@pytest.mark.asyncio
async def test_get_canvas_not_found() -> None:
    tid, cid = uuid4(), uuid4()
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=None)
    session, _ = _session_exec_chain(r1)

    svc = FloorCanvasService()
    with pytest.raises(NotFoundResponse):
        await svc.get_canvas(session, tid, cid)


@pytest.mark.asyncio
async def test_create_canvas() -> None:
    tid = uuid4()
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=tid)
    session, _ = _session_exec_chain(r1)
    data = CreateFloorCanvasDTO(
        name="C",
        width=10,
        height=10,
        elements=[
            FloorTableElementDTO(
                id="e1", x=0, y=0, w=4, h=4, table_number=1, seats=2, rotation=None, zone_id=None
            )
        ],
    )
    svc = FloorCanvasService()
    c = await svc.create_canvas(session, tid, data)
    assert c.name == "C"
    session.add.assert_called_once()
    session.commit.assert_awaited_once()


def test_ensure_valid_table_numeration() -> None:
    svc = FloorCanvasService()
    svc.ensure_valid_table_numeration(None)
    svc.ensure_valid_table_numeration([])
    svc.ensure_valid_table_numeration([{"type": "x"}])
    svc.ensure_valid_table_numeration(
        [
            {"type": "table", "tableNumber": 1},
            {"type": "table", "tableNumber": 2},
        ]
    )
    with pytest.raises(ValidationError):
        svc.ensure_valid_table_numeration(
            [
                {"type": "table", "tableNumber": 1},
                {"type": "table", "tableNumber": 1},
            ]
        )
    with pytest.raises(ValidationError):
        svc.ensure_valid_table_numeration([{"type": "table", "tableNumber": 0}])
    with pytest.raises(ValidationError):
        svc.ensure_valid_table_numeration([{"type": "table", "tableNumber": "a"}])  # type: ignore[dict-item]
    with pytest.raises(ValidationError):
        svc.ensure_valid_table_numeration(
            [
                {"type": "table", "tableNumber": 1},
                {"type": "table", "tableNumber": 3},
            ]
        )


@pytest.mark.asyncio
async def test_list_versions_delegates() -> None:
    tid, cid = uuid4(), uuid4()
    canvas = SimpleNamespace(
        id=cid, tenant_id=tid, name="n", version=2, elements=[], width=1, height=1
    )
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=canvas)
    session, _ = _session_exec_chain(r1)
    with patch("services.floor_canvas_service.get_canvas_versions", new_callable=AsyncMock) as gv:
        gv.return_value = [{"v": 1}]
        svc = FloorCanvasService()
        v = await svc.list_versions(session, tid, cid)
    assert v == [{"v": 1}]


@pytest.mark.asyncio
async def test_get_version_from_canvas_when_version_matches() -> None:
    tid, cid = uuid4(), uuid4()
    canvas = SimpleNamespace(
        id=cid,
        tenant_id=tid,
        name="n",
        version=2,
        elements=[],
        width=1,
        height=1,
        created_at=MagicMock(isoformat=lambda: "a"),
        updated_at=MagicMock(isoformat=lambda: "b"),
    )
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=canvas)
    session, _ = _session_exec_chain(r1)
    svc = FloorCanvasService()
    doc = await svc.get_version(session, tid, cid, 2)
    assert doc["version"] == 2  # noqa: PLR2004


@pytest.mark.asyncio
async def test_get_version_from_archive() -> None:
    tid, cid = uuid4(), uuid4()
    canvas = SimpleNamespace(
        id=cid,
        tenant_id=tid,
        name="n",
        version=2,
        elements=[],
        width=1,
        height=1,
        created_at=MagicMock(isoformat=lambda: "a"),
        updated_at=MagicMock(isoformat=lambda: "b"),
    )
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=canvas)
    session, _ = _session_exec_chain(r1)
    with patch("services.floor_canvas_service.get_archived_version", new_callable=AsyncMock) as ga:
        ga.return_value = {"version": 1, "id": "x"}
        svc = FloorCanvasService()
        doc = await svc.get_version(session, tid, cid, 1)
    assert doc["version"] == 1


@pytest.mark.asyncio
async def test_update_canvas() -> None:
    tid, cid = uuid4(), uuid4()
    canvas = SimpleNamespace(
        id=cid,
        tenant_id=tid,
        name="a",
        version=1,
        elements=[],
        width=4,
        height=4,
        created_at=MagicMock(),
        updated_at=MagicMock(),
    )
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=canvas)
    session, _ = _session_exec_chain(r1)
    el = FloorTableElementDTO(
        id="e1", x=0, y=0, w=1, h=1, table_number=1, seats=2, rotation=None, zone_id=None
    )
    with patch("services.floor_canvas_service.archive_canvas_version", new_callable=AsyncMock):
        svc = FloorCanvasService()
        c = await svc.update_canvas(
            session, tid, cid, UpdateFloorCanvasDTO(name="B", elements=[el], width=5, height=5)
        )
    assert c.name == "B"
    assert c.version == 2  # noqa: PLR2004


@pytest.mark.asyncio
async def test_delete_canvas() -> None:
    tid, cid = uuid4(), uuid4()
    canvas = SimpleNamespace(
        id=cid,
        tenant_id=tid,
        name="a",
        version=1,
        elements=[],
        width=1,
        height=1,
    )
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=canvas)
    session, _ = _session_exec_chain(r1)
    svc = FloorCanvasService()
    await svc.delete_canvas(session, tid, cid)
    session.delete.assert_awaited_once()
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_version_archived_not_found() -> None:
    tid, cid = uuid4(), uuid4()
    canvas = SimpleNamespace(
        id=cid,
        tenant_id=tid,
        name="n",
        version=2,
        elements=[],
        width=1,
        height=1,
        created_at=MagicMock(isoformat=lambda: "a"),
        updated_at=MagicMock(isoformat=lambda: "b"),
    )
    r1 = MagicMock()
    r1.scalar_one_or_none = MagicMock(return_value=canvas)
    session, _ = _session_exec_chain(r1)
    with patch("services.floor_canvas_service.get_archived_version", new_callable=AsyncMock) as ga:
        ga.return_value = None
        svc = FloorCanvasService()
        with pytest.raises(NotFoundResponse):
            await svc.get_version(session, tid, cid, 1)
