from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from core.dto.v1.tenants.mobile_config import (
    CopyMobileThemeFromDTO,
    TenantMobileFaviconFinalizeRequestDTO,
    TenantMobileFaviconPresignRequestDTO,
    UpdateTenantMobileConfigDTO,
)
from core.exceptions import BadRequestError
from core.models.enums import AccountType
from routes.v1.tenants import mobile_config as mobile_routes


@pytest.mark.asyncio
async def test_get_tenant_mobile_config() -> None:
    tid = uuid4()
    row = SimpleNamespace(
        page_title="T",
        theme_override={},
        landing_content=None,
        favicon_object_key=None,
    )
    svc = MagicMock()
    svc.get_by_tenant_id = AsyncMock(return_value=row)
    r = await mobile_routes.get_tenant_mobile_config(
        AccountType.OWNER,
        tid,
        MagicMock(),
        svc,
    )  # type: ignore[arg-type]
    assert "retrieved" in r.message


@pytest.mark.asyncio
async def test_update_tenant_mobile_config_no_fields_upsert_when_none() -> None:
    tid = uuid4()
    new_row = SimpleNamespace(
        page_title=None,
        theme_override=None,
        landing_content=None,
        favicon_object_key=None,
    )
    svc = MagicMock()
    svc.get_by_tenant_id = AsyncMock(return_value=None)
    svc.upsert = AsyncMock(return_value=new_row)
    session = MagicMock()
    session.commit = AsyncMock()
    r = await mobile_routes.update_tenant_mobile_config(
        AccountType.OWNER,
        tid,
        UpdateTenantMobileConfigDTO(),
        session,
        svc,
    )  # type: ignore[arg-type]
    assert "updated" in r.message
    svc.upsert.assert_awaited()


@pytest.mark.asyncio
async def test_update_tenant_mobile_config_with_page_title() -> None:
    tid = uuid4()
    row = SimpleNamespace(
        page_title="N",
        theme_override=None,
        landing_content=None,
        favicon_object_key=None,
    )
    svc = MagicMock()
    svc.upsert = AsyncMock(return_value=row)
    session = MagicMock()
    session.commit = AsyncMock()
    r = await mobile_routes.update_tenant_mobile_config(
        AccountType.OWNER,
        tid,
        UpdateTenantMobileConfigDTO.model_validate(
            {"pageTitle": "N"},
        ),
        session,
        svc,
    )  # type: ignore[arg-type]
    assert r.data.page_title == "N"


@pytest.mark.asyncio
async def test_presign_tenant_mobile_favicon() -> None:
    tid = uuid4()
    st = MagicMock()
    st.create_presigned_upload.return_value = ("https://u", "key-1")
    r = await mobile_routes.presign_tenant_mobile_favicon(
        AccountType.OWNER,
        tid,
        TenantMobileFaviconPresignRequestDTO(content_type="image/png"),
        st,
    )  # type: ignore[arg-type]
    assert r.data.upload_url == "https://u"


@pytest.mark.asyncio
async def test_finalize_tenant_mobile_favicon() -> None:
    tid = uuid4()
    row = SimpleNamespace(
        page_title=None,
        theme_override=None,
        landing_content=None,
        favicon_object_key="k",
    )
    st = MagicMock()
    st.finalize_upload = MagicMock(return_value="f/k")
    svc = MagicMock()
    svc.set_favicon_key = AsyncMock(return_value=row)
    session = MagicMock()
    session.commit = AsyncMock()
    r = await mobile_routes.finalize_tenant_mobile_favicon(
        AccountType.OWNER,
        tid,
        TenantMobileFaviconFinalizeRequestDTO(object_key="f/k"),
        session,
        st,
        svc,
    )  # type: ignore[arg-type]
    assert "saved" in r.message


@pytest.mark.asyncio
async def test_copy_mobile_theme_from_rejects_same_tenant() -> None:
    tid = uuid4()
    session = MagicMock()
    with (
        patch(
            "routes.v1.tenants.mobile_config.get_authorized_tenant_uuid",
            new=AsyncMock(return_value=tid),
        ),
        pytest.raises(BadRequestError, match="Source tenant must differ"),
    ):
        await mobile_routes.copy_mobile_theme_from_tenant(
            AccountType.OWNER,
            tid,
            CopyMobileThemeFromDTO.model_validate(  # type: ignore[call-arg]
                {"sourceTenantPublicId": "p1"}
            ),
            MagicMock(),
            session,
            MagicMock(),
        )  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_copy_mobile_theme_from_success() -> None:
    tid, source = uuid4(), uuid4()
    row = SimpleNamespace(
        page_title=None,
        theme_override={},
        landing_content=None,
        favicon_object_key=None,
    )
    session = MagicMock()
    session.commit = AsyncMock()
    svc = MagicMock()
    svc.copy_theme_override_from = AsyncMock(return_value=row)
    with patch(
        "routes.v1.tenants.mobile_config.get_authorized_tenant_uuid",
        new=AsyncMock(return_value=source),
    ):
        r = await mobile_routes.copy_mobile_theme_from_tenant(
            AccountType.OWNER,
            tid,
            CopyMobileThemeFromDTO.model_validate(  # type: ignore[call-arg]
                {"sourceTenantPublicId": "p1"}
            ),
            MagicMock(),
            session,
            svc,
        )  # type: ignore[arg-type]
    assert "Theme copied" in r.message
    svc.copy_theme_override_from.assert_awaited_once()
