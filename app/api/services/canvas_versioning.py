from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from core.constants import CANVAS_VERSIONS_COLLECTION
from core.foundation.database.connection import get_mongo_db
from core.models.floor_canvas import FloorCanvas


async def archive_canvas_version(canvas: FloorCanvas) -> None:
    db = get_mongo_db()
    collection = db[CANVAS_VERSIONS_COLLECTION]

    version_doc = {
        "canvas_id": str(canvas.id),
        "tenant_id": str(canvas.tenant_id),
        "version": canvas.version,
        "name": canvas.name,
        "width": canvas.width,
        "height": canvas.height,
        "elements": canvas.elements,
        "created_at": canvas.created_at.isoformat(),
        "updated_at": canvas.updated_at.isoformat(),
        "archived_at": datetime.now(UTC).isoformat(),
    }

    await collection.insert_one(version_doc)


async def get_canvas_version(canvas_id: UUID, version: int) -> dict[str, Any] | None:
    db = get_mongo_db()
    collection = db[CANVAS_VERSIONS_COLLECTION]

    return await collection.find_one(
        {"canvas_id": str(canvas_id), "version": version},
        sort=[("archived_at", -1)],
    )


async def get_canvas_versions(canvas_id: UUID, limit: int = 50) -> list[dict[str, Any]]:
    db = get_mongo_db()
    collection = db[CANVAS_VERSIONS_COLLECTION]

    cursor = collection.find(
        {"canvas_id": str(canvas_id)},
        sort=[("version", -1)],
    ).limit(limit)

    return await cursor.to_list(length=limit)
