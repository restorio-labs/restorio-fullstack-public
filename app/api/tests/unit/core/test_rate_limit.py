from fastapi import Request, Response, status
import pytest

from core.foundation.client_ip import get_client_ip
from core.middleware import rate_limit as rl


def _request(path: str, method: str = "GET", headers=None, client=None) -> Request:
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "headers": headers or [],
    }
    if client is not None:
        scope["client"] = client
    return Request(scope)


def test_match_rule_for_known_prefix_suffix_and_none() -> None:
    assert rl._match_rule("/api/v1/auth/login") == rl.RATE_LIMITED_PATHS["/api/v1/auth/login"]
    assert rl._match_rule("/api/v1/tenants/abc/profile/logo/presign") == rl._PRESIGN_RULE
    assert rl._match_rule("/not-limited") is None


def test_client_ip_forwarded_and_unknown() -> None:
    req_forwarded = _request(
        "/x", headers=[(b"x-forwarded-for", b"203.0.113.1, 10.0.0.2")], client=("127.0.0.1", 1)
    )
    assert get_client_ip(req_forwarded) == "203.0.113.1"

    req_unknown = _request("/x", client=None)
    assert get_client_ip(req_unknown) == "unknown"


def test_inmemory_backend_blocks_after_limit(monkeypatch) -> None:
    max_requests = 2
    monotonic_values = iter([100.0, 101.0, 102.0])
    monkeypatch.setattr(rl.time, "monotonic", lambda: next(monotonic_values))

    backend = rl.InMemoryBackend()
    rule = rl.RateRule(max_requests=max_requests, window_seconds=60)

    limited, remaining = backend.is_rate_limited("k", rule)
    assert limited is False
    assert remaining == 1

    limited, remaining = backend.is_rate_limited("k", rule)
    assert limited is False
    assert remaining == 0

    limited, remaining = backend.is_rate_limited("k", rule)
    assert limited is True
    assert remaining == max_requests


def test_set_backend_swaps_global_backend() -> None:
    original = rl._backend

    class DummyBackend:
        def is_rate_limited(self, _key, _rule):
            return False, 5

    dummy = DummyBackend()
    rl.set_backend(dummy)

    try:
        assert rl._backend is dummy
    finally:
        rl.set_backend(original)


@pytest.mark.asyncio
async def test_rate_limit_middleware_options_and_unmatched_passthrough() -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok", status_code=status.HTTP_204_NO_CONTENT)

    middleware = rl.RateLimitMiddleware(call_next)

    options_response = await middleware.dispatch(_request("/any", method="OPTIONS"), call_next)
    assert options_response.status_code == status.HTTP_204_NO_CONTENT

    response = await middleware.dispatch(_request("/not-limited"), call_next)
    assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.asyncio
async def test_rate_limit_middleware_limited_response_includes_headers_and_request_id(
    monkeypatch,
) -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok", status_code=status.HTTP_200_OK)

    middleware = rl.RateLimitMiddleware(call_next)

    class DummyBackend:
        def is_rate_limited(self, _key, _rule):
            return True, 0

    monkeypatch.setattr(rl, "_backend", DummyBackend())

    warned = []
    monkeypatch.setattr(rl.logger, "warning", lambda *args, **kwargs: warned.append((args, kwargs)))
    audited = []
    monkeypatch.setattr(rl.audit, "rate_limited", lambda **kwargs: audited.append(kwargs))

    request = _request("/api/v1/auth/login", client=("198.51.100.10", 1234))
    request.state.request_id = "rid-123"

    response = await middleware.dispatch(request, call_next)

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert response.headers["Retry-After"] == "60"
    assert response.headers["X-RateLimit-Limit"] == "10"
    assert response.headers["X-RateLimit-Remaining"] == "0"
    assert b'"request_id":"rid-123"' in response.body
    assert warned
    assert audited


@pytest.mark.asyncio
async def test_rate_limit_middleware_success_sets_rate_headers(monkeypatch) -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok", status_code=status.HTTP_200_OK)

    middleware = rl.RateLimitMiddleware(call_next)

    class DummyBackend:
        def is_rate_limited(self, _key, _rule):
            return False, 7

    monkeypatch.setattr(rl, "_backend", DummyBackend())

    request = _request("/api/v1/auth/login", client=("198.51.100.10", 1234))
    response = await middleware.dispatch(request, call_next)

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["X-RateLimit-Limit"] == "10"
    assert response.headers["X-RateLimit-Remaining"] == "7"
