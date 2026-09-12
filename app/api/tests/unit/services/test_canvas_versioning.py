from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from core.models.floor_canvas import FloorCanvas
from services.canvas_versioning import (
    archive_canvas_version,
    get_canvas_version,
    get_canvas_versions,
)


@pytest.mark.asyncio
async def test_archive_canvas_version_inserts_document() -> None:
    tenant_id = uuid4()
    canvas_id = uuid4()
    now = datetime.now(UTC)
    canvas = FloorCanvas(
        id=canvas_id,
        tenant_id=tenant_id,
        name="Main",
        width=800,
        height=600,
        elements=[{"type": "table"}],
        version=2,
        created_at=now,
        updated_at=now,
    )

    mock_coll = AsyncMock()
    mock_db = MagicMock()
    mock_db.__getitem__.return_value = mock_coll

    with patch("services.canvas_versioning.get_mongo_db", return_value=mock_db):
        await archive_canvas_version(canvas)

    mock_coll.insert_one.assert_awaited_once()
    inserted = mock_coll.insert_one.call_args[0][0]
    assert inserted["canvas_id"] == str(canvas_id)
    assert inserted["tenant_id"] == str(tenant_id)
    assert inserted["version"] == 2  # noqa: PLR2004


@pytest.mark.asyncio
async def test_get_canvas_version_delegates_to_find_one() -> None:
    cid = uuid4()
    doc = {"canvas_id": str(cid), "version": 1}
    mock_coll = AsyncMock()
    mock_coll.find_one = AsyncMock(return_value=doc)
    mock_db = MagicMock()
    mock_db.__getitem__.return_value = mock_coll

    with patch("services.canvas_versioning.get_mongo_db", return_value=mock_db):
        result = await get_canvas_version(cid, 1)

    assert result == doc
    mock_coll.find_one.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_canvas_versions_returns_cursor_list() -> None:
    cid = uuid4()
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[{"version": 2}])
    mock_coll = MagicMock()
    mock_coll.find.return_value.limit.return_value = mock_cursor
    mock_db = MagicMock()
    mock_db.__getitem__.return_value = mock_coll

    with patch("services.canvas_versioning.get_mongo_db", return_value=mock_db):
        result = await get_canvas_versions(cid, limit=10)

    assert result == [{"version": 2}]
