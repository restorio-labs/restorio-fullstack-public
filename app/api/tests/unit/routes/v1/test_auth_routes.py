from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import UUID, uuid4

from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from starlette import status

from core.foundation.database.database import get_db_session
from core.foundation.dependencies import get_auth_service, get_email_service, get_security_service
from core.foundation.infra.config import settings
from core.foundation.security import security_service as global_security
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from core.models.user import User
from routes.v1 import auth
from services.auth_service import AuthService
from tests.unit.modules.auth.conftest import FakeAsyncSession, auth_service


def _set_refresh_token_cookie(client: TestClient, value: str) -> None:
    client.cookies.set(settings.REFRESH_TOKEN_COOKIE_NAME, value, path="/")


def _login_app(overrides: dict | None = None) -> TestClient:
    app = FastAPI()
    app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth")
    o = overrides or {}
    for fn, val in o.items():
        app.dependency_overrides[fn] = val

    return TestClient(app)


def test_auth_login_route_success() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(
        id=uuid4(),
        public_id="test-pub-id-abc",
        name="R",
        slug="r",
        status=TenantStatus.ACTIVE,
    )
    session.tenants.append(tenant)
    user = User(
        id=uuid4(),
        email="o@e.com",
        password_hash=auth_service.security.hash_password("pw-Valid-1"),
        tenant_id=tenant.id,
        is_active=True,
    )
    session.users.append(user)
    session.tenant_roles = [
        TenantRole(account_id=user.id, tenant_id=tenant.id, account_type=AccountType.OWNER)
    ]

    async def override_db() -> object:
        yield session

    client = _login_app(
        {
            get_db_session: override_db,
            get_auth_service: lambda: auth_service,
        }
    )
    with patch("routes.v1.auth.audit") as mock_audit:
        r = client.post(
            f"{settings.API_V1_PREFIX}/auth/login",
            json={"email": "o@e.com", "password": "pw-Valid-1"},
        )
    assert r.status_code == status.HTTP_200_OK
    assert r.json()["message"] == "Login successful"
    mock_audit.login_success.assert_called_once()


def test_auth_login_route_audit_on_unauthorized() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="o@e.com",
        password_hash=auth_service.security.hash_password("x"),
        is_active=True,
    )
    session.users.append(user)

    async def override_db() -> object:
        yield session

    client = _login_app({get_db_session: override_db, get_auth_service: lambda: auth_service})
    with patch("routes.v1.auth.audit") as mock_audit:
        r = client.post(
            f"{settings.API_V1_PREFIX}/auth/login",
            json={"email": "o@e.com", "password": "wrong"},
        )
    assert r.status_code == status.HTTP_401_UNAUTHORIZED
    mock_audit.login_failure.assert_called_once()


def test_auth_register_route() -> None:
    session = FakeAsyncSession()
    u = User(id=uuid4(), email="n@e.com", password_hash="h", is_active=False)
    act = SimpleNamespace(id=uuid4(), email="n@e.com", user_id=u.id)
    m_auth = AsyncMock(spec=AuthService)
    m_auth.security = auth_service.security
    m_auth.create_user = AsyncMock(return_value=u)
    m_auth.create_activation_link = AsyncMock(return_value=act)
    m_email = AsyncMock()

    async def override_db() -> object:
        yield session

    client = _login_app(
        {
            get_db_session: override_db,
            get_auth_service: lambda: m_auth,
            get_email_service: lambda: m_email,
        }
    )
    with patch("routes.v1.auth.audit"):
        r = client.post(
            f"{settings.API_V1_PREFIX}/auth/register",
            json={"email": "n@e.com", "password": "Str0ng!Pass-x"},
        )
    assert r.status_code == status.HTTP_201_CREATED
    m_email.send_activation_email.assert_awaited_once()


def _refresh_app() -> tuple[TestClient, UUID]:
    app = FastAPI()
    app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth")
    m_email = AsyncMock()
    s = FakeAsyncSession()
    t = Tenant(id=uuid4(), public_id="p1", name="N", slug="s", status=TenantStatus.ACTIVE)
    s.tenants.append(t)
    uid = uuid4()
    user = User(
        id=uid,
        email="o@e.com",
        password_hash=auth_service.security.hash_password("x"),
        is_active=True,
    )
    s.users.append(user)
    s.tenant_roles = [
        TenantRole(account_id=user.id, tenant_id=t.id, account_type=AccountType.OWNER)
    ]

    async def override_db() -> object:
        yield s

    app.dependency_overrides[get_db_session] = override_db
    app.dependency_overrides[get_email_service] = lambda: m_email
    app.dependency_overrides[get_security_service] = lambda: global_security
    return TestClient(app), uid


def test_auth_refresh_token_route() -> None:
    client, user_id = _refresh_app()
    fam = "fam-1"
    jti = "j-1"
    body: dict = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": jti,
        "family": fam,
        "email": "o@e.com",
    }
    token = global_security.create_access_token(body, expires_delta=timedelta(days=1))
    with patch("routes.v1.auth.refresh_token_store") as rts, patch("routes.v1.auth.audit"):
        rts.is_family_revoked.return_value = False
        rts.is_revoked.return_value = False
        _set_refresh_token_cookie(client, token)
        r = client.post(f"{settings.API_V1_PREFIX}/auth/refresh")
    assert r.status_code == status.HTTP_200_OK
    assert r.json()["message"] == "Token refreshed"


def test_auth_logout_route() -> None:
    client, _ = _refresh_app()
    with patch("routes.v1.auth.refresh_token_store") as rts, patch("routes.v1.auth.audit"):
        _set_refresh_token_cookie(client, "nope")
        r = client.post(f"{settings.API_V1_PREFIX}/auth/logout")
    assert r.status_code == status.HTTP_200_OK
    rts.revoke_family.assert_not_called()


def test_auth_logout_with_family_revoques() -> None:
    fam = "fam-x"
    body = {"sub": str(uuid4()), "type": "refresh", "family": fam, "jti": "jx"}
    tok = global_security.create_access_token(body, expires_delta=timedelta(hours=1))
    client, _ = _refresh_app()
    with patch("routes.v1.auth.audit"):
        _set_refresh_token_cookie(client, tok)
        r = client.post(f"{settings.API_V1_PREFIX}/auth/logout")
    assert r.status_code == status.HTTP_200_OK


def test_auth_me_route() -> None:
    app = FastAPI()
    app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth")

    @app.middleware("http")
    async def inject_user(request: Request, call_next) -> object:
        request.state.user = {"sub": "user-1", "account_type": "owner"}
        return await call_next(request)

    client = TestClient(app)
    r = client.get(f"{settings.API_V1_PREFIX}/auth/me")
    assert r.status_code == status.HTTP_200_OK
    assert r.json()["data"]["account_type"] == "owner"


def test_auth_me_unauthenticated_uses_unauthenticated_response() -> None:
    app = FastAPI()
    app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth")
    client = TestClient(app)
    r = client.get(f"{settings.API_V1_PREFIX}/auth/me")
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


def test_auth_refresh_fails_without_cookie() -> None:
    client, _ = _refresh_app()
    r = client.post(f"{settings.API_V1_PREFIX}/auth/refresh")
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


def test_auth_refresh_fails_for_non_refresh_token() -> None:
    client, user_id = _refresh_app()
    body: dict = {"sub": str(user_id), "type": "access", "jti": "j", "family": "f"}
    token = global_security.create_access_token(body, expires_delta=timedelta(hours=1))
    _set_refresh_token_cookie(client, token)
    r = client.post(f"{settings.API_V1_PREFIX}/auth/refresh")
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


def test_auth_refresh_fails_for_empty_sub() -> None:
    app = FastAPI()
    app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth")
    m_email = AsyncMock()
    s = FakeAsyncSession()

    async def override_db() -> object:
        yield s

    app.dependency_overrides[get_db_session] = override_db
    app.dependency_overrides[get_email_service] = lambda: m_email
    app.dependency_overrides[get_security_service] = lambda: global_security
    client = TestClient(app)
    body = {
        "sub": "",
        "type": "refresh",
        "jti": "j1",
        "family": "f1",
        "email": "a@b.com",
    }
    token = global_security.create_access_token(body, expires_delta=timedelta(hours=1))
    _set_refresh_token_cookie(client, token)
    r = client.post(f"{settings.API_V1_PREFIX}/auth/refresh")
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


def test_auth_refresh_fails_when_family_is_revoked() -> None:
    client, user_id = _refresh_app()
    body: dict = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": "j1",
        "family": "fam-bad",
    }
    token = global_security.create_access_token(body, expires_delta=timedelta(days=1))
    with patch("routes.v1.auth.refresh_token_store") as rts, patch("routes.v1.auth.audit"):
        rts.is_family_revoked.return_value = True
        _set_refresh_token_cookie(client, token)
        r = client.post(f"{settings.API_V1_PREFIX}/auth/refresh")
    assert r.status_code == status.HTTP_401_UNAUTHORIZED


def test_auth_refresh_fails_when_jti_is_revoked() -> None:
    client, user_id = _refresh_app()
    fam = "fam-z"
    body: dict = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": "j-old",
        "family": fam,
    }
    token = global_security.create_access_token(body, expires_delta=timedelta(days=1))
    with patch("routes.v1.auth.refresh_token_store") as rts, patch("routes.v1.auth.audit"):
        rts.is_family_revoked.return_value = False
        rts.is_revoked.return_value = True
        _set_refresh_token_cookie(client, token)
        r = client.post(f"{settings.API_V1_PREFIX}/auth/refresh")
    assert r.status_code == status.HTTP_401_UNAUTHORIZED
    rts.revoke_family.assert_called_once_with(fam)
