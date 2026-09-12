from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi import HTTPException
import pytest
from starlette import status as http_status
from starlette.responses import Response

from core.dto.v1.tenants import CreateTenantDTO
from core.models.enums import TenantStatus
from routes.v1.tenants.tenants import create_tenant


def _make_request(user: object) -> SimpleNamespace:
    return SimpleNamespace(state=SimpleNamespace(user=user))


def _make_tenant(public_id: str = "tenant-public-id") -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        public_id=public_id,
        name="Created Tenant",
        slug="created-tenant",
        status=TenantStatus.ACTIVE,
        active_layout_version_id=None,
        floor_canvases=[],
        created_at=datetime.now(UTC),
    )


def _session_for_create_tenant() -> AsyncMock:
    session = AsyncMock()
    session.scalars = AsyncMock(return_value=[])
    session.execute = AsyncMock(return_value=MagicMock(all=MagicMock(return_value=[])))
    session.scalar = AsyncMock(return_value=None)
    return session


@pytest.mark.asyncio
async def test_create_tenant_raises_401_when_user_is_not_dict() -> None:
    request = _make_request(user=None)
    service = AsyncMock()
    body = CreateTenantDTO(name="Test", slug="test")

    with pytest.raises(HTTPException) as exc_info:
        await create_tenant(
            MagicMock(),
            request,
            Response(),
            body,
            AsyncMock(),
            service,
            MagicMock(),
        )

    assert exc_info.value.status_code == http_status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Unauthorized"
    service.create_tenant.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_tenant_raises_401_when_subject_is_invalid() -> None:
    request = _make_request(user={"sub": 123})
    service = AsyncMock()
    body = CreateTenantDTO(name="Test", slug="test")

    with pytest.raises(HTTPException) as exc_info:
        await create_tenant(
            MagicMock(),
            request,
            Response(),
            body,
            AsyncMock(),
            service,
            MagicMock(),
        )

    assert exc_info.value.status_code == http_status.HTTP_401_UNAUTHORIZED
    assert exc_info.value.detail == "Unauthorized"
    service.create_tenant.assert_not_awaited()


@pytest.mark.asyncio
async def test_create_tenant_calls_service_with_user_id_and_returns_created_response() -> None:
    user_id = uuid4()
    request = _make_request(user={"sub": str(user_id)})
    service = AsyncMock()
    body = CreateTenantDTO(name="My Place", slug="my-place", status=TenantStatus.ACTIVE)
    created_tenant = _make_tenant()
    service.create_tenant.return_value = created_tenant
    session = _session_for_create_tenant()
    security = MagicMock()
    security.create_access_token = MagicMock(return_value="token")

    with patch("routes.v1.tenants.tenants.set_auth_cookies"):
        response = await create_tenant(
            MagicMock(),
            request,
            Response(),
            body,
            session,
            service,
            security,
        )

    service.create_tenant.assert_awaited_once()
    call_args = service.create_tenant.await_args.args
    assert call_args[2] == user_id
    assert call_args[1].name == "My Place"
    assert call_args[1].slug == "my-place"
    assert call_args[1].status == TenantStatus.ACTIVE
    assert response.message == "Tenant created successfully"
    assert response.data.id == created_tenant.public_id
    assert response.data.name == created_tenant.name
