from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

from core.models.enums import TenantStatus
from routes.v1.mappers.tenant_mappers import (
    floor_canvas_to_response,
    tenant_to_response,
    tenant_to_summary,
)


def test_floor_canvas_to_response() -> None:
    expected_version = 2
    cid, tid = uuid4(), uuid4()
    now = datetime.now(UTC)
    canvas = SimpleNamespace(
        id=cid,
        tenant_id=tid,
        name="C1",
        width=10,
        height=20,
        elements=[],
        version=expected_version,
        created_at=now,
        updated_at=now,
    )
    r = floor_canvas_to_response(canvas)
    assert r.id == cid
    assert r.tenant_id == tid
    assert r.version == expected_version


def test_tenant_to_response_includes_canvases() -> None:
    now = datetime.now(UTC)
    cid, tid = uuid4(), uuid4()
    canvas = SimpleNamespace(
        id=cid,
        tenant_id=tid,
        name="C1",
        width=1,
        height=1,
        elements=[],
        version=1,
        created_at=now,
        updated_at=now,
    )
    t = SimpleNamespace(
        public_id="pub-1",
        name="N",
        slug="s",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[canvas],
        created_at=now,
    )
    r = tenant_to_response(t)
    assert r.name == "N"
    assert len(r.floor_canvases) == 1


def test_tenant_to_summary_counts_canvases() -> None:
    expected_count = 2
    now = datetime.now(UTC)
    t = SimpleNamespace(
        public_id="pub-1",
        name="N",
        slug="s",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[object(), object()],
        created_at=now,
    )
    r = tenant_to_summary(t)
    assert r.floor_canvas_count == expected_count
