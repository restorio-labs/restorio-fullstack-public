"""Trusted proxy-aware client IP extraction.

Extracts the real client IP address from requests, handling X-Forwarded-For
headers only when the request comes through a trusted proxy.
"""

from __future__ import annotations

from functools import lru_cache
import ipaddress

from fastapi import Request

from core.foundation.infra.config import settings

TRUSTED_PROXY_CIDRS: list[str] = [
    "127.0.0.0/8",
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16",
    "::1/128",
    "fc00::/7",
]


@lru_cache(maxsize=1)
def _get_trusted_networks() -> list[ipaddress.IPv4Network | ipaddress.IPv6Network]:
    """Parse and cache trusted proxy CIDR ranges."""
    networks: list[ipaddress.IPv4Network | ipaddress.IPv6Network] = []
    cidrs = getattr(settings, "TRUSTED_PROXY_CIDRS", None) or TRUSTED_PROXY_CIDRS
    for cidr in cidrs:
        try:
            networks.append(ipaddress.ip_network(cidr, strict=False))
        except ValueError:
            continue
    return networks


def _is_trusted_proxy(ip: str) -> bool:
    """Check if the given IP is within a trusted proxy range."""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False

    return any(addr in network for network in _get_trusted_networks())


def get_client_ip(request: Request) -> str:
    """Extract the real client IP address from a request.

    If the direct connection comes from a trusted proxy, uses the first
    IP in X-Forwarded-For that is not a trusted proxy. Otherwise, returns
    the direct connection IP.

    This prevents IP spoofing by untrusted clients sending fake
    X-Forwarded-For headers.
    """
    direct_ip = request.client.host if request.client else None

    if direct_ip is None:
        return "unknown"

    if not _is_trusted_proxy(direct_ip):
        return direct_ip

    forwarded = request.headers.get("X-Forwarded-For")
    if not forwarded:
        return direct_ip

    ips = [ip.strip() for ip in forwarded.split(",")]

    for ip in ips:
        if ip and not _is_trusted_proxy(ip):
            return ip

    return direct_ip
