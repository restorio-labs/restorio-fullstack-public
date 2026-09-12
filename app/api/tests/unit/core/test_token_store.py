import time

from core.foundation.token_store import RefreshTokenStore, generate_family, generate_jti


def test_generate_identifiers_are_non_empty() -> None:
    assert generate_jti()
    assert generate_family()


def test_revoke_and_check_revocation() -> None:
    store = RefreshTokenStore()

    assert store.is_revoked("family-1", "jti-1") is False

    store.revoke("family-1", "jti-1")

    assert store.is_revoked("family-1", "jti-1") is True
    assert store.is_revoked("family-1", "jti-2") is False


def test_revoke_family_marks_family_revoked() -> None:
    store = RefreshTokenStore()

    assert store.is_family_revoked("family-1") is False

    store.revoke_family("family-1")

    assert store.is_family_revoked("family-1") is True


def test_cleanup_expired_removes_old_families(monkeypatch) -> None:
    store = RefreshTokenStore(family_ttl_seconds=10)

    store.revoke("fresh", "jti-a")
    store.revoke("expired", "jti-b")
    store._families["fresh"].created_at = 100.0
    store._families["expired"].created_at = 0.0

    monkeypatch.setattr(time, "monotonic", lambda: 105.0)
    store.cleanup_expired()

    assert "fresh" in store._families
    assert "expired" not in store._families
