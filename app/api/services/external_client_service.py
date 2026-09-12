from __future__ import annotations

import ipaddress
import socket
from typing import Any
from urllib.parse import urlparse

import httpx

from core.exceptions import ExternalAPIError, ServiceUnavailableError

_ALLOWED_SCHEMES = frozenset({"http", "https"})

_ALLOWED_HOSTS: frozenset[str] = frozenset(
    {
        "api.pwnedpasswords.com",
        "sandbox.przelewy24.pl",
        "secure.przelewy24.pl",
    }
)


def _is_private_ip(host: str) -> bool:
    try:
        addr = ipaddress.ip_address(host)
    except ValueError:
        return False
    return addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_reserved


def _assert_url_safe(url: str) -> None:
    parsed = urlparse(url)

    if parsed.scheme not in _ALLOWED_SCHEMES:
        msg = f"Blocked request to disallowed scheme: {parsed.scheme}"
        raise ExternalAPIError(message=msg)

    hostname = parsed.hostname
    if not hostname:
        msg = "Blocked request with missing hostname"
        raise ExternalAPIError(message=msg)

    if hostname in {"localhost", "127.0.0.1", "::1", "0.0.0.0"}:
        msg = "Blocked request to localhost"
        raise ExternalAPIError(message=msg)

    if _is_private_ip(hostname):
        msg = "Blocked request to private/internal IP address"
        raise ExternalAPIError(message=msg)

    if hostname not in _ALLOWED_HOSTS:
        try:
            resolved = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
            for _, _, _, _, sockaddr in resolved:
                ip_str = sockaddr[0]
                if _is_private_ip(ip_str):
                    msg = f"Blocked request: {hostname} resolves to private IP"
                    raise ExternalAPIError(message=msg)
        except socket.gaierror:
            pass


class ExternalClient:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient()

    async def external_get(
        self,
        url: str,
        *,
        headers: dict[str, str] | None = None,
        timeout: float = 10.0,
        service_name: str = "External API",
    ) -> str:
        """GET a plain-text response from an external API."""
        _assert_url_safe(url)
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers or {}, timeout=timeout)
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                error_message = self._extract_error_message(e)
                raise ExternalAPIError(message=f"{service_name} error: {error_message}") from e
            except httpx.RequestError as e:
                raise ServiceUnavailableError(
                    message=f"Failed to connect to {service_name}: {e!s}",
                ) from e
            else:
                return response.text

    async def external_get_json(
        self,
        url: str,
        *,
        headers: dict[str, str] | None = None,
        timeout: float = 30.0,
        service_name: str = "External API",
    ) -> dict[str, Any]:
        _assert_url_safe(url)
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers or {}, timeout=timeout)
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                error_message = self._extract_error_message(e)
                raise ExternalAPIError(message=f"{service_name} error: {error_message}") from e
            except httpx.RequestError as e:
                raise ServiceUnavailableError(
                    message=f"Failed to connect to {service_name}: {e!s}",
                ) from e
            else:
                payload = response.json()
                if not isinstance(payload, dict):
                    raise ExternalAPIError(message=f"{service_name} error: invalid response")
                return payload

    async def post_json(
        self,
        url: str,
        *,
        json: dict[str, Any],
        headers: dict[str, str] | None = None,
        timeout: float = 30.0,
    ) -> dict[str, Any]:
        _assert_url_safe(url)
        merged_headers = {"Content-Type": "application/json", **(headers or {})}
        response = await self._client.post(url, json=json, headers=merged_headers, timeout=timeout)
        response.raise_for_status()
        return response.json()

    async def _external_send_json(
        self,
        method: str,
        url: str,
        *,
        json: dict[str, Any],
        headers: dict[str, str] | None = None,
        timeout: float = 30.0,
        service_name: str = "External API",
    ) -> dict[str, Any]:
        _assert_url_safe(url)
        merged_headers = {"Content-Type": "application/json", **(headers or {})}
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(
                    method,
                    url,
                    json=json,
                    headers=merged_headers,
                    timeout=timeout,
                )
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                error_message = self._extract_error_message(e)
                raise ExternalAPIError(message=f"{service_name} error: {error_message}") from e
            except httpx.RequestError as e:
                raise ServiceUnavailableError(
                    message=f"Failed to connect to {service_name}: {e!s}",
                ) from e
            else:
                if method == "PUT" and not response.text.strip():
                    return {}
                payload = response.json()
                if not isinstance(payload, dict):
                    raise ExternalAPIError(message=f"{service_name} error: invalid response")
                return payload

    async def external_post_json(
        self,
        url: str,
        *,
        json: dict[str, Any],
        headers: dict[str, str] | None = None,
        timeout: float = 30.0,
        service_name: str = "External API",
    ) -> dict[str, Any]:
        """POST JSON to an external API. Returns parsed JSON on success.
        Raises ExternalAPIError on 4xx/5xx, ServiceUnavailableError on connection/timeout.
        """
        return await self._external_send_json(
            "POST",
            url,
            json=json,
            headers=headers,
            timeout=timeout,
            service_name=service_name,
        )

    async def external_put_json(
        self,
        url: str,
        *,
        json: dict[str, Any],
        headers: dict[str, str] | None = None,
        timeout: float = 30.0,
        service_name: str = "External API",
    ) -> dict[str, Any]:
        return await self._external_send_json(
            "PUT",
            url,
            json=json,
            headers=headers,
            timeout=timeout,
            service_name=service_name,
        )

    @staticmethod
    def _extract_error_message(e: httpx.HTTPStatusError) -> str:
        try:
            body = e.response.json()
            if isinstance(body, dict):
                inner = body.get("error") or body.get("errors") or body
                if isinstance(inner, dict) and "message" in inner:
                    return str(inner["message"])
                if isinstance(inner, str):
                    return inner
            return e.response.text or str(e)
        except Exception:
            return e.response.text or str(e)
