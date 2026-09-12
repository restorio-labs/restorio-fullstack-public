from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from core.dto.v1.tenant_profiles import CreateTenantProfileDTO, UpdateTenantProfileDTO
from core.exceptions import NotFoundResponse
from core.models.tenant_profile import TenantProfile
from services.tenant_profile_service import TenantProfileService


def _create_dto(**overrides: str) -> CreateTenantProfileDTO:
    data = {
        "nip": "1234563218",
        "company_name": "Co",
        "contact_email": "r@e.com",
        "phone": "+48123456789",
        "address_street_name": "Main",
        "address_street_number": "1",
        "address_city": "Waw",
        "address_postal_code": "00-001",
        "owner_first_name": "A",
        "owner_last_name": "B",
    }
    data.update(overrides)
    return CreateTenantProfileDTO.model_validate(data)


def _result_one(value: object | None) -> MagicMock:
    r = MagicMock()
    r.scalar_one_or_none = MagicMock(return_value=value)
    return r


def _min_profile(tenant_id) -> TenantProfile:
    return TenantProfile(
        tenant_id=tenant_id,
        nip="1234563218",
        company_name="Co",
        contact_email="r@e.com",
        phone="123",
        address_street_name="M",
        address_street_number="1",
        address_city="C",
        address_postal_code="00-001",
        address_country="PL",
        owner_first_name="A",
        owner_last_name="B",
    )


@pytest.mark.asyncio
async def test_get_by_tenant_returns_row() -> None:
    tid = uuid4()
    prof = _min_profile(tid)
    session = MagicMock()
    session.execute = AsyncMock(return_value=_result_one(prof))
    out = await TenantProfileService().get_by_tenant(session, tid)
    assert out is prof


@pytest.mark.asyncio
async def test_get_by_tenant_or_404_found() -> None:
    tid = uuid4()
    prof = _min_profile(tid)
    session = MagicMock()
    session.execute = AsyncMock(return_value=_result_one(prof))
    out = await TenantProfileService().get_by_tenant_or_404(session, tid)
    assert out is prof


@pytest.mark.asyncio
async def test_get_by_tenant_or_404_missing() -> None:
    tid = uuid4()
    session = MagicMock()
    session.execute = AsyncMock(return_value=_result_one(None))
    with pytest.raises(NotFoundResponse):
        await TenantProfileService().get_by_tenant_or_404(session, tid)


@pytest.mark.asyncio
async def test_create() -> None:
    svc = TenantProfileService()
    tid = uuid4()
    dto = _create_dto()
    added: list[object] = []

    def capture_add(obj: object) -> None:
        added.append(obj)

    session = MagicMock()
    session.add = capture_add
    session.commit = AsyncMock()
    session.refresh = AsyncMock()

    out = await svc.create(session, tid, dto)
    assert len(added) == 1
    p = added[0]
    assert isinstance(p, TenantProfile)
    assert p.tenant_id == tid
    assert p.nip == dto.nip
    assert p is out
    session.commit.assert_awaited_once()
    session.refresh.assert_awaited_once_with(out)


@pytest.mark.asyncio
async def test_update() -> None:
    svc = TenantProfileService()
    tid = uuid4()
    prof = _min_profile(tid)
    session = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    data = UpdateTenantProfileDTO(company_name="N2", logoUploadKey="k")
    with patch.object(svc, "get_by_tenant_or_404", new_callable=AsyncMock, return_value=prof):
        out = await svc.update(session, tid, data)
    assert out.company_name == "N2"
    session.commit.assert_awaited_once()
    session.refresh.assert_awaited_once_with(prof)


@pytest.mark.asyncio
async def test_upsert_updates_existing() -> None:
    svc = TenantProfileService()
    tid = uuid4()
    dto = _create_dto(company_name="NewCo")
    existing = _min_profile(tid)
    session = MagicMock()
    session.execute = AsyncMock(return_value=_result_one(existing))
    session.commit = AsyncMock()
    session.refresh = AsyncMock()

    p, is_new = await svc.upsert(session, tid, dto)
    assert is_new is False
    assert p.company_name == "NewCo"
    session.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_upsert_creates() -> None:
    svc = TenantProfileService()
    tid = uuid4()
    dto = _create_dto()
    added: list[object] = []

    def capture_add2(obj: object) -> None:
        added.append(obj)

    session = MagicMock()
    session.execute = AsyncMock(return_value=_result_one(None))
    session.add = capture_add2
    session.commit = AsyncMock()
    session.refresh = AsyncMock()

    p, is_new = await svc.upsert(session, tid, dto)
    assert is_new is True
    assert isinstance(p, TenantProfile)
    assert p.tenant_id == tid
    assert len(added) == 1
