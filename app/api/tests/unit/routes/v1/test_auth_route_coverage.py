from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from starlette.requests import Request
from starlette.responses import Response

from core.dto.v1.auth import ForgotPasswordDTO, ResetPasswordDTO, SetPasswordDTO
from core.exceptions import BadRequestError, GoneError, NotFoundResponse
from core.foundation.http.responses import UnauthenticatedResponse
from core.models.activation_link import ActivationLink
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from core.models.user import User
from routes.v1 import auth as auth_routes
from tests.unit.modules.auth.conftest import FakeAsyncSession, auth_service


def _req() -> Request:
    return Request({"type": "http", "method": "POST", "path": "/a", "headers": []})


@pytest.mark.asyncio
async def test_me_rejects_non_string_sub() -> None:
    req = Request({"type": "http", "method": "GET", "path": "/me", "headers": []})
    req.state.user = {"sub": 123, "account_type": "owner"}
    with pytest.raises(UnauthenticatedResponse):
        await auth_routes.me(req)


@pytest.mark.asyncio
async def test_activate_activation_link_not_found() -> None:
    session = MagicMock()
    session.get = AsyncMock(return_value=None)
    with pytest.raises(NotFoundResponse, match="Activation link not found"):
        await auth_routes.activate(
            uuid4(),
            _req(),
            Response(),
            session,
            auth_service,  # type: ignore[arg-type]
        )


@pytest.mark.asyncio
async def test_activate_user_not_found() -> None:
    aid = uuid4()
    uid = uuid4()
    al = SimpleNamespace(id=aid, user_id=uid, tenant_id=uuid4(), used_at=None)

    async def sget(_entity: type, pk: object) -> object | None:
        if _entity is ActivationLink and pk == aid:
            return al
        if _entity is User and pk == uid:
            return None
        return None

    session = MagicMock()
    session.get = AsyncMock(side_effect=sget)
    with pytest.raises(NotFoundResponse, match="Account"):
        await auth_routes.activate(
            aid,
            _req(),
            Response(),
            session,
            auth_service,  # type: ignore[arg-type]
        )


@pytest.mark.asyncio
async def test_activate_success_sets_cookies_and_audit() -> None:
    aid, uid, tid = uuid4(), uuid4(), uuid4()
    tenant = Tenant(
        id=tid,
        public_id="pubid",
        name="N",
        slug="slug1",
        status=TenantStatus.ACTIVE,
    )
    user = User(
        id=uid,
        email="a@a.com",
        password_hash="h",
        is_active=True,
        force_password_change=False,
    )
    al = SimpleNamespace(
        id=aid,
        user_id=uid,
        tenant_id=tid,
        used_at=None,
    )

    async def sget(_entity: type, pk: object) -> object | None:
        if _entity is ActivationLink and pk == aid:
            return al
        if _entity is User and pk == uid:
            return user
        return None

    session = MagicMock()
    session.get = AsyncMock(side_effect=sget)
    with (
        patch.object(auth_service, "activate_account", new_callable=AsyncMock) as m_act,
        patch("routes.v1.auth.set_auth_cookies") as m_cook,
        patch("routes.v1.auth.audit") as m_audit,
    ):
        m_act.return_value = (tenant, False)
        r = await auth_routes.activate(
            aid,
            _req(),
            Response(),
            session,
            auth_service,  # type: ignore[arg-type]
        )
    m_cook.assert_called_once()
    m_audit.activation_success.assert_called_once()
    assert "activated successfully" in r.message
    assert r.data.tenant_slug == "slug1"


@pytest.mark.asyncio
async def test_set_password_not_found() -> None:
    session = MagicMock()
    session.get = AsyncMock(return_value=None)
    data = SetPasswordDTO(activation_id=uuid4(), password="Str0ng!Pass-9")
    with pytest.raises(NotFoundResponse, match="Activation link not found"):
        await auth_routes.set_password(
            data,
            _req(),
            Response(),
            session,
            auth_service,  # type: ignore[arg-type]
        )


@pytest.mark.asyncio
async def test_set_password_expired() -> None:
    aid = uuid4()
    uid = uuid4()
    al = ActivationLink(
        id=aid,
        email="a@a.com",
        user_id=uid,
        tenant_id=uuid4(),
        expires_at=datetime.now(UTC) - timedelta(hours=1),
        used_at=None,
    )
    session = MagicMock()
    session.get = AsyncMock(return_value=al)
    data = SetPasswordDTO(activation_id=aid, password="Str0ng!Pass-9")
    with pytest.raises(GoneError, match="expired"):
        await auth_routes.set_password(
            data,
            _req(),
            Response(),
            session,
            auth_service,  # type: ignore[arg-type]
        )


@pytest.mark.asyncio
async def test_set_password_already_used() -> None:
    aid = uuid4()
    uid = uuid4()
    al = ActivationLink(
        id=aid,
        email="a@a.com",
        user_id=uid,
        tenant_id=uuid4(),
        expires_at=datetime.now(UTC) + timedelta(days=1),
        used_at=datetime.now(UTC),
    )
    session = MagicMock()
    session.get = AsyncMock(return_value=al)
    data = SetPasswordDTO(activation_id=aid, password="Str0ng!Pass-9")
    with pytest.raises(BadRequestError, match="already activated"):
        await auth_routes.set_password(
            data,
            _req(),
            Response(),
            session,
            auth_service,  # type: ignore[arg-type]
        )


@pytest.mark.asyncio
async def test_set_password_user_not_found() -> None:
    aid = uuid4()
    uid = uuid4()
    al = ActivationLink(
        id=aid,
        email="a@a.com",
        user_id=uid,
        tenant_id=uuid4(),
        expires_at=datetime.now(UTC) + timedelta(days=1),
        used_at=None,
    )

    async def sget(_entity: type, pk: object) -> object | None:
        if _entity is ActivationLink and pk == aid:
            return al
        if _entity is User and pk == uid:
            return None
        return None

    session = MagicMock()
    session.get = AsyncMock(side_effect=sget)
    data = SetPasswordDTO(activation_id=aid, password="Str0ng!Pass-9")
    with pytest.raises(NotFoundResponse, match="Account"):
        await auth_routes.set_password(
            data,
            _req(),
            Response(),
            session,
            auth_service,  # type: ignore[arg-type]
        )


@pytest.mark.asyncio
async def test_activate_requires_password_change_with_tenant_slug() -> None:
    aid = uuid4()
    uid = uuid4()
    tid = uuid4()
    al = SimpleNamespace(
        id=aid,
        user_id=uid,
        tenant_id=tid,
        used_at=None,
    )
    u = SimpleNamespace(
        id=uid,
        email="e@e.com",
        force_password_change=True,
        is_active=False,
    )
    t = SimpleNamespace(id=tid, slug="slug")

    async def sget(_entity: type, pk: object) -> object:
        if _entity is ActivationLink and pk == aid:
            return al
        if _entity is User and pk == uid:
            return u
        if _entity is Tenant and pk == tid:
            return t
        return None

    session = MagicMock()
    session.get = AsyncMock(side_effect=sget)
    with patch("routes.v1.auth.set_auth_cookies"):
        r = await auth_routes.activate(
            aid,
            _req(),
            Response(),
            session,
            auth_service,  # type: ignore[arg-type]
        )
    assert r.data.requires_password_change is True
    assert r.data.tenant_slug == "slug"


@pytest.mark.asyncio
async def test_set_password_activates_and_sets_cookies() -> None:
    session = FakeAsyncSession()
    uid = uuid4()
    aid = uuid4()
    tid = uuid4()
    tenant = Tenant(
        id=tid,
        public_id="pubx",
        name="N",
        slug="s",
        status=TenantStatus.ACTIVE,
    )
    user = User(
        id=uid,
        email="u@e.com",
        password_hash="x",
        is_active=False,
        force_password_change=True,
    )
    user.tenant_id = tid
    al = ActivationLink(
        id=aid,
        email="u@e.com",
        user_id=uid,
        tenant_id=tid,
        expires_at=datetime.now(UTC) + timedelta(days=1),
        used_at=None,
    )
    session.users.append(user)
    session.tenants.append(tenant)
    session.activation_links.append(al)
    session.tenant_roles = [
        TenantRole(account_id=uid, tenant_id=tid, account_type=AccountType.OWNER)
    ]
    data = SetPasswordDTO(activation_id=aid, password="Str0ng!Pass-zz")
    with patch("routes.v1.auth.set_auth_cookies") as sc, patch("routes.v1.auth.audit"):
        r = await auth_routes.set_password(
            data,
            _req(),
            Response(),
            session,  # type: ignore[arg-type]
            auth_service,
        )
    assert "success" in r.message
    sc.assert_called_once()
    assert user.force_password_change is False


@pytest.mark.asyncio
async def test_resend_activation_sends_email() -> None:
    aid = uuid4()
    new_id = uuid4()
    t = Tenant(
        id=uuid4(),
        public_id="p",
        name="Rest",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    nlink = SimpleNamespace(id=new_id, email="a@b.com")
    m_auth = MagicMock()
    m_auth.resend_activation_link = AsyncMock(return_value=(nlink, t))
    m_email = AsyncMock()
    session = MagicMock()
    with patch.object(auth_routes.settings, "FRONTEND_URL", "https://app.test"):
        r = await auth_routes.resend_activation(aid, session, m_auth, m_email)  # type: ignore[arg-type]
    assert "sent" in r.message
    m_email.send_activation_email.assert_awaited_once()
    args = m_email.send_activation_email.await_args
    assert str(new_id) in (args[1]["activation_link"] or "")


@pytest.mark.asyncio
async def test_forgot_password_sends_email_when_token_created() -> None:
    tid = uuid4()
    tok = SimpleNamespace(id=tid, user_id=uuid4(), email="u@u.com")
    m_auth = MagicMock()
    m_auth.request_password_reset = AsyncMock(return_value=tok)
    m_email = AsyncMock()
    session = MagicMock()
    data = ForgotPasswordDTO(email="u@u.com")
    with (
        patch.object(auth_routes.settings, "FRONTEND_URL", "https://app.test"),
        patch("routes.v1.auth.audit") as m_audit,
    ):
        r = await auth_routes.forgot_password(data, _req(), session, m_auth, m_email)  # type: ignore[arg-type]
    m_email.send_password_reset_email.assert_awaited_once()
    m_audit.password_reset_email_sent.assert_called_once()
    assert "e-mail" in r.message.lower()
    assert r.data is not None


@pytest.mark.asyncio
async def test_forgot_password_no_email_when_no_token() -> None:
    m_auth = MagicMock()
    m_auth.request_password_reset = AsyncMock(return_value=None)
    m_email = AsyncMock()
    session = MagicMock()
    data = ForgotPasswordDTO(email="unknown@u.com")
    with patch("routes.v1.auth.audit"):
        r = await auth_routes.forgot_password(data, _req(), session, m_auth, m_email)  # type: ignore[arg-type]
    m_email.send_password_reset_email.assert_not_called()
    assert "e-mail" in r.message.lower()


@pytest.mark.asyncio
async def test_reset_password_success() -> None:
    uid = uuid4()
    m_auth = MagicMock()
    m_auth.complete_password_reset = AsyncMock(return_value=uid)
    session = MagicMock()
    data = ResetPasswordDTO(reset_token_id=uuid4(), password="Str0ng!Pass-9")
    with patch("routes.v1.auth.audit") as m_audit:
        r = await auth_routes.reset_password(data, _req(), session, m_auth)  # type: ignore[arg-type]
    m_auth.complete_password_reset.assert_awaited_once()
    m_audit.password_reset_completed.assert_called_once()
    assert "hasło" in r.message.lower() or "zalogować" in r.message.lower()
