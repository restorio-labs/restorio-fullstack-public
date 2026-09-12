from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from core.dto.v1.auth import BulkCreateUsersDTO, CreateUserDTO, StaffInviteNotification
from core.exceptions import ConflictError, NotFoundResponse
from core.foundation.http.responses import UnauthenticatedResponse
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.user import User
from routes.v1 import users as users_routes


@pytest.mark.asyncio
async def test_list_tenant_users_nonempty() -> None:
    tid = uuid4()
    uid = uuid4()
    rows = MagicMock()
    rows.all.return_value = [
        (uid, "e@e.com", "N", "S", True, AccountType.WAITER),
    ]
    session = MagicMock()
    session.execute = AsyncMock(return_value=rows)

    r = await users_routes.list_tenant_users(tid, session)  # type: ignore[arg-type]
    assert "retrieved" in r.message
    assert len(r.data) == 1


@pytest.mark.asyncio
async def test_list_tenant_users_empty() -> None:
    tid = uuid4()
    rows = MagicMock()
    rows.all.return_value = []
    session = MagicMock()
    session.execute = AsyncMock(return_value=rows)

    r = await users_routes.list_tenant_users(tid, session)  # type: ignore[arg-type]
    assert "No users" in r.message


@pytest.mark.asyncio
async def test_delete_user_success() -> None:
    tid, uid = uuid4(), uuid4()
    role = SimpleNamespace()
    session = MagicMock()
    session.scalar = AsyncMock(side_effect=[role, 0])
    session.get = AsyncMock(return_value=SimpleNamespace())
    session.delete = AsyncMock()
    session.flush = AsyncMock()

    r = await users_routes.delete_user(
        AccountType.OWNER,
        tid,
        uid,
        session,  # type: ignore[arg-type]
    )
    assert "deleted" in r.message
    assert session.scalar.await_count == 2
    session.get.assert_awaited_once()
    assert session.delete.await_count == 2


@pytest.mark.asyncio
async def test_delete_user_keeps_account_when_other_roles_remain() -> None:
    tid, uid = uuid4(), uuid4()
    role = SimpleNamespace()
    session = MagicMock()
    session.scalar = AsyncMock(side_effect=[role, 2])
    session.get = AsyncMock()
    session.delete = AsyncMock()
    session.flush = AsyncMock()

    r = await users_routes.delete_user(
        AccountType.OWNER,
        tid,
        uid,
        session,  # type: ignore[arg-type]
    )
    assert "deleted" in r.message
    assert session.scalar.await_count == 2
    session.get.assert_not_awaited()
    assert session.delete.await_count == 1


@pytest.mark.asyncio
async def test_delete_user_not_found() -> None:
    tid, uid = uuid4(), uuid4()
    session = MagicMock()
    session.scalar = AsyncMock(return_value=None)

    with pytest.raises(NotFoundResponse):
        await users_routes.delete_user(
            AccountType.OWNER,
            tid,
            uid,
            session,  # type: ignore[arg-type]
        )


@pytest.mark.asyncio
async def test_bulk_create_rejects_self() -> None:
    tid = uuid4()
    tenant = Tenant(
        id=tid,
        public_id="p1",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    session = MagicMock()
    session.get = AsyncMock(return_value=tenant)
    req = MagicMock()
    req.state.user = {"email": "me@e.com"}
    data = BulkCreateUsersDTO(
        users=[CreateUserDTO(email="Me@e.com", access_level=AccountType.KITCHEN)]
    )
    r = await users_routes.bulk_create_users(
        AccountType.OWNER,
        data,
        req,  # type: ignore[arg-type]
        tid,
        session,  # type: ignore[arg-type]
        MagicMock(),
        MagicMock(),
        MagicMock(),
    )
    assert any(
        "yourself" in str(x.get("error", "")) for x in r["results"] if x.get("status") == "failed"
    )


@pytest.mark.asyncio
async def test_bulk_create_duplicate_in_payload() -> None:
    tid = uuid4()
    tenant = Tenant(
        id=tid,
        public_id="p1",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    session = MagicMock()
    session.get = AsyncMock(return_value=tenant)
    req = MagicMock()
    req.state.user = {"email": "other@e.com"}
    data = BulkCreateUsersDTO(
        users=[
            CreateUserDTO(email="dup@e.com", access_level=AccountType.KITCHEN),
            CreateUserDTO(email="DUP@e.com", access_level=AccountType.KITCHEN),
        ]
    )
    r = await users_routes.bulk_create_users(
        AccountType.OWNER,
        data,
        req,  # type: ignore[arg-type]
        tid,
        session,  # type: ignore[arg-type]
        MagicMock(),
        MagicMock(),
        MagicMock(),
    )
    assert any("Duplicate" in str(x.get("error", "")) for x in r["results"] if "error" in x)


@pytest.mark.asyncio
async def test_bulk_create_tenant_missing() -> None:
    session = MagicMock()
    session.get = AsyncMock(return_value=None)
    data = BulkCreateUsersDTO(
        users=[CreateUserDTO(email="x@e.com", access_level=AccountType.KITCHEN)]
    )
    with pytest.raises(UnauthenticatedResponse):
        await users_routes.bulk_create_users(
            AccountType.OWNER,
            data,
            MagicMock(),
            uuid4(),
            session,
            MagicMock(),
            MagicMock(),
            MagicMock(),
        )  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_bulk_create_conflict_error() -> None:
    tid = uuid4()
    tenant = Tenant(
        id=tid,
        public_id="p1",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    session = MagicMock()
    session.get = AsyncMock(return_value=tenant)
    req = MagicMock()
    req.state.user = {"email": "owner@e.com"}
    data = BulkCreateUsersDTO(
        users=[CreateUserDTO(email="new@e.com", access_level=AccountType.KITCHEN)]
    )
    m_user = MagicMock()
    m_user.generate_temporary_password = MagicMock(return_value="t")
    m_user.create_user_for_tenant = AsyncMock(
        side_effect=ConflictError(message="Email already exists")
    )
    r = await users_routes.bulk_create_users(
        AccountType.OWNER,
        data,
        req,
        tid,
        session,
        MagicMock(),
        m_user,
        MagicMock(),
    )  # type: ignore[arg-type]
    assert r["results"][0]["status"] == "failed"
    assert "Email" in str(r["results"][0].get("error", ""))


@pytest.mark.asyncio
async def test_bulk_create_unexpected_error() -> None:
    tid = uuid4()
    tenant = Tenant(
        id=tid,
        public_id="p1",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    session = MagicMock()
    session.get = AsyncMock(return_value=tenant)
    req = MagicMock()
    req.state.user = {"email": "owner@e.com"}
    data = BulkCreateUsersDTO(
        users=[CreateUserDTO(email="new@e.com", access_level=AccountType.KITCHEN)]
    )
    m_user = MagicMock()
    m_user.generate_temporary_password = MagicMock(return_value="t")
    m_user.create_user_for_tenant = AsyncMock(side_effect=RuntimeError())

    r = await users_routes.bulk_create_users(
        AccountType.OWNER,
        data,
        req,
        tid,
        session,
        MagicMock(),
        m_user,
        MagicMock(),
    )  # type: ignore[arg-type]
    assert r["results"][0]["status"] == "failed"


@pytest.mark.asyncio
async def test_bulk_create_sends_activation_email() -> None:
    tid = uuid4()
    uid = uuid4()
    tenant = Tenant(
        id=tid,
        public_id="p1",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    created = User(
        id=uid,
        email="staff@e.com",
        password_hash="h",
    )
    session = MagicMock()
    session.get = AsyncMock(return_value=tenant)
    req = MagicMock()
    req.state.user = {"email": "owner@e.com"}
    data = BulkCreateUsersDTO(
        users=[CreateUserDTO(email="staff@e.com", access_level=AccountType.KITCHEN)]
    )
    m_user = MagicMock()
    m_user.generate_temporary_password = MagicMock(return_value="t")
    m_user.create_user_for_tenant = AsyncMock(return_value=(created, None, True))
    m_auth = MagicMock()
    m_auth.create_activation_link = AsyncMock(
        return_value=SimpleNamespace(id=uuid4(), email=created.email)
    )
    m_email = AsyncMock()
    with patch.object(users_routes.settings, "FRONTEND_URL", "https://app.test"):
        r = await users_routes.bulk_create_users(
            AccountType.OWNER,
            data,
            req,
            tid,
            session,
            m_auth,
            m_user,
            m_email,
        )  # type: ignore[arg-type]
    assert r["results"][0]["status"] == "created"
    assert r["results"][0]["notification"] == StaffInviteNotification.ACTIVATION.value
    m_email.send_activation_email.assert_awaited()


@pytest.mark.asyncio
async def test_create_user_conflicts_with_requester() -> None:
    tid = uuid4()
    tenant = Tenant(
        id=tid,
        public_id="p1",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    session = MagicMock()
    session.get = AsyncMock(return_value=tenant)
    req = MagicMock()
    req.state.user = {"email": "me@e.com"}
    data = CreateUserDTO(email="me@e.com", access_level=AccountType.KITCHEN)
    with pytest.raises(ConflictError, match="yourself"):
        await users_routes.create_user(
            AccountType.OWNER,
            data,
            req,
            tid,
            session,
            MagicMock(),
            MagicMock(),
            MagicMock(),
        )  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_create_user_tenant_missing() -> None:
    session = MagicMock()
    session.get = AsyncMock(return_value=None)
    data = CreateUserDTO(email="a@b.com", access_level=AccountType.KITCHEN)
    with pytest.raises(UnauthenticatedResponse):
        await users_routes.create_user(
            AccountType.OWNER,
            data,
            MagicMock(),
            uuid4(),
            session,
            MagicMock(),
            MagicMock(),
            MagicMock(),
        )  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_create_user_with_activation_email() -> None:
    tid = uuid4()
    uid = uuid4()
    tenant = Tenant(
        id=tid,
        public_id="p1",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    created = User(
        id=uid,
        email="w@e.com",
        password_hash="h",
    )
    session = MagicMock()
    session.get = AsyncMock(return_value=tenant)
    req = MagicMock()
    m_user = MagicMock()
    m_user.generate_temporary_password = MagicMock(return_value="t")
    m_user.create_user_for_tenant = AsyncMock(return_value=(created, None, True))
    m_auth = MagicMock()
    m_auth.create_activation_link = AsyncMock(
        return_value=SimpleNamespace(id=uuid4(), email=created.email)
    )
    m_email = AsyncMock()
    data = CreateUserDTO(
        email="w@e.com",
        access_level=AccountType.WAITER,
        name="W",
        surname="T",
    )
    with patch.object(users_routes.settings, "FRONTEND_URL", "https://app.test"):
        r = await users_routes.create_user(
            AccountType.OWNER,
            data,
            req,
            tid,
            session,
            m_auth,
            m_user,
            m_email,
        )  # type: ignore[arg-type]
    assert "email sent" in r.message
    assert r.data.notification == StaffInviteNotification.ACTIVATION
    m_email.send_activation_email.assert_awaited()


@pytest.mark.asyncio
async def test_create_user_existing_waiter_sends_notice_email() -> None:
    tid = uuid4()
    uid = uuid4()
    tenant = Tenant(
        id=tid,
        public_id="p1",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    created = User(
        id=uid,
        email="w@e.com",
        password_hash="h",
    )
    session = MagicMock()
    session.get = AsyncMock(return_value=tenant)
    req = MagicMock()
    m_user = MagicMock()
    m_user.generate_temporary_password = MagicMock(return_value="t")
    m_user.create_user_for_tenant = AsyncMock(return_value=(created, None, False))
    m_auth = MagicMock()
    m_email = AsyncMock()
    data = CreateUserDTO(
        email="w@e.com",
        access_level=AccountType.WAITER,
        name="W",
        surname="T",
    )
    with patch.object(users_routes.settings, "WAITER_PANEL_URL", "https://waiter.test"):
        r = await users_routes.create_user(
            AccountType.OWNER,
            data,
            req,
            tid,
            session,
            m_auth,
            m_user,
            m_email,
        )  # type: ignore[arg-type]
    assert "waiter notification email sent" in r.message
    assert r.data.notification == StaffInviteNotification.EXISTING_WAITER_NOTICE
    m_email.send_waiter_added_existing_account_email.assert_awaited_once_with(
        to_email=created.email,
        restaurant_name=tenant.name,
        waiter_panel_url="https://waiter.test",
    )
    m_email.send_activation_email.assert_not_called()
    m_auth.create_activation_link.assert_not_called()


@pytest.mark.asyncio
async def test_create_user_existing_kitchen_no_notice_email() -> None:
    tid = uuid4()
    uid = uuid4()
    tenant = Tenant(
        id=tid,
        public_id="p1",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    created = User(
        id=uid,
        email="k@e.com",
        password_hash="h",
    )
    session = MagicMock()
    session.get = AsyncMock(return_value=tenant)
    req = MagicMock()
    m_user = MagicMock()
    m_user.generate_temporary_password = MagicMock(return_value="t")
    m_user.create_user_for_tenant = AsyncMock(return_value=(created, None, False))
    m_auth = MagicMock()
    m_email = AsyncMock()
    data = CreateUserDTO(email="k@e.com", access_level=AccountType.KITCHEN)
    r = await users_routes.create_user(
        AccountType.OWNER,
        data,
        req,
        tid,
        session,
        m_auth,
        m_user,
        m_email,
    )  # type: ignore[arg-type]
    assert r.message == "User added to tenant"
    assert r.data.notification == StaffInviteNotification.EXISTING_ACCOUNT_LINKED
    m_email.send_waiter_added_existing_account_email.assert_not_called()


@pytest.mark.asyncio
async def test_bulk_create_existing_waiter_sends_notice_email() -> None:
    tid = uuid4()
    uid = uuid4()
    tenant = Tenant(
        id=tid,
        public_id="p1",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    created = User(
        id=uid,
        email="w@e.com",
        password_hash="h",
    )
    session = MagicMock()
    session.get = AsyncMock(return_value=tenant)
    req = MagicMock()
    req.state.user = {"email": "owner@e.com"}
    data = BulkCreateUsersDTO(
        users=[
            CreateUserDTO(
                email="w@e.com",
                access_level=AccountType.WAITER,
                name="A",
                surname="B",
            )
        ]
    )
    m_user = MagicMock()
    m_user.generate_temporary_password = MagicMock(return_value="t")
    m_user.create_user_for_tenant = AsyncMock(return_value=(created, None, False))
    m_auth = MagicMock()
    m_email = AsyncMock()
    with patch.object(users_routes.settings, "WAITER_PANEL_URL", "https://waiter.test"):
        r = await users_routes.bulk_create_users(
            AccountType.OWNER,
            data,
            req,
            tid,
            session,
            m_auth,
            m_user,
            m_email,
        )  # type: ignore[arg-type]
    assert r["results"][0]["status"] == "created"
    assert r["results"][0]["notification"] == StaffInviteNotification.EXISTING_WAITER_NOTICE.value
    m_email.send_waiter_added_existing_account_email.assert_awaited_once_with(
        to_email=created.email,
        restaurant_name=tenant.name,
        waiter_panel_url="https://waiter.test",
    )
