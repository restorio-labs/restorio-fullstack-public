from __future__ import annotations

import hashlib
from unittest.mock import AsyncMock

import pytest

from core.exceptions import BadRequestError, ExternalAPIError, ServiceUnavailableError
from core.foundation.security import SecurityService
from services.auth_service import AuthService
from services.external_client_service import ExternalClient


def _pwned_suffix_line(password: str) -> str:
    sha1 = hashlib.sha1(password.encode("utf-8"), usedforsecurity=False).hexdigest().upper()
    _, suffix = sha1[:5], sha1[5:]
    return f"{suffix}:1"


def _service_with_hibp_ext(ext: AsyncMock) -> AuthService:
    s = AuthService(security=SecurityService())
    s.external_client = ext  # type: ignore[attr-defined]
    s._hibp_url = "https://api.pwned.test/range/"  # type: ignore[attr-defined]
    return s


@pytest.mark.asyncio
async def test_check_password_pwned_rejects_breached_password() -> None:
    p = "unique-test-password-xyz"
    line = _pwned_suffix_line(p)
    ext = AsyncMock(spec=ExternalClient)
    ext.external_get = AsyncMock(return_value=f"OTHER:0\n{line}\n")
    m = _service_with_hibp_ext(ext)
    with pytest.raises(BadRequestError, match="breach"):
        await m.check_password_pwned(p)
    ext.external_get.assert_awaited_once()


@pytest.mark.asyncio
async def test_check_password_pwned_ignores_external_api_errors() -> None:
    ext = AsyncMock(spec=ExternalClient)
    ext.external_get = AsyncMock(side_effect=ExternalAPIError(message="x"))
    m = _service_with_hibp_ext(ext)
    await m.check_password_pwned("any-password-123")
    ext.external_get.assert_awaited_once()


@pytest.mark.asyncio
async def test_check_password_pwned_ignores_service_unavailable() -> None:
    ext = AsyncMock(spec=ExternalClient)
    ext.external_get = AsyncMock(side_effect=ServiceUnavailableError(message="down"))
    m = _service_with_hibp_ext(ext)
    await m.check_password_pwned("any-password-456")
    ext.external_get.assert_awaited_once()
