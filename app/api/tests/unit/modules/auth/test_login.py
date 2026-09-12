from uuid import uuid4

import pytest

from core.exceptions import UnauthorizedError
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from core.models.user import User
from tests.unit.modules.auth.conftest import FakeAsyncSession, auth_service


@pytest.mark.asyncio
async def test_login_success_returns_jwt_with_claims() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(
        id=uuid4(),
        public_id="test-pub-id-abc123",
        name="TestRestaurant",
        slug="testrestaurant",
        status=TenantStatus.ACTIVE,
    )
    session.tenants.append(tenant)
    user = User(
        id=uuid4(),
        email="owner@example.com",
        password_hash=auth_service.security.hash_password("my_password_123"),
        tenant_id=tenant.id,
        is_active=True,
    )
    session.users.append(user)
    session.tenant_roles = [
        TenantRole(account_id=user.id, tenant_id=tenant.id, account_type=AccountType.OWNER),
    ]

    access_token = await auth_service.login(
        session=session,
        email="owner@example.com",
        password="my_password_123",
    )

    assert isinstance(access_token, str)
    decoded = auth_service.security.decode_access_token(access_token)
    assert decoded is not None
    assert decoded["sub"] == str(user.id)
    assert decoded["email"] == user.email
    assert decoded["tenant_ids"] == [tenant.public_id]


@pytest.mark.asyncio
async def test_login_invalid_credentials() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="owner@example.com",
        password_hash=auth_service.security.hash_password("my_password_123"),
        is_active=True,
    )
    session.users.append(user)

    with pytest.raises(UnauthorizedError) as exc_info:
        await auth_service.login(
            session=session,
            email="owner@example.com",
            password="wrong-password",
        )

    assert "invalid credentials" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_login_inactive_account() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="owner@example.com",
        password_hash=auth_service.security.hash_password("my_password_123"),
        is_active=False,
    )
    session.users.append(user)

    with pytest.raises(UnauthorizedError) as exc_info:
        await auth_service.login(
            session=session,
            email="owner@example.com",
            password="my_password_123",
        )

    assert "not active" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_login_user_not_found() -> None:
    session = FakeAsyncSession()

    with pytest.raises(UnauthorizedError) as exc_info:
        await auth_service.login(
            session=session,
            email="missing@example.com",
            password="my_password_123",
        )

    assert "invalid credentials" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_login_uses_tenant_id_when_no_roles() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(
        id=uuid4(),
        public_id="pub-from-tenant",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    session.tenants.append(tenant)
    user = User(
        id=uuid4(),
        email="lone@example.com",
        password_hash=auth_service.security.hash_password("pw-Valid-1"),
        tenant_id=tenant.id,
        is_active=True,
    )
    session.users.append(user)
    access_token = await auth_service.login(
        session=session,
        email="lone@example.com",
        password="pw-Valid-1",
    )
    decoded = auth_service.security.decode_access_token(access_token)
    assert decoded is not None
    assert decoded["tenant_ids"] == [tenant.public_id]
