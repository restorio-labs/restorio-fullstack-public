from datetime import UTC, datetime, timedelta
from unittest.mock import Mock, patch

from fastapi import Request  # pyright: ignore[reportMissingImports]
import jwt
import pytest  # pyright: ignore[reportMissingImports]

from core.exceptions import UnauthorizedError
from core.foundation.infra.config import settings
from core.foundation.security import (
    SecurityService,
    get_current_user,
)


class TestCreateAccessToken:
    def test_create_access_token_with_default_expiry(self) -> None:
        service = SecurityService()
        data = {"sub": "test@example.com"}
        token = service.create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

        decoded = service.decode_access_token(token)
        assert decoded["sub"] == "test@example.com"
        assert "exp" in decoded

    def test_create_access_token_with_custom_expiry(self) -> None:
        service = SecurityService()
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=30)
        token = service.create_access_token(data, expires_delta=expires_delta)

        assert isinstance(token, str)
        decoded = service.decode_access_token(token)
        assert decoded["sub"] == "test@example.com"

    def test_create_access_token_preserves_data(self) -> None:
        service = SecurityService()
        data = {
            "sub": "user@example.com",
            "role": "admin",
            "tenant_id": "123",
            "tenant_ids": ["123", "456"],
        }
        token = service.create_access_token(data)

        decoded = service.decode_access_token(token)
        assert decoded["sub"] == "user@example.com"
        assert decoded["role"] == "admin"
        assert decoded["tenant_id"] == "123"
        assert decoded["tenant_ids"] == ["123", "456"]


class TestDecodeAccessToken:
    def test_decode_valid_token(self) -> None:
        service = SecurityService()
        data = {"sub": "test@example.com"}
        token = service.create_access_token(data)

        decoded = service.decode_access_token(token)
        assert decoded["sub"] == "test@example.com"

    def test_decode_invalid_token(self) -> None:
        service = SecurityService()
        invalid_token = "invalid.token.here"
        with pytest.raises(UnauthorizedError):
            service.decode_access_token(invalid_token)

    def test_decode_empty_token(self) -> None:
        service = SecurityService()
        with pytest.raises(UnauthorizedError):
            service.decode_access_token("")

    def test_decode_malformed_token(self) -> None:
        service = SecurityService()
        malformed_token = "not.a.valid.jwt.token"
        with pytest.raises(UnauthorizedError):
            service.decode_access_token(malformed_token)

    def test_decode_expired_token_raises(self) -> None:
        service = SecurityService()
        expired = jwt.encode(
            {"sub": "u1", "exp": datetime.now(UTC) - timedelta(minutes=5)},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        with pytest.raises(UnauthorizedError):
            service.decode_access_token(expired)

    def test_decode_access_token_handles_unexpected_exception(self) -> None:
        service = SecurityService()
        with (
            patch("core.foundation.security.jwt.decode", side_effect=RuntimeError("boom")),
            pytest.raises(UnauthorizedError),
        ):
            service.decode_access_token("any-token")


class TestHashPassword:
    def test_hash_password_returns_different_hash(self) -> None:
        service = SecurityService()
        password = "test_password_123"
        hashed = service.hash_password(password)

        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith("$2b$")

    def test_hash_password_same_password_different_hashes(self) -> None:
        service = SecurityService()
        password = "test_password_123"
        hashed1 = service.hash_password(password)
        hashed2 = service.hash_password(password)

        assert hashed1 != hashed2

    def test_hash_password_empty_string(self) -> None:
        service = SecurityService()
        password = ""
        hashed = service.hash_password(password)

        assert len(hashed) > 0
        assert hashed.startswith("$2b$")


class TestVerifyPassword:
    def test_verify_password_correct(self) -> None:
        service = SecurityService()
        password = "test_password_123"
        hashed = service.hash_password(password)

        assert service.verify_password(password, hashed) is True

    def test_verify_password_incorrect(self) -> None:
        service = SecurityService()
        password = "test_password_123"
        hashed = service.hash_password(password)

        assert service.verify_password("wrong_password", hashed) is False

    def test_verify_password_empty_password(self) -> None:
        service = SecurityService()
        password = ""
        hashed = service.hash_password(password)

        assert service.verify_password("", hashed) is True
        assert service.verify_password("not_empty", hashed) is False

    def test_verify_password_case_sensitive(self) -> None:
        service = SecurityService()
        password = "TestPassword"
        hashed = service.hash_password(password)

        assert service.verify_password("TestPassword", hashed) is True
        assert service.verify_password("testpassword", hashed) is False
        assert service.verify_password("TESTPASSWORD", hashed) is False


class TestGetCurrentUser:
    @pytest.mark.asyncio
    async def test_get_current_user_raises_without_bearer_header(self) -> None:
        request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
        service = Mock()

        with pytest.raises(UnauthorizedError):
            await get_current_user(service, request)

    @pytest.mark.asyncio
    async def test_get_current_user_decodes_bearer_token(self) -> None:
        request = Request(
            {
                "type": "http",
                "method": "GET",
                "path": "/",
                "headers": [(b"authorization", b"Bearer token-123")],
            }
        )
        service = Mock()
        service.decode_access_token.return_value = {"sub": "user@example.com"}

        user = await get_current_user(service, request)

        assert user == {"sub": "user@example.com"}
        service.decode_access_token.assert_called_once_with(token="token-123")
