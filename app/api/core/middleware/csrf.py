"""CSRF protection middleware for cookie-authenticated routes.

Validates CSRF tokens for state-changing requests (POST, PUT, PATCH, DELETE)
when authentication is provided via cookies. Bearer token requests bypass
CSRF validation since they are not vulnerable to CSRF attacks.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
import secrets

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.types import ASGIApp

from core.foundation.infra.config import settings

CSRF_TOKEN_COOKIE_NAME = "csrf_token"
CSRF_TOKEN_HEADER_NAME = "X-CSRF-Token"
CSRF_TOKEN_LENGTH = 32

STATE_CHANGING_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})

CSRF_EXEMPT_PATHS: set[str] = {
    f"{settings.API_V1_PREFIX}/auth/login",
    f"{settings.API_V1_PREFIX}/auth/register",
    f"{settings.API_V1_PREFIX}/auth/activate",
    f"{settings.API_V1_PREFIX}/auth/forgot-password",
    f"{settings.API_V1_PREFIX}/auth/reset-password",
    f"{settings.API_V1_PREFIX}/auth/refresh",
    f"{settings.API_V1_PREFIX}/payments/callback",
    f"{settings.API_V1_PREFIX}/health",
    "/health",
    "/health/ready",
    "/health/live",
}


def _is_csrf_exempt(path: str) -> bool:
    """Check if the path is exempt from CSRF validation."""
    if path in CSRF_EXEMPT_PATHS:
        return True
    return any(path.startswith(exempt + "/") for exempt in CSRF_EXEMPT_PATHS)


def _uses_bearer_auth(request: Request) -> bool:
    """Check if the request uses Bearer token authentication."""
    auth_header = request.headers.get("Authorization", "")
    return auth_header.startswith("Bearer ")


def _uses_cookie_auth(request: Request) -> bool:
    """Check if the request has authentication cookies."""
    return settings.ACCESS_TOKEN_COOKIE_NAME in request.cookies


def generate_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token."""
    return secrets.token_urlsafe(CSRF_TOKEN_LENGTH)


def _validate_csrf_token(request: Request) -> bool:
    """Validate that the CSRF token in header matches the cookie."""
    cookie_token = request.cookies.get(CSRF_TOKEN_COOKIE_NAME)
    header_token = request.headers.get(CSRF_TOKEN_HEADER_NAME)

    if not cookie_token or not header_token:
        return False

    return secrets.compare_digest(cookie_token, header_token)


class CSRFMiddleware(BaseHTTPMiddleware):
    """Middleware that enforces CSRF protection for cookie-authenticated requests."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        if request.method not in STATE_CHANGING_METHODS:
            response = await call_next(request)
            return self._ensure_csrf_cookie(request, response)

        if _is_csrf_exempt(request.url.path):
            return await call_next(request)

        if _uses_bearer_auth(request):
            return await call_next(request)

        if _uses_cookie_auth(request) and not _validate_csrf_token(request):
            return JSONResponse(
                status_code=403,
                content={"message": "CSRF token validation failed"},
            )

        response = await call_next(request)
        return self._ensure_csrf_cookie(request, response)

    def _ensure_csrf_cookie(self, request: Request, response: Response) -> Response:
        """Ensure CSRF token cookie is set if not present."""
        if CSRF_TOKEN_COOKIE_NAME not in request.cookies:
            token = generate_csrf_token()
            hostname = request.url.hostname
            secure = request.url.scheme == "https"

            if hostname in {"localhost", "127.0.0.1"}:
                domain = None
                secure = False
            else:
                domain = None
                for d in ["restorio.org"]:
                    if hostname == d or (hostname and hostname.endswith(f".{d}")):
                        domain = f".{d}"
                        break

            response.set_cookie(
                key=CSRF_TOKEN_COOKIE_NAME,
                value=token,
                httponly=False,
                secure=secure,
                samesite="lax",
                max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
                path="/",
                domain=domain,
            )

        return response
