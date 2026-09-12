from datetime import UTC, datetime
from uuid import uuid4

from pydantic import ValidationError
import pytest

from core.dto.v1.common import AccountType
from core.dto.v1.users import (
    CreateUserDTO,
    UpdateUserDTO,
    UserLoginDTO,
    UserResponseDTO,
)


class TestCreateUserDTO:
    def test_valid_creation(self) -> None:
        dto = CreateUserDTO(
            email="user@example.com",
            password="securepassword123",
        )
        assert dto.email == "user@example.com"
        assert dto.password == "securepassword123"
        assert dto.account_type == AccountType.OWNER
        assert dto.is_active is True

    def test_custom_account_type(self) -> None:
        dto = CreateUserDTO(
            email="waiter@example.com",
            password="password123",
            account_type=AccountType.WAITER,
        )
        assert dto.account_type == AccountType.WAITER

    def test_inactive_user(self) -> None:
        dto = CreateUserDTO(
            email="inactive@example.com",
            password="password123",
            is_active=False,
        )
        assert dto.is_active is False

    def test_invalid_email(self) -> None:
        with pytest.raises(ValidationError):
            CreateUserDTO(
                email="not-an-email",
                password="password123",
            )

    def test_password_too_short(self) -> None:
        with pytest.raises(ValidationError):
            CreateUserDTO(
                email="user@example.com",
                password="Ab1!",
            )

    def test_password_too_long(self) -> None:
        with pytest.raises(ValidationError):
            CreateUserDTO(
                email="user@example.com",
                password="x" * 129,
            )


class TestUpdateUserDTO:
    def test_update_email_only(self) -> None:
        dto = UpdateUserDTO(email="newemail@example.com")
        assert dto.email == "newemail@example.com"
        assert dto.password is None
        assert dto.account_type is None
        assert dto.is_active is None

    def test_update_password_only(self) -> None:
        dto = UpdateUserDTO(password="newpassword123")
        assert dto.email is None
        assert dto.password == "newpassword123"

    def test_update_account_type_only(self) -> None:
        dto = UpdateUserDTO(account_type=AccountType.KITCHEN)
        assert dto.account_type == AccountType.KITCHEN
        assert dto.email is None

    def test_update_is_active_only(self) -> None:
        dto = UpdateUserDTO(is_active=False)
        assert dto.is_active is False
        assert dto.email is None

    def test_full_update(self) -> None:
        dto = UpdateUserDTO(
            email="updated@example.com",
            password="newpassword123",
            account_type=AccountType.WAITER,
            is_active=False,
        )
        assert dto.email == "updated@example.com"
        assert dto.password == "newpassword123"
        assert dto.account_type == AccountType.WAITER
        assert dto.is_active is False

    def test_empty_update(self) -> None:
        dto = UpdateUserDTO()
        assert dto.email is None
        assert dto.password is None
        assert dto.account_type is None
        assert dto.is_active is None


class TestUserLoginDTO:
    def test_valid_login(self) -> None:
        dto = UserLoginDTO(
            email="user@example.com",
            password="password123",
        )
        assert dto.email == "user@example.com"
        assert dto.password == "password123"

    def test_invalid_email(self) -> None:
        with pytest.raises(ValidationError):
            UserLoginDTO(
                email="invalid-email",
                password="password123",
            )


class TestUserResponseDTO:
    def test_valid_response(self) -> None:
        user_id = uuid4()
        now = datetime.now(UTC)
        dto = UserResponseDTO(
            id=user_id,
            email="user@example.com",
            account_type=AccountType.OWNER,
            is_active=True,
            created_at=now,
        )
        assert dto.id == user_id
        assert dto.email == "user@example.com"
        assert dto.account_type == AccountType.OWNER
        assert dto.is_active is True
        assert dto.created_at == now

    def test_different_account_types(self) -> None:
        user_id = uuid4()
        now = datetime.now(UTC)

        for account_type in [AccountType.OWNER, AccountType.WAITER, AccountType.KITCHEN]:
            dto = UserResponseDTO(
                id=user_id,
                email="user@example.com",
                account_type=account_type,
                is_active=True,
                created_at=now,
            )
            assert dto.account_type == account_type
