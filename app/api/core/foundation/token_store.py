"""In-memory refresh-token rotation store.

Tracks token families to detect replay attacks.  Each refresh token
carries a ``jti`` (unique id) and a ``family`` id.  When a token is
refreshed the old ``jti`` is revoked.  If a revoked ``jti`` is
presented again the entire family is invalidated, forcing the real
user to re-authenticate.

The store is process-local.  In a multi-process deployment swap this
for a Redis-backed implementation keyed on the same interface.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import secrets
import time


def generate_jti() -> str:
    return secrets.token_urlsafe(24)


def generate_family() -> str:
    return secrets.token_urlsafe(16)


@dataclass
class _FamilyRecord:
    revoked_jtis: set[str] = field(default_factory=set)
    created_at: float = field(default_factory=time.monotonic)


class RefreshTokenStore:
    def __init__(self, family_ttl_seconds: int = 14 * 24 * 3600) -> None:
        self._families: dict[str, _FamilyRecord] = {}
        self._family_ttl = family_ttl_seconds

    def revoke(self, family: str, jti: str) -> None:
        record = self._families.setdefault(family, _FamilyRecord())
        record.revoked_jtis.add(jti)

    def is_revoked(self, family: str, jti: str) -> bool:
        record = self._families.get(family)
        if record is None:
            return False
        return jti in record.revoked_jtis

    def revoke_family(self, family: str) -> None:
        self._families.pop(family, None)
        self._families[family] = _FamilyRecord()
        self._families[family].revoked_jtis.add("*")

    def is_family_revoked(self, family: str) -> bool:
        record = self._families.get(family)
        if record is None:
            return False
        return "*" in record.revoked_jtis

    def cleanup_expired(self) -> None:
        now = time.monotonic()
        expired = [
            fam for fam, rec in self._families.items() if now - rec.created_at > self._family_ttl
        ]
        for fam in expired:
            del self._families[fam]


refresh_token_store = RefreshTokenStore()
