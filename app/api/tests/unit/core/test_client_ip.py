from unittest.mock import patch

from fastapi import Request

from core.foundation.client_ip import _get_trusted_networks, _is_trusted_proxy, get_client_ip


def _request(
    *,
    path: str = "/",
    client: tuple[str, int] | None = ("203.0.113.1", 443),
    headers: list[tuple[bytes, bytes]] | None = None,
) -> Request:
    scope: dict = {
        "type": "http",
        "method": "GET",
        "path": path,
        "headers": headers or [],
    }
    if client is not None:
        scope["client"] = client
    return Request(scope)


def test_is_trusted_proxy_false_for_invalid_ip_string() -> None:
    assert _is_trusted_proxy("not-an-ip") is False


def test_get_client_ip_returns_direct_when_all_forwarded_are_trusted() -> None:
    req = _request(
        client=("127.0.0.1", 443),
        headers=[(b"x-forwarded-for", b"10.0.0.1, 172.16.0.2")],
    )
    assert get_client_ip(req) == "127.0.0.1"


def test_get_trusted_networks_skips_invalid_cidr_entries() -> None:
    _get_trusted_networks.cache_clear()
    with patch("core.foundation.client_ip.settings") as mock_settings:
        mock_settings.TRUSTED_PROXY_CIDRS = ["not-a-valid-network", "127.0.0.0/8"]
        networks = _get_trusted_networks()
        assert any("127.0.0.0" in str(n) for n in networks)
    _get_trusted_networks.cache_clear()
