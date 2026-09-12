from __future__ import annotations

import socket
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from core.exceptions import ExternalAPIError
from services import external_client_service as ecs
from services.external_client_service import ExternalClient, _is_private_ip


def test_is_private_ip_detects() -> None:
    assert _is_private_ip("10.0.0.1") is True
    assert _is_private_ip("8.8.8.8") is False
    assert _is_private_ip("not-an-ip") is False


def test_assert_url_safe_rejects_schema() -> None:
    with pytest.raises(ExternalAPIError, match="scheme"):
        ecs._assert_url_safe("ftp://api.pwnedpasswords.com/x")


def test_assert_url_safe_rejects_no_hostname() -> None:
    with pytest.raises(ExternalAPIError, match="hostname"):
        ecs._assert_url_safe("https:///path")


def test_assert_url_safe_rejects_localhost() -> None:
    with pytest.raises(ExternalAPIError, match="localhost"):
        ecs._assert_url_safe("https://127.0.0.1/x")
    with pytest.raises(ExternalAPIError, match="localhost"):
        ecs._assert_url_safe("https://localhost/x")


def test_assert_url_safe_rejects_private_hostname() -> None:
    with pytest.raises(ExternalAPIError, match="private"):
        ecs._assert_url_safe("https://10.0.0.1/x")


def test_assert_url_resolves_to_private() -> None:
    with (
        patch.object(ecs.socket, "getaddrinfo", return_value=[(0, 0, 0, 0, ("10.0.0.2", 443))]),
        pytest.raises(ExternalAPIError, match="resolves to private"),
    ):
        ecs._assert_url_safe("https://example.com/x")


def test_assert_url_gaierror_passes() -> None:
    with patch.object(ecs.socket, "getaddrinfo", side_effect=socket.gaierror):
        ecs._assert_url_safe("https://example.com/x")


@pytest.mark.asyncio
async def test_external_get_pwned_success() -> None:
    u = "https://api.pwnedpasswords.com/range/ABC"
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.text = "ok"
    with patch("services.external_client_service.httpx.AsyncClient") as c:
        c.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_resp)
        c.return_value.__aexit__ = AsyncMock(return_value=None)
        out = await ExternalClient().external_get(u, service_name="Pwned")
    assert out == "ok"


@pytest.mark.asyncio
async def test_external_get_json_not_dict() -> None:
    u = "https://api.pwnedpasswords.com/v1/invalid-json-shape"
    mock_resp = MagicMock()
    mock_resp.raise_for_status = MagicMock()
    mock_resp.json.return_value = [1, 2, 3]
    with patch("services.external_client_service.httpx.AsyncClient") as c:
        c.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_resp)
        c.return_value.__aexit__ = AsyncMock(return_value=None)
        with pytest.raises(ExternalAPIError, match="invalid response"):
            await ExternalClient().external_get_json(u, service_name="Pwned")
