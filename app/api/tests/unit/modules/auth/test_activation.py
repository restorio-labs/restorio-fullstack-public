from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from core.exceptions import (
    BadRequestError,
    GoneError,
    NotFoundResponse,
    TooManyRequestsError,
)
from core.models.activation_link import ActivationLink
from core.models.enums import TenantStatus
from core.models.tenant import Tenant
from core.models.user import User
from tests.unit.modules.auth.conftest import FakeAsyncSession, auth_service

EXPECTED_NEW_LINK_COUNT = 2


@pytest.mark.asyncio
async def test_create_activation_link_success() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="hash",
        is_active=False,
    )
    tenant = Tenant(
        id=uuid4(),
        name="Rest",
        slug="rest",
        status=TenantStatus.INACTIVE,
    )
    session.users.append(user)
    session.tenants.append(tenant)

    link = await auth_service.create_activation_link(
        session=session,
        email=user.email,
        user_id=user.id,
        tenant_id=tenant.id,
    )

    assert link.id is not None
    assert link.email == user.email
    assert link.user_id == user.id
    assert link.tenant_id == tenant.id
    assert link.expires_at is not None
    assert link.used_at is None
    assert len(session.activation_links) == 1
    assert session.activation_links[0].id == link.id


@pytest.mark.asyncio
async def test_activate_account_link_not_found() -> None:
    session = FakeAsyncSession()
    unknown_id = uuid4()

    with pytest.raises(NotFoundResponse) as exc_info:
        await auth_service.activate_account(session=session, activation_id=unknown_id)

    assert str(unknown_id) in exc_info.value.detail


@pytest.mark.asyncio
async def test_activate_account_link_expired() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="h",
        is_active=False,
    )
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.INACTIVE)
    session.users.append(user)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email=user.email,
        user_id=user.id,
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) - timedelta(hours=1),
    )
    session.activation_links.append(link)

    with pytest.raises(GoneError) as exc_info:
        await auth_service.activate_account(session=session, activation_id=link.id)

    assert "expired" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_activate_account_tenant_not_found() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="h",
        is_active=False,
    )
    link = ActivationLink(
        id=uuid4(),
        email=user.email,
        user_id=user.id,
        tenant_id=uuid4(),
        expires_at=datetime.now(tz=UTC) + timedelta(hours=1),
    )
    session.users.append(user)
    session.activation_links.append(link)

    with pytest.raises(NotFoundResponse) as exc_info:
        await auth_service.activate_account(session=session, activation_id=link.id)

    assert "Account" in exc_info.value.detail


@pytest.mark.asyncio
async def test_activate_account_already_activated_returns_tenant_true() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="h",
        is_active=False,
    )
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.ACTIVE)
    session.users.append(user)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email=user.email,
        user_id=user.id,
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) + timedelta(hours=1),
        used_at=datetime.now(tz=UTC),
    )
    session.activation_links.append(link)

    result_tenant, already = await auth_service.activate_account(
        session=session, activation_id=link.id
    )

    assert result_tenant.id == tenant.id
    assert already is True


@pytest.mark.asyncio
async def test_activate_account_success_activates_user_and_tenant() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="h",
        is_active=False,
    )
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.INACTIVE)
    session.users.append(user)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email=user.email,
        user_id=user.id,
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) + timedelta(hours=1),
    )
    session.activation_links.append(link)

    result_tenant, already = await auth_service.activate_account(
        session=session, activation_id=link.id
    )

    assert result_tenant.id == tenant.id
    assert already is False
    assert user.is_active is True
    assert tenant.status == TenantStatus.ACTIVE
    assert link.used_at is not None


@pytest.mark.asyncio
async def test_activate_account_user_not_found() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.INACTIVE)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email="u@example.com",
        user_id=uuid4(),
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) + timedelta(hours=1),
    )
    session.activation_links.append(link)

    with pytest.raises(NotFoundResponse) as exc_info:
        await auth_service.activate_account(session=session, activation_id=link.id)

    assert "Account" in exc_info.value.detail


@pytest.mark.asyncio
async def test_resend_activation_link_not_found() -> None:
    session = FakeAsyncSession()
    unknown_id = uuid4()

    with pytest.raises(NotFoundResponse) as exc_info:
        await auth_service.resend_activation_link(session=session, activation_id=unknown_id)

    assert str(unknown_id) in exc_info.value.detail


@pytest.mark.asyncio
async def test_resend_activation_link_already_activated() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.ACTIVE)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email="u@example.com",
        user_id=uuid4(),
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) - timedelta(hours=1),
        used_at=datetime.now(tz=UTC),
    )
    session.activation_links.append(link)

    with pytest.raises(BadRequestError) as exc_info:
        await auth_service.resend_activation_link(session=session, activation_id=link.id)

    assert "already activated" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_resend_activation_link_not_expired_yet() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.INACTIVE)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email="u@example.com",
        user_id=uuid4(),
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) + timedelta(hours=1),
    )
    session.activation_links.append(link)

    with pytest.raises(BadRequestError) as exc_info:
        await auth_service.resend_activation_link(session=session, activation_id=link.id)

    assert "not expired" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_resend_activation_link_cooldown() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.INACTIVE)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email="u@example.com",
        user_id=uuid4(),
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) - timedelta(hours=1),
        last_resend_at=datetime.now(tz=UTC) - timedelta(seconds=60),
    )
    session.activation_links.append(link)

    with pytest.raises(TooManyRequestsError) as exc_info:
        await auth_service.resend_activation_link(session=session, activation_id=link.id)

    assert "wait" in exc_info.value.detail.lower() or "email" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_resend_activation_link_tenant_not_found() -> None:
    session = FakeAsyncSession()
    link = ActivationLink(
        id=uuid4(),
        email="u@example.com",
        user_id=uuid4(),
        tenant_id=uuid4(),
        expires_at=datetime.now(tz=UTC) - timedelta(hours=1),
    )
    session.activation_links.append(link)

    with pytest.raises(NotFoundResponse) as exc_info:
        await auth_service.resend_activation_link(session=session, activation_id=link.id)

    assert "Account" in exc_info.value.detail


@pytest.mark.asyncio
async def test_resend_activation_link_success_creates_new_link() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.INACTIVE)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email="u@example.com",
        user_id=uuid4(),
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) - timedelta(hours=1),
    )
    session.activation_links.append(link)

    new_link, result_tenant = await auth_service.resend_activation_link(
        session=session, activation_id=link.id
    )

    assert new_link.id is not None
    assert new_link.id != link.id
    assert new_link.email == link.email
    assert new_link.user_id == link.user_id
    assert new_link.tenant_id == link.tenant_id
    assert result_tenant.id == tenant.id
    assert len(session.activation_links) == EXPECTED_NEW_LINK_COUNT
    assert link.last_resend_at is not None
