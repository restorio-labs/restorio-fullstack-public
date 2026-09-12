from __future__ import annotations

from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette import status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from core.foundation.auth_cookies import get_access_token_from_request
from core.foundation.infra.config import settings
from core.foundation.security import security_service
from core.middleware.cors import is_origin_allowed

_PUBLIC_PATH_PREFIXES: frozenset[str] = frozenset(
    {
        "/",
        "/docs",
        "/openapi",
        "/health",
        f"{settings.API_V1_PREFIX}/health",
        f"{settings.API_V1_PREFIX}/auth/login",
        f"{settings.API_V1_PREFIX}/auth/register",
        f"{settings.API_V1_PREFIX}/auth/activate",
        f"{settings.API_V1_PREFIX}/auth/set-password",
        f"{settings.API_V1_PREFIX}/auth/forgot-password",
        f"{settings.API_V1_PREFIX}/auth/reset-password",
        f"{settings.API_V1_PREFIX}/auth/resend-activation",
        f"{settings.API_V1_PREFIX}/auth/refresh",
        f"{settings.API_V1_PREFIX}/auth/logout",
        f"{settings.API_V1_PREFIX}/public",
    }
)


def _is_public_path(path: str) -> bool:
    for prefix in _PUBLIC_PATH_PREFIXES:
        if path == prefix or path.startswith((prefix + "/", prefix + "?")):
            return True
    return False


def _cors_headers_for_request(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin")
    if origin is not None and is_origin_allowed(
        origin,
        settings.CORS_ORIGINS,
        debug=settings.DEBUG,
        allow_cf_pages_previews=settings.CORS_ALLOW_CF_PAGES_PREVIEWS,
    ):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


class UnauthorizedMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        self._security = security_service
        super().__init__(app)

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        if _is_public_path(request.url.path):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        token: str | None = None
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
        else:
            token = get_access_token_from_request(request)

        rid = getattr(request.state, "request_id", None)

        if token is None:
            body: dict[str, str | None] = {"message": "Unauthorized"}
            if rid:
                body["request_id"] = rid
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content=body,
                headers=_cors_headers_for_request(request),
            )

        try:
            user = self._security.decode_access_token(token)
        except Exception:
            body = {"message": "Unauthorized"}
            if rid:
                body["request_id"] = rid
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content=body,
                headers=_cors_headers_for_request(request),
            )

        request.state.user = user

        return await call_next(request)
