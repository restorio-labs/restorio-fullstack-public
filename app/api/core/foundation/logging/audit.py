"""Structured audit logger for security-relevant events.

Emits JSON-structured log lines to a dedicated ``restorio.audit`` logger
so they can be routed to a SIEM / log aggregator independently of
application debug logs.
"""

from __future__ import annotations

import json
import logging
import sys
import time
from typing import Any

from fastapi import Request

from core.foundation.client_ip import get_client_ip


def _setup_audit_logger() -> logging.Logger:
    log = logging.getLogger("restorio.audit")
    if log.handlers:
        return log

    log.setLevel(logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)

    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    log.addHandler(handler)
    log.propagate = False
    return log


_logger = _setup_audit_logger()


def _base_payload(request: Request) -> dict[str, Any]:
    return {
        "request_id": getattr(request.state, "request_id", None),
        "ip": get_client_ip(request),
        "user_agent": request.headers.get("User-Agent", ""),
        "path": str(request.url.path),
        "ts": time.time(),
    }


class AuditLogger:
    def _emit(self, event: str, request: Request, **extra: Any) -> None:
        payload = _base_payload(request)
        payload["event"] = event
        payload.update(extra)
        _logger.info(json.dumps(payload, default=str))

    def login_success(self, *, request: Request, user_id: str, email: str) -> None:
        self._emit("login_success", request, user_id=user_id, email=email)

    def login_failure(
        self, *, request: Request, email: str, reason: str = "invalid_credentials"
    ) -> None:
        self._emit("login_failure", request, email=email, reason=reason)

    def logout(self, *, request: Request, user_id: str | None = None) -> None:
        self._emit("logout", request, user_id=user_id)

    def token_refresh(self, *, request: Request, user_id: str, family: str) -> None:
        self._emit("token_refresh", request, user_id=user_id, family=family)

    def token_reuse_detected(self, *, request: Request, user_id: str | None, family: str) -> None:
        self._emit("token_reuse_detected", request, user_id=user_id, family=family)

    def activation_success(
        self, *, request: Request, user_id: str, tenant_id: str | None = None
    ) -> None:
        self._emit("activation_success", request, user_id=user_id, tenant_id=tenant_id)

    def password_set(self, *, request: Request, user_id: str) -> None:
        self._emit("password_set", request, user_id=user_id)

    def rate_limited(self, *, request: Request) -> None:
        self._emit("rate_limited", request)

    def register(self, *, request: Request, email: str) -> None:
        self._emit("register", request, email=email)

    def password_reset_email_sent(self, *, request: Request, user_id: str) -> None:
        self._emit("password_reset_email_sent", request, user_id=user_id)

    def password_reset_completed(self, *, request: Request, user_id: str) -> None:
        self._emit("password_reset_completed", request, user_id=user_id)


audit = AuditLogger()
