from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.dto.v1 import CreateTenantProfileDTO, TenantLogoUploadPresignRequestDTO
from core.models.enums import AccountType
from routes.v1.tenants import profile as profile_routes


def _profile_dto() -> CreateTenantProfileDTO:
    return CreateTenantProfileDTO(
        nip="1234567890",
        company_name="C",
        contact_email="c@e.com",
        phone="1",
        address_street_name="S",
        address_street_number="1",
        address_city="W",
        address_postal_code="00-001",
        owner_first_name="A",
        owner_last_name="B",
    )


@pytest.mark.asyncio
async def test_create_tenant_logo_upload() -> None:
    st = MagicMock()
    st.create_presigned_upload.return_value = ("https://u", "k")
    r = await profile_routes.create_tenant_logo_upload(
        AccountType.OWNER,
        uuid4(),
        st,
        TenantLogoUploadPresignRequestDTO(content_type="image/png"),
    )  # type: ignore[call-arg]
    assert "upload" in r.message
    assert r.data.upload_url == "https://u"


@pytest.mark.asyncio
async def test_create_tenant_logo_view() -> None:
    st = MagicMock()
    st.create_presigned_view.return_value = "https://view"
    r = await profile_routes.create_tenant_logo_view(uuid4(), st)  # type: ignore[arg-type]
    assert r.data.url == "https://view"


@pytest.mark.asyncio
async def test_get_tenant_profile_missing() -> None:
    svc = MagicMock()
    svc.get_by_tenant = AsyncMock(return_value=None)
    r = await profile_routes.get_tenant_profile(uuid4(), MagicMock(), svc)  # type: ignore[arg-type]
    assert r.data is None


@pytest.mark.asyncio
async def test_upsert_tenant_profile_with_logo_key() -> None:
    tid = uuid4()
    p = _profile_dto()
    p = p.model_copy(update={"logo_upload_key": "tmp/key"})
    now = datetime.now(UTC)
    row = SimpleNamespace(
        id=uuid4(),
        tenant_id=tid,
        nip=p.nip,
        company_name=p.company_name,
        logo="https://logo",
        contact_email=p.contact_email,
        phone=p.phone,
        address_street_name=p.address_street_name,
        address_street_number=p.address_street_number,
        address_city=p.address_city,
        address_postal_code=p.address_postal_code,
        address_country="Polska",
        owner_first_name=p.owner_first_name,
        owner_last_name=p.owner_last_name,
        owner_email=None,
        owner_phone=None,
        contact_person_first_name=None,
        contact_person_last_name=None,
        contact_person_email=None,
        contact_person_phone=None,
        social_facebook=None,
        social_instagram=None,
        social_tiktok=None,
        social_website=None,
        created_at=now,
        updated_at=now,
    )
    st = MagicMock()
    st.finalize_upload.return_value = SimpleNamespace(url="https://logo")
    svc = MagicMock()
    svc.upsert = AsyncMock(return_value=(row, True))
    session = MagicMock()
    r = await profile_routes.upsert_tenant_profile(AccountType.OWNER, tid, p, session, st, svc)  # type: ignore[arg-type]
    assert "created" in r.message
    st.finalize_upload.assert_called_once()
