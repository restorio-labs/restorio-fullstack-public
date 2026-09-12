from pydantic import ValidationError as PydanticValidationError
import pytest

from core.dto.v1.auth import (
    ActivateResponseData,
    AuthMeSessionData,
    BulkCreateUsersDTO,
    CreateUserDTO,
    LoginResponseData,
    RegisterCreatedData,
    RegisterDTO,
    RegisterResponseDTO,
    SetPasswordDTO,
    TenantSlugData,
)
from core.exceptions import ValidationError

BULK_USERS_COUNT = 2


class TestRegisterDTO:
    def test_valid_registration(self) -> None:
        dto = RegisterDTO(
            email="user@example.com",
            password="SecurePass1!",
        )
        assert dto.email == "user@example.com"
        assert dto.password == "SecurePass1!"

    def test_password_too_short_raises_validation_error(self) -> None:
        with pytest.raises(PydanticValidationError) as exc_info:
            RegisterDTO(
                email="user@example.com",
                password="Ab1!",
            )
        assert "5" in str(exc_info.value)

    def test_password_missing_lowercase_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            RegisterDTO(
                email="user@example.com",
                password="SECUREPASS1!",
            )
        assert "lowercase" in exc_info.value.detail

    def test_password_missing_uppercase_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            RegisterDTO(
                email="user@example.com",
                password="securepass1!",
            )
        assert "uppercase" in exc_info.value.detail

    def test_password_missing_number_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            RegisterDTO(
                email="user@example.com",
                password="SecurePass!",
            )
        assert "number" in exc_info.value.detail

    def test_password_missing_special_char_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            RegisterDTO(
                email="user@example.com",
                password="SecurePass123",
            )
        assert "special" in exc_info.value.detail


class TestCreateUserDTO:
    def test_valid_staff_access_level(self) -> None:
        dto = CreateUserDTO(
            email="waiter@example.com",
            access_level="waiter",
            name="Jan",
            surname="Kowalski",
        )
        assert dto.email == "waiter@example.com"
        assert dto.access_level.value == "waiter"
        assert dto.name == "Jan"
        assert dto.surname == "Kowalski"

    def test_waiter_without_name_or_surname_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            CreateUserDTO(
                email="waiter@example.com",
                access_level="waiter",
            )
        assert "required for waiter accounts" in exc_info.value.detail

    def test_kitchen_ignores_name_and_surname(self) -> None:
        dto = CreateUserDTO(
            email="kitchen@example.com",
            access_level="kitchen",
            name="Ignored",
            surname="Ignored",
        )
        assert dto.name is None
        assert dto.surname is None

    def test_invalid_access_level_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            CreateUserDTO(
                email="owner@example.com",
                access_level="owner",
            )
        assert "waiter or kitchen" in exc_info.value.detail


class TestSetPasswordDTO:
    def test_valid_set_password(self) -> None:
        dto = SetPasswordDTO(
            activation_id="c0d2d1ef-7edb-4b95-95f3-39f791ac4adf",
            password="SecurePass1!",
        )
        assert str(dto.activation_id) == "c0d2d1ef-7edb-4b95-95f3-39f791ac4adf"
        assert dto.password == "SecurePass1!"

    def test_password_complexity_validation(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            SetPasswordDTO(
                activation_id="c0d2d1ef-7edb-4b95-95f3-39f791ac4adf",
                password="weakpass",
            )
        assert (
            "uppercase" in exc_info.value.detail.lower()
            or "number" in exc_info.value.detail.lower()
        )


class TestRegisterCreatedData:
    def test_valid_creation(self) -> None:
        dto = RegisterCreatedData(
            user_id="user-123",
            email="user@example.com",
        )
        assert dto.user_id == "user-123"
        assert dto.email == "user@example.com"


class TestRegisterResponseDTO:
    def test_valid_with_default_message(self) -> None:
        dto = RegisterResponseDTO(
            user_id="user-123",
            email="user@example.com",
            account_type="owner",
            tenant_id="tenant-456",
            tenant_name="My Venue",
            tenant_slug="my-venue",
        )
        assert dto.message == "Konto zostalo utworzone pomyslnie, wkrotce otrzymasz e-mail"

    def test_valid_with_custom_message(self) -> None:
        dto = RegisterResponseDTO(
            user_id="user-123",
            email="user@example.com",
            account_type="owner",
            tenant_id="tenant-456",
            tenant_name="My Venue",
            tenant_slug="my-venue",
            message="Custom message",
        )
        assert dto.message == "Custom message"


class TestTenantSlugData:
    def test_valid_slug(self) -> None:
        dto = TenantSlugData(tenant_slug="my-restaurant")
        assert dto.tenant_slug == "my-restaurant"

    def test_null_slug(self) -> None:
        dto = TenantSlugData()
        assert dto.tenant_slug is None


class TestActivateResponseData:
    def test_defaults(self) -> None:
        dto = ActivateResponseData(tenant_slug="my-restaurant")
        assert dto.tenant_slug == "my-restaurant"
        assert dto.requires_password_change is False

    def test_no_tenant(self) -> None:
        dto = ActivateResponseData()
        assert dto.tenant_slug is None
        assert dto.requires_password_change is False


class TestLoginResponseData:
    def test_valid_response(self) -> None:
        dto = LoginResponseData(at="jwt-access-token")
        assert dto.model_dump() == {}


class TestAuthMeSessionData:
    def test_defaults(self) -> None:
        dto = AuthMeSessionData()
        assert dto.authenticated is True
        assert dto.account_type is None

    def test_with_account_type(self) -> None:
        dto = AuthMeSessionData(account_type="owner")
        assert dto.authenticated is True
        assert dto.account_type == "owner"


class TestBulkCreateUsersDTO:
    def test_valid_bulk_create(self) -> None:
        dto = BulkCreateUsersDTO(
            users=[
                {
                    "email": "waiter1@example.com",
                    "access_level": "waiter",
                    "name": "Jan",
                    "surname": "Kowalski",
                },
                {
                    "email": "kitchen1@example.com",
                    "access_level": "kitchen",
                },
            ]
        )
        assert len(dto.users) == BULK_USERS_COUNT

    def test_empty_users_list_rejected(self) -> None:
        with pytest.raises(PydanticValidationError):
            BulkCreateUsersDTO(users=[])


class TestCreateUserDTONameNormalization:
    def test_name_none_stays_none(self) -> None:
        dto = CreateUserDTO(
            email="kitchen@example.com",
            access_level="kitchen",
            name=None,
            surname=None,
        )
        assert dto.name is None
        assert dto.surname is None

    def test_empty_string_name_becomes_none(self) -> None:
        dto = CreateUserDTO(
            email="kitchen@example.com",
            access_level="kitchen",
            name="",
            surname="   ",
        )
        assert dto.name is None
        assert dto.surname is None

    def test_whitespace_only_name_becomes_none(self) -> None:
        dto = CreateUserDTO(
            email="kitchen@example.com",
            access_level="kitchen",
            name="   ",
            surname="\t\n",
        )
        assert dto.name is None
        assert dto.surname is None
