import json
import logging

from fastapi import Request

from core.foundation.client_ip import get_client_ip
from core.foundation.logging import audit as audit_module
from core.foundation.logging.audit import AuditLogger, _base_payload, _setup_audit_logger


def _request(path: str = "/x", headers=None, client=None) -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": path,
        "headers": headers or [],
        "client": client,
    }
    request = Request(scope)
    request.state.request_id = "req-1"
    return request


def test_setup_audit_logger_returns_existing_logger_when_handler_present() -> None:
    logger = logging.getLogger("restorio.audit")
    if not logger.handlers:
        logger.addHandler(logging.NullHandler())

    result = _setup_audit_logger()

    assert result is logger


def test_client_ip_from_forwarded_or_unknown() -> None:
    req_with_forwarded = _request(
        headers=[(b"x-forwarded-for", b"198.51.100.5, 10.0.0.2")],
        client=("127.0.0.1", 1234),
    )
    assert get_client_ip(req_with_forwarded) == "198.51.100.5"

    req_unknown = _request(client=None)
    assert get_client_ip(req_unknown) == "unknown"


def test_base_payload_contains_common_fields() -> None:
    req = _request(headers=[(b"user-agent", b"pytest-agent")], client=("127.0.0.1", 1234))
    payload = _base_payload(req)

    assert payload["request_id"] == "req-1"
    assert payload["ip"] == "127.0.0.1"
    assert payload["user_agent"] == "pytest-agent"
    assert payload["path"] == "/x"
    assert isinstance(payload["ts"], float)


def test_audit_logger_methods_emit_json(monkeypatch) -> None:
    emitted = []

    monkeypatch.setattr(audit_module, "_logger", type("L", (), {"info": emitted.append})())

    logger = AuditLogger()
    req = _request(path="/api/v1/auth/login", client=("127.0.0.1", 1))

    logger.login_success(request=req, user_id="u1", email="a@b.com")
    logger.login_failure(request=req, email="a@b.com")
    logger.logout(request=req, user_id="u1")
    logger.token_refresh(request=req, user_id="u1", family="fam")
    logger.token_reuse_detected(request=req, user_id="u1", family="fam")
    logger.activation_success(request=req, user_id="u1", tenant_id="t1")
    logger.password_set(request=req, user_id="u1")
    logger.rate_limited(request=req)
    logger.register(request=req, email="a@b.com")

    expected_audit_events_count = 9
    assert len(emitted) == expected_audit_events_count
    parsed = [json.loads(item) for item in emitted]
    assert parsed[0]["event"] == "login_success"
    assert parsed[1]["reason"] == "invalid_credentials"
    assert parsed[-1]["event"] == "register"
