from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from routes.v1.public.public import get_public_tables_overview

_CANVAS_W = 400
_CANVAS_H = 300
_TABLE_COUNT = 2
_TABLE_TWO = 2


@pytest.mark.asyncio
async def test_tables_overview_returns_empty_canvases_when_no_floor_data() -> None:
    tenant_id = uuid4()
    tenant = MagicMock()
    tenant.id = tenant_id
    tenant.slug = "cafe"

    tenant_service = MagicMock()
    tenant_service.get_tenant_by_slug = AsyncMock(return_value=tenant)

    table_session_service = MagicMock()
    table_session_service.list_active_sessions = AsyncMock(return_value=[])
    table_session_service.list_table_refs_with_active_kitchen_orders = AsyncMock(return_value=set())

    result_mock = MagicMock()
    result_mock.scalars.return_value.all.return_value = []
    session = AsyncMock()
    session.execute = AsyncMock(return_value=result_mock)

    db = MagicMock()

    response = await get_public_tables_overview(
        "cafe",
        session,
        tenant_service,
        table_session_service,
        db,
    )

    assert response.message == "Tables overview retrieved"
    assert response.data.canvases == []


@pytest.mark.asyncio
async def test_tables_overview_marks_locked_tables_closed() -> None:
    tenant_id = uuid4()
    tenant = MagicMock()
    tenant.id = tenant_id
    tenant.slug = "bistro"
    tenant.public_id = "pub-bistro"

    tenant_service = MagicMock()
    tenant_service.get_tenant_by_slug = AsyncMock(return_value=tenant)

    locked = MagicMock()
    locked.table_ref = "table-ref-1"
    table_session_service = MagicMock()
    table_session_service.list_active_sessions = AsyncMock(return_value=[locked])
    table_session_service.list_table_refs_with_active_kitchen_orders = AsyncMock(return_value=set())

    floor = MagicMock()
    floor.name = "Main"
    floor.width = _CANVAS_W
    floor.height = _CANVAS_H
    floor.elements = [
        {
            "type": "table",
            "id": "table-ref-1",
            "tableNumber": 1,
            "label": "Window",
            "x": 10,
            "y": 20,
            "w": 60,
            "h": 50,
            "seats": 2,
        },
        {
            "type": "table",
            "id": "table-ref-2",
            "tableNumber": 2,
            "x": 100,
            "y": 20,
            "w": 60,
            "h": 50,
        },
        {"type": "wall", "id": "w1"},
    ]

    result_mock = MagicMock()
    result_mock.scalars.return_value.all.return_value = [floor]
    session = AsyncMock()
    session.execute = AsyncMock(return_value=result_mock)

    db = MagicMock()

    response = await get_public_tables_overview(
        "bistro",
        session,
        tenant_service,
        table_session_service,
        db,
    )

    assert len(response.data.canvases) == 1
    canvas = response.data.canvases[0]
    assert canvas.name == "Main"
    assert canvas.width == _CANVAS_W
    assert canvas.height == _CANVAS_H
    assert len(canvas.tables) == _TABLE_COUNT

    by_id = {t.id: t for t in canvas.tables}
    assert by_id["table-ref-1"].status == "closed"
    assert by_id["table-ref-1"].table_number == 1
    assert by_id["table-ref-1"].label == "Window"
    assert by_id["table-ref-2"].status == "open"
    assert by_id["table-ref-2"].table_number == _TABLE_TWO


@pytest.mark.asyncio
async def test_tables_overview_marks_kitchen_order_tables_closed_without_postgres_session() -> None:
    tenant_id = uuid4()
    tenant = MagicMock()
    tenant.id = tenant_id
    tenant.slug = "bistro"
    tenant.public_id = "pub-x"

    tenant_service = MagicMock()
    tenant_service.get_tenant_by_slug = AsyncMock(return_value=tenant)

    table_session_service = MagicMock()
    table_session_service.list_active_sessions = AsyncMock(return_value=[])
    table_session_service.list_table_refs_with_active_kitchen_orders = AsyncMock(
        return_value={"table-ref-1"}
    )

    floor = MagicMock()
    floor.name = "Main"
    floor.width = _CANVAS_W
    floor.height = _CANVAS_H
    floor.elements = [
        {
            "type": "table",
            "id": "table-ref-1",
            "tableNumber": 1,
            "x": 10,
            "y": 20,
            "w": 60,
            "h": 50,
        },
        {
            "type": "table",
            "id": "table-ref-2",
            "tableNumber": 2,
            "x": 100,
            "y": 20,
            "w": 60,
            "h": 50,
        },
    ]

    result_mock = MagicMock()
    result_mock.scalars.return_value.all.return_value = [floor]
    session = AsyncMock()
    session.execute = AsyncMock(return_value=result_mock)

    db = MagicMock()

    response = await get_public_tables_overview(
        "bistro",
        session,
        tenant_service,
        table_session_service,
        db,
    )

    by_id = {t.id: t for t in response.data.canvases[0].tables}
    assert by_id["table-ref-1"].status == "closed"
    assert by_id["table-ref-2"].status == "open"


@pytest.mark.asyncio
async def test_tables_overview_skips_non_dict_non_table_and_bad_ids() -> None:
    tenant_id = uuid4()
    tenant = MagicMock()
    tenant.id = tenant_id
    tenant.slug = "cafe"
    tenant.public_id = "pub-c"

    tenant_service = MagicMock()
    tenant_service.get_tenant_by_slug = AsyncMock(return_value=tenant)

    table_session_service = MagicMock()
    table_session_service.list_active_sessions = AsyncMock(return_value=[])
    table_session_service.list_table_refs_with_active_kitchen_orders = AsyncMock(return_value=set())

    floor = MagicMock()
    floor.name = "F"
    floor.width = 100
    floor.height = 100
    floor.elements = [
        "not-a-dict",
        {"type": "wall", "id": "w1"},
        {"type": "table", "id": 99},
        {"type": "table", "id": "   "},
        {
            "type": "table",
            "id": " ok ",
            "tableNumber": 1,
            "x": 0,
            "y": 0,
            "w": 1,
            "h": 1,
            "label": 42,
            "rotation": 0,
        },
    ]

    result_mock = MagicMock()
    result_mock.scalars.return_value.all.return_value = [floor]
    session = AsyncMock()
    session.execute = AsyncMock(return_value=result_mock)
    db = MagicMock()

    response = await get_public_tables_overview(
        "cafe",
        session,
        tenant_service,
        table_session_service,
        db,
    )

    assert len(response.data.canvases) == 1
    assert len(response.data.canvases[0].tables) == 1
    assert response.data.canvases[0].tables[0].id == "ok"
    assert response.data.canvases[0].tables[0].label is None
