from __future__ import annotations

from collections import defaultdict
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
import time
from typing import Protocol

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.types import ASGIApp

from core.foundation.client_ip import get_client_ip
from core.foundation.infra.config import settings
from core.foundation.logging.audit import audit
from core.foundation.logging.logger import logger


@dataclass(frozen=True)
class RateRule:
    max_requests: int
    window_seconds: int


RATE_LIMITED_PATHS: dict[str, RateRule] = {
    f"{settings.API_V1_PREFIX}/auth/login": RateRule(max_requests=10, window_seconds=60),
    f"{settings.API_V1_PREFIX}/auth/refresh": RateRule(max_requests=20, window_seconds=60),
    f"{settings.API_V1_PREFIX}/auth/register": RateRule(max_requests=5, window_seconds=60),
    f"{settings.API_V1_PREFIX}/auth/activate": RateRule(max_requests=10, window_seconds=60),
    f"{settings.API_V1_PREFIX}/auth/set-password": RateRule(max_requests=5, window_seconds=60),
    f"{settings.API_V1_PREFIX}/auth/forgot-password": RateRule(max_requests=5, window_seconds=60),
    f"{settings.API_V1_PREFIX}/auth/reset-password": RateRule(max_requests=5, window_seconds=60),
    f"{settings.API_V1_PREFIX}/auth/resend-activation": RateRule(max_requests=3, window_seconds=60),
    f"{settings.API_V1_PREFIX}/tenants": RateRule(max_requests=30, window_seconds=60),
}

_PRESIGN_SUFFIX = "/profile/logo/presign"
_PRESIGN_RULE = RateRule(max_requests=10, window_seconds=60)


def _match_rule(path: str) -> RateRule | None:
    if path.endswith(_PRESIGN_SUFFIX):
        return _PRESIGN_RULE

    for prefix, rule in RATE_LIMITED_PATHS.items():
        if path == prefix or path.startswith((prefix + "/", prefix + "?")):
            return rule
    return None


class RateLimitBackend(Protocol):
    def is_rate_limited(self, key: str, rule: RateRule) -> tuple[bool, int]: ...


@dataclass
class _BucketEntry:
    timestamps: list[float] = field(default_factory=list)


class InMemoryBackend:
    """Default in-memory rate-limit backend.

    Swap for a Redis-backed implementation by calling ``set_backend()``.
    """

    def __init__(self) -> None:
        self._buckets: dict[str, _BucketEntry] = defaultdict(_BucketEntry)

    def is_rate_limited(self, key: str, rule: RateRule) -> tuple[bool, int]:
        now = time.monotonic()
        cutoff = now - rule.window_seconds
        entry = self._buckets[key]
        entry.timestamps = [ts for ts in entry.timestamps if ts > cutoff]

        if len(entry.timestamps) >= rule.max_requests:
            return True, rule.max_requests

        entry.timestamps.append(now)
        remaining = rule.max_requests - len(entry.timestamps)
        return False, remaining


_backend: RateLimitBackend = InMemoryBackend()


def set_backend(backend: RateLimitBackend) -> None:
    global _backend  # noqa: PLW0603
    _backend = backend


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        rule = _match_rule(request.url.path)
        if rule is None:
            return await call_next(request)

        ip = get_client_ip(request)
        key = f"rl:{request.url.path}:{ip}"

        limited, remaining = _backend.is_rate_limited(key, rule)

        if limited:
            logger.warning(
                "Rate limit exceeded: path=%s ip=%s",
                request.url.path,
                ip,
            )
            audit.rate_limited(request=request)
            rid = getattr(request.state, "request_id", None)
            body: dict[str, str | None] = {"message": "Too many requests. Please try again later."}
            if rid:
                body["request_id"] = rid
            return JSONResponse(
                status_code=429,
                content=body,
                headers={
                    "Retry-After": str(rule.window_seconds),
                    "X-RateLimit-Limit": str(rule.max_requests),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(rule.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
