from unittest.mock import patch

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient
import pytest

from core.foundation.infra.config import Settings
from core.middleware import TimingMiddleware, UnauthorizedMiddleware, setup_cors
from core.middleware.cors import _build_allowed_origins, is_origin_allowed


def test_setup_cors_adds_middleware() -> None:
    app = FastAPI()
    settings = Settings(CORS_ORIGINS=["http://example.com"])

    setup_cors(app=app, settings=settings)

    assert any(isinstance(m.cls, type) and m.cls is CORSMiddleware for m in app.user_middleware)


def test_setup_cors_always_includes_local_admin_origin() -> None:
    app = FastAPI()
    settings = Settings(CORS_ORIGINS=["http://example.com"], DEBUG=True)
    setup_cors(app=app, settings=settings)

    @app.get("/")
    async def root() -> Response:
        return Response(content="ok")

    client = TestClient(app)
    response = client.get("/", headers={"Origin": "http://localhost:3001"})

    assert response.headers.get("access-control-allow-origin") == "http://localhost:3001"


def test_cors_headers_present_on_unauthorized_response() -> None:
    app = FastAPI()
    settings = Settings(CORS_ORIGINS=["http://localhost:3001"])
    app.add_middleware(UnauthorizedMiddleware)
    setup_cors(app=app, settings=settings)

    @app.get("/private")
    async def protected_route() -> Response:
        return Response(content="ok")

    client = TestClient(app)
    response = client.get("/private", headers={"Origin": "http://localhost:3001"})

    assert response.status_code == 401  # noqa: PLR2004
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3001"


@pytest.mark.asyncio
async def test_timing_middleware_adds_header() -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok")

    middleware = TimingMiddleware(call_next)
    scope = {"type": "http", "method": "GET", "path": "/", "headers": []}
    request = Request(scope)

    response = await middleware.dispatch(request, call_next)

    assert "X-Process-Time" in response.headers


@pytest.mark.asyncio
async def test_unauthorized_middleware_allows_options_request() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=202)

    mid = UnauthorizedMiddleware(call_next)
    scope = {"type": "http", "method": "OPTIONS", "path": "/api/v1/private", "headers": []}
    request = Request(scope)

    response = await mid.dispatch(request, call_next)

    assert response.status_code == 202  # noqa: PLR2004


@pytest.mark.asyncio
async def test_unauthorized_middleware_transforms_not_found() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=404)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {"type": "http", "method": "GET", "path": "/", "headers": []}
    request = Request(scope)

    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 404  # noqa: PLR2004


@pytest.mark.asyncio
async def test_unauthorized_middleware_passes_other_status() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=200)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/private",
        "headers": [(b"authorization", b"Bearer valid-token")],
    }
    request = Request(scope)

    with patch.object(middleware._security, "decode_access_token", return_value={"sub": "user-1"}):
        response = await middleware.dispatch(request, call_next)

    assert response.status_code == 200  # noqa: PLR2004
    assert request.state.user == {"sub": "user-1"}


@pytest.mark.asyncio
async def test_unauthorized_middleware_allows_public_routes() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=204)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {"type": "http", "method": "GET", "path": "/docs", "headers": []}
    request = Request(scope)

    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 204  # noqa: PLR2004


@pytest.mark.asyncio
async def test_unauthorized_middleware_allows_public_auth_login_route() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=204)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {"type": "http", "method": "POST", "path": "/api/v1/auth/login", "headers": []}
    request = Request(scope)

    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 204  # noqa: PLR2004


@pytest.mark.asyncio
async def test_unauthorized_middleware_allows_public_auth_forgot_password_route() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=204)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/v1/auth/forgot-password",
        "headers": [],
    }
    request = Request(scope)

    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 204  # noqa: PLR2004


@pytest.mark.asyncio
async def test_unauthorized_middleware_allows_public_auth_reset_password_route() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=204)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {"type": "http", "method": "POST", "path": "/api/v1/auth/reset-password", "headers": []}
    request = Request(scope)

    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 204  # noqa: PLR2004


@pytest.mark.asyncio
async def test_unauthorized_middleware_returns_401_on_invalid_token() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=200)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/private",
        "headers": [(b"authorization", b"Bearer invalid-token")],
    }
    request = Request(scope)

    with patch.object(
        middleware._security, "decode_access_token", side_effect=Exception("bad token")
    ):
        response = await middleware.dispatch(request, call_next)

    assert response.status_code == 401  # noqa: PLR2004


@pytest.mark.asyncio
async def test_unauthorized_middleware_accepts_access_token_cookie() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=200)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [(b"cookie", b"rat=valid-token")],
    }
    request = Request(scope)

    with patch.object(middleware._security, "decode_access_token", return_value={"sub": "user-1"}):
        response = await middleware.dispatch(request, call_next)

    assert response.status_code == 200  # noqa: PLR2004


@pytest.mark.asyncio
async def test_unauthorized_middleware_includes_request_id_when_missing_token() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=200)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/private",
        "headers": [(b"origin", b"http://localhost:3001")],
    }
    request = Request(scope)
    request.state.request_id = "rid-1"

    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 401  # noqa: PLR2004
    assert b'"request_id":"rid-1"' in response.body


@pytest.mark.asyncio
async def test_unauthorized_middleware_includes_request_id_when_token_invalid() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=200)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/private",
        "headers": [(b"authorization", b"Bearer bad-token")],
    }
    request = Request(scope)
    request.state.request_id = "rid-2"

    with patch.object(
        middleware._security, "decode_access_token", side_effect=Exception("bad token")
    ):
        response = await middleware.dispatch(request, call_next)

    assert response.status_code == 401  # noqa: PLR2004
    assert b'"request_id":"rid-2"' in response.body


def test_build_allowed_origins_deduplicates_entries() -> None:
    origins = _build_allowed_origins(["http://example.com", "http://example.com"], debug=False)
    assert origins == ["http://example.com"]


def test_is_origin_allowed_handles_none_and_restorio_hosts() -> None:
    assert is_origin_allowed(None, ["http://example.com"], debug=False) is False
    assert (
        is_origin_allowed("https://tenant.restorio.org", ["http://example.com"], debug=True) is True
    )
    assert (
        is_origin_allowed("ftp://tenant.restorio.org", ["http://example.com"], debug=True) is False
    )
    assert is_origin_allowed("https://example.org", ["http://example.com"], debug=True) is False


def test_is_origin_allowed_localhost_always_allowed() -> None:
    assert is_origin_allowed("http://localhost:5000", [], debug=False) is True
    assert is_origin_allowed("https://127.0.0.1:8080", [], debug=False) is True
    assert is_origin_allowed("http://[::1]:3000", [], debug=False) is True


def test_is_origin_allowed_restorio_org_root_domain() -> None:
    assert is_origin_allowed("https://restorio.org", [], debug=True) is True
    assert is_origin_allowed("http://restorio.org", [], debug=True) is True


def test_is_origin_allowed_cf_pages_preview_when_enabled() -> None:
    assert (
        is_origin_allowed(
            "https://abc123.my-app.pages.dev",
            [],
            debug=False,
            allow_cf_pages_previews=True,
        )
        is True
    )
    assert (
        is_origin_allowed(
            "https://evil.example.com",
            [],
            debug=False,
            allow_cf_pages_previews=True,
        )
        is False
    )


def test_is_origin_allowed_cf_pages_preview_when_disabled() -> None:
    assert (
        is_origin_allowed(
            "https://abc123.my-app.pages.dev",
            [],
            debug=False,
            allow_cf_pages_previews=False,
        )
        is False
    )
