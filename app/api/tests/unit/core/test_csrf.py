from unittest.mock import MagicMock

from fastapi import Request, Response
import pytest
from starlette import status

from core.middleware.csrf import (
    CSRF_TOKEN_COOKIE_NAME,
    CSRF_TOKEN_HEADER_NAME,
    CSRFMiddleware,
    _is_csrf_exempt,
    _uses_bearer_auth,
    _uses_cookie_auth,
    _validate_csrf_token,
    generate_csrf_token,
)


def test_generate_csrf_token_non_empty() -> None:
    t1 = generate_csrf_token()
    t2 = generate_csrf_token()
    assert len(t1) > 8  # noqa: PLR2004
    assert t1 != t2


def test_is_csrf_exempt_prefix() -> None:
    assert _is_csrf_exempt("/api/v1/auth/login/extra") is True


def test_uses_bearer_auth() -> None:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [(b"authorization", b"Bearer x")],
    }
    assert _uses_bearer_auth(Request(scope)) is True


def test_uses_cookie_auth_reads_access_cookie() -> None:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [(b"cookie", b"rat=abc")],
    }
    assert _uses_cookie_auth(Request(scope)) is True


def test_validate_csrf_token_requires_both() -> None:
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/",
        "headers": [],
    }
    req = Request(scope)
    assert _validate_csrf_token(req) is False


def test_validate_csrf_token_matches_header_and_cookie() -> None:
    token = "a" * 32
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/",
        "headers": [
            (b"cookie", f"{CSRF_TOKEN_COOKIE_NAME}={token}".encode()),
            (CSRF_TOKEN_HEADER_NAME.lower().encode(), token.encode()),
        ],
    }
    req = Request(scope)
    assert _validate_csrf_token(req) is True


@pytest.mark.asyncio
async def test_csrf_middleware_options_passthrough() -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok")

    middleware = CSRFMiddleware(call_next)
    scope = {"type": "http", "method": "OPTIONS", "path": "/", "headers": []}
    response = await middleware.dispatch(Request(scope), call_next)
    assert response.body == b"ok"


@pytest.mark.asyncio
async def test_csrf_middleware_blocks_cookie_post_without_csrf_header() -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok")

    middleware = CSRFMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/v1/private",
        "headers": [(b"cookie", b"rat=access")],
    }
    response = await middleware.dispatch(Request(scope), call_next)
    assert response.status_code == status.HTTP_403_FORBIDDEN
    body = response.body.decode()
    assert "CSRF" in body


@pytest.mark.asyncio
async def test_csrf_middleware_bearer_bypasses_csrf() -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok")

    middleware = CSRFMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/v1/private",
        "headers": [
            (b"authorization", b"Bearer tok"),
            (b"cookie", b"rat=access"),
        ],
    }
    response = await middleware.dispatch(Request(scope), call_next)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
async def test_csrf_middleware_sets_cookie_on_get_for_localhost() -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok")

    middleware = CSRFMiddleware(MagicMock())
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/x",
        "headers": [],
        "client": ("127.0.0.1", 1234),
        "server": ("127.0.0.1", 8443),
        "scheme": "https",
    }
    request = Request(scope)
    response = Response(content="ok")
    out = middleware._ensure_csrf_cookie(request, response)
    cookie_header = out.headers.get("set-cookie", "")
    assert CSRF_TOKEN_COOKIE_NAME in cookie_header
    assert "Secure" not in cookie_header


def test_is_csrf_exempt_exact_match() -> None:
    assert _is_csrf_exempt("/api/v1/auth/login") is True
    assert _is_csrf_exempt("/api/v1/auth/register") is True
    assert _is_csrf_exempt("/api/v1/auth/forgot-password") is True
    assert _is_csrf_exempt("/api/v1/auth/reset-password") is True
    assert _is_csrf_exempt("/api/v1/health") is True
    assert _is_csrf_exempt("/health") is True


def test_is_csrf_exempt_not_exempt() -> None:
    assert _is_csrf_exempt("/api/v1/orders") is False
    assert _is_csrf_exempt("/api/v1/users") is False


@pytest.mark.asyncio
async def test_csrf_middleware_exempt_path_passthrough() -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok")

    middleware = CSRFMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/v1/auth/login",
        "headers": [],
    }
    response = await middleware.dispatch(Request(scope), call_next)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
async def test_csrf_middleware_exempt_forgot_password_with_access_cookie() -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok")

    middleware = CSRFMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/v1/auth/forgot-password",
        "headers": [(b"cookie", b"rat=access")],
    }
    response = await middleware.dispatch(Request(scope), call_next)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
async def test_csrf_middleware_post_without_cookie_auth_passes() -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok")

    middleware = CSRFMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/v1/private",
        "headers": [],
    }
    response = await middleware.dispatch(Request(scope), call_next)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
async def test_csrf_middleware_sets_cookie_on_post_success() -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok")

    middleware = CSRFMiddleware(call_next)
    token = "a" * 32
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/v1/private",
        "headers": [
            (b"cookie", f"rat=access;{CSRF_TOKEN_COOKIE_NAME}={token}".encode()),
            (CSRF_TOKEN_HEADER_NAME.lower().encode(), token.encode()),
        ],
        "client": ("127.0.0.1", 1234),
    }
    response = await middleware.dispatch(Request(scope), call_next)
    assert response.status_code == status.HTTP_200_OK


@pytest.mark.asyncio
async def test_csrf_middleware_sets_cookie_for_restorio_domain() -> None:
    middleware = CSRFMiddleware(MagicMock())
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/x",
        "headers": [],
        "server": ("app.restorio.org", 443),
        "scheme": "https",
    }
    request = Request(scope)
    response = Response(content="ok")
    out = middleware._ensure_csrf_cookie(request, response)
    cookie_header = out.headers.get("set-cookie", "")
    assert CSRF_TOKEN_COOKIE_NAME in cookie_header
    assert ".restorio.org" in cookie_header


@pytest.mark.asyncio
async def test_csrf_middleware_sets_cookie_for_unknown_domain() -> None:
    middleware = CSRFMiddleware(MagicMock())
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/x",
        "headers": [],
        "server": ("example.com", 443),
        "scheme": "https",
    }
    request = Request(scope)
    response = Response(content="ok")
    out = middleware._ensure_csrf_cookie(request, response)
    cookie_header = out.headers.get("set-cookie", "")
    assert CSRF_TOKEN_COOKIE_NAME in cookie_header
