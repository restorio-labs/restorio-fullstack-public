from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.dto.v1.tenants import CreateTenantDTO, UpdateTenantDTO
from core.exceptions import NotFoundResponse
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from services.tenant_service import TenantService


@pytest.mark.asyncio
async def test_list_tenants_accepts_user_id_and_returns_list() -> None:
    service = TenantService()
    user_id = uuid4()

    async def fake_execute(_self: object, query: object) -> object:
        class FakeScalars:
            def all(self) -> list[object]:
                return []

        class FakeResult:
            def scalars(self) -> FakeScalars:
                return FakeScalars()

        return FakeResult()

    class FakeSession:
        execute = fake_execute

    session = FakeSession()
    tenants = await service.list_tenants(session, user_id)

    assert tenants == []


@pytest.mark.asyncio
async def test_list_tenants_returns_tenants_from_execute_result() -> None:
    service = TenantService()
    user_id = uuid4()
    tenant = Tenant(
        id=uuid4(),
        name="Test Tenant",
        slug="test-tenant",
        status=TenantStatus.ACTIVE,
    )

    async def fake_execute(_self: object, query: object) -> object:
        class FakeScalars:
            def all(self) -> list[Tenant]:
                return [tenant]

        class FakeResult:
            def scalars(self) -> FakeScalars:
                return FakeScalars()

        return FakeResult()

    class FakeSession:
        execute = fake_execute

    session = FakeSession()
    tenants = await service.list_tenants(session, user_id)

    assert len(tenants) == 1
    assert tenants[0].id == tenant.id
    assert tenants[0].name == tenant.name


@pytest.mark.asyncio
async def test_create_tenant_creates_owner_role_and_commits() -> None:
    service = TenantService()
    owner_id = uuid4()
    dto = CreateTenantDTO(name="New Tenant", slug="new-tenant")
    added_objects: list[object] = []

    def add_side_effect(value: object) -> None:
        added_objects.append(value)

    async def flush_side_effect() -> None:
        for item in added_objects:
            if isinstance(item, Tenant) and item.id is None:
                item.id = uuid4()
            if isinstance(item, Tenant) and item.public_id == "":
                item.public_id = "public-id"
            if isinstance(item, Tenant) and item.created_at is None:
                item.created_at = datetime.now(UTC)
            if isinstance(item, Tenant) and item.floor_canvases is None:
                item.floor_canvases = []

    session = SimpleNamespace(
        add=MagicMock(side_effect=add_side_effect),
        flush=AsyncMock(side_effect=flush_side_effect),
        commit=AsyncMock(),
        refresh=AsyncMock(),
    )

    tenant = await service.create_tenant(session, dto, owner_id)

    tenant_role = next((item for item in added_objects if isinstance(item, TenantRole)), None)

    assert tenant.name == "New Tenant"
    assert tenant.slug == "new-tenant"
    assert tenant.owner_id == owner_id
    assert tenant.status == TenantStatus.ACTIVE
    assert isinstance(tenant_role, TenantRole)
    assert tenant_role.account_id == owner_id
    assert tenant_role.tenant_id == tenant.id
    assert tenant_role.account_type == AccountType.OWNER
    session.flush.assert_awaited_once()
    session.commit.assert_awaited_once()
    session.refresh.assert_awaited_once_with(tenant, attribute_names=["floor_canvases"])


@pytest.mark.asyncio
async def test_create_tenant_normalizes_slug_diacritics() -> None:
    service = TenantService()
    owner_id = uuid4()
    dto = CreateTenantDTO(name="New Tenant", slug="zażółć-gęślą-jaźń")
    added_objects: list[object] = []

    def add_side_effect(value: object) -> None:
        added_objects.append(value)

    async def flush_side_effect() -> None:
        for item in added_objects:
            if isinstance(item, Tenant) and item.id is None:
                item.id = uuid4()
            if isinstance(item, Tenant) and item.public_id == "":
                item.public_id = "public-id"
            if isinstance(item, Tenant) and item.created_at is None:
                item.created_at = datetime.now(UTC)
            if isinstance(item, Tenant) and item.floor_canvases is None:
                item.floor_canvases = []

    session = SimpleNamespace(
        add=MagicMock(side_effect=add_side_effect),
        flush=AsyncMock(side_effect=flush_side_effect),
        commit=AsyncMock(),
        refresh=AsyncMock(),
    )

    tenant = await service.create_tenant(session, dto, owner_id)

    assert tenant.slug == "zazolc-gesla-jazn"


def _session_scalar_result(value: object | None) -> object:
    class _R:
        def __init__(self, v: object | None) -> None:
            self._v = v

        def scalar_one_or_none(self) -> object | None:
            return self._v

    class _Sess:
        def __init__(self) -> None:
            self.deleted: list[object] = []
            self.execute = AsyncMock(side_effect=self._exec)
            self.commit = AsyncMock()
            self.refresh = AsyncMock()
            self.delete = AsyncMock(side_effect=self._record_delete)

        async def _record_delete(self, o: object) -> None:
            self.deleted.append(o)

        async def _exec(self, _q: object) -> _R:
            return _R(self._expected)

    s = _Sess()
    s._expected = value  # type: ignore[attr-defined]
    return s


@pytest.mark.asyncio
async def test_get_tenant_found() -> None:
    t = Tenant(id=uuid4(), name="A", slug="a", status=TenantStatus.ACTIVE)
    session = _session_scalar_result(t)
    out = await TenantService().get_tenant(session, t.id)  # type: ignore[arg-type]
    assert out is t


@pytest.mark.asyncio
async def test_get_tenant_404() -> None:
    tid = uuid4()
    session = _session_scalar_result(None)
    with pytest.raises(NotFoundResponse):
        await TenantService().get_tenant(session, tid)  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_get_tenant_by_public_id() -> None:
    t = Tenant(id=uuid4(), name="A", slug="a", status=TenantStatus.ACTIVE)
    session = _session_scalar_result(t)
    out = await TenantService().get_tenant_by_public_id(session, t.public_id)  # type: ignore[arg-type]
    assert out is t


@pytest.mark.asyncio
async def test_get_tenant_by_public_id_404() -> None:
    session = _session_scalar_result(None)
    with pytest.raises(NotFoundResponse):
        await TenantService().get_tenant_by_public_id(session, "missing")  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_get_tenant_by_slug() -> None:
    t = Tenant(id=uuid4(), name="A", slug="a", status=TenantStatus.ACTIVE)
    session = _session_scalar_result(t)
    out = await TenantService().get_tenant_by_slug(session, t.slug)  # type: ignore[arg-type]
    assert out is t


@pytest.mark.asyncio
async def test_get_tenant_by_slug_404() -> None:
    session = _session_scalar_result(None)
    with pytest.raises(NotFoundResponse):
        await TenantService().get_tenant_by_slug(session, "nope")  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_update_tenant_and_delete() -> None:
    t = Tenant(
        id=uuid4(),
        name="Old",
        slug="old",
        status=TenantStatus.ACTIVE,
        public_id="pub",
        owner_id=uuid4(),
    )
    t.created_at = datetime.now(UTC)
    t.floor_canvases = []
    for attr in ("active_layout_version_id",):
        setattr(t, attr, None)
    session = _session_scalar_result(t)
    svc = TenantService()
    layout_id = uuid4()
    u = UpdateTenantDTO(
        name="N",
        slug="new-slug",
        status=TenantStatus.ACTIVE,
        activeLayoutVersionId=layout_id,
    )
    out = await svc.update_tenant(session, t.id, u)  # type: ignore[arg-type]
    assert out.name == "N"
    assert out.slug == "new-slug"
    assert out.active_layout_version_id == layout_id
    session.commit.assert_awaited_once()  # type: ignore[union-attr]

    s2 = _session_scalar_result(t)
    await svc.delete_tenant(s2, t.id)  # type: ignore[arg-type]
    s2.delete.assert_awaited_once_with(t)  # type: ignore[union-attr]
    s2.commit.assert_awaited()  # type: ignore[union-attr]


@pytest.mark.asyncio
async def test_delete_tenant_not_found() -> None:
    session = _session_scalar_result(None)
    with pytest.raises(NotFoundResponse):
        await TenantService().delete_tenant(session, uuid4())  # type: ignore[arg-type]
