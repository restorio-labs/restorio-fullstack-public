from enum import StrEnum
import re
from uuid import UUID

from pydantic import EmailStr, Field, field_validator, model_validator

from core.dto.v1.common import AccountType, BaseDTO
from core.exceptions import ValidationError

_MIN_PASSWORD_LENGTH = 8
_PASSWORD_SPECIAL = re.compile(r"[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?]")
_ERROR_MESSAGES = {
    "password_length": "Password must be at least 8 characters",
    "password_lowercase": "Password must contain at least one lowercase letter",
    "password_uppercase": "Password must contain at least one uppercase letter",
    "password_number": "Password must contain at least one number",
    "password_special": "Password must contain at least one special character",
}


def _validate_password_complexity(value: str) -> str:
    if len(value) < _MIN_PASSWORD_LENGTH:
        msg = _ERROR_MESSAGES["password_length"]
        raise ValidationError(message=msg)
    if not re.search(r"[a-z]", value):
        msg = _ERROR_MESSAGES["password_lowercase"]
        raise ValidationError(message=msg)
    if not re.search(r"[A-Z]", value):
        msg = _ERROR_MESSAGES["password_uppercase"]
        raise ValidationError(message=msg)
    if not re.search(r"[0-9]", value):
        msg = _ERROR_MESSAGES["password_number"]
        raise ValidationError(message=msg)
    if not _PASSWORD_SPECIAL.search(value):
        msg = _ERROR_MESSAGES["password_special"]
        raise ValidationError(message=msg)
    return value


class RegisterDTO(BaseDTO):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=5, max_length=128, description="User password")

    @field_validator("password")
    @classmethod
    def password_complexity(cls, value: str) -> str:
        return _validate_password_complexity(value)


class CreateUserDTO(BaseDTO):
    email: EmailStr = Field(..., description="User email address")
    access_level: AccountType = Field(..., description="Access level (waiter, kitchen)")
    name: str | None = Field(default=None, max_length=50, description="User first name")
    surname: str | None = Field(default=None, max_length=50, description="User surname")

    @field_validator("access_level")
    @classmethod
    def only_staff_access_levels(cls, value: AccountType) -> AccountType:
        if value not in {AccountType.WAITER, AccountType.KITCHEN}:
            msg = "Access level must be waiter or kitchen"
            raise ValidationError(message=msg)
        return value

    @field_validator("name", "surname", mode="before")
    @classmethod
    def normalize_optional_names(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        if normalized == "":
            return None

        return normalized

    @model_validator(mode="after")
    def validate_names_for_access_level(self) -> "CreateUserDTO":
        if self.access_level == AccountType.WAITER:
            if self.name is None or self.surname is None:
                msg = "Name and surname are required for waiter accounts"
                raise ValidationError(message=msg)
            return self

        object.__setattr__(self, "name", None)
        object.__setattr__(self, "surname", None)
        return self


class BulkCreateUsersDTO(BaseDTO):
    users: list[CreateUserDTO] = Field(
        ..., min_length=1, max_length=50, description="List of users to create"
    )


class SetPasswordDTO(BaseDTO):
    activation_id: UUID = Field(..., description="Activation link ID")
    password: str = Field(..., min_length=5, max_length=128, description="New password")

    @field_validator("password")
    @classmethod
    def password_complexity(cls, value: str) -> str:
        return _validate_password_complexity(value)


class ForgotPasswordDTO(BaseDTO):
    email: EmailStr = Field(..., description="Account email address")


class ResetPasswordDTO(BaseDTO):
    reset_token_id: UUID = Field(..., description="Password reset token id from email link")
    password: str = Field(..., min_length=5, max_length=128, description="New password")

    @field_validator("password")
    @classmethod
    def password_complexity(cls, value: str) -> str:
        return _validate_password_complexity(value)


class EmptyAuthActionData(BaseDTO):
    pass


class RegisterCreatedData(BaseDTO):
    user_id: str = Field(..., description="Created user ID")
    email: EmailStr = Field(..., description="User email")


class StaffInviteNotification(StrEnum):
    ACTIVATION = "activation"
    EXISTING_WAITER_NOTICE = "existing_waiter_notice"
    EXISTING_ACCOUNT_LINKED = "existing_account_linked"


class StaffUserCreatedData(BaseDTO):
    user_id: str = Field(..., description="Staff user ID")
    email: EmailStr = Field(..., description="User email")
    tenant_id: str = Field(..., description="Tenant public ID")
    tenant_name: str = Field(..., description="Restaurant name")
    tenant_slug: str = Field(..., description="Tenant slug")
    notification: StaffInviteNotification = Field(
        ...,
        description="Whether an activation email went out or an existing account was linked",
    )


class RegisterResponseDTO(BaseDTO):
    user_id: str = Field(..., description="Created user ID")
    email: EmailStr = Field(..., description="User email")
    account_type: str = Field(..., description="Account type")
    tenant_id: str = Field(..., description="Created tenant ID")
    tenant_name: str = Field(..., description="Tenant name")
    tenant_slug: str = Field(..., description="Tenant slug")
    message: str = Field(
        default="Konto zostalo utworzone pomyslnie, wkrotce otrzymasz e-mail",
        description="Success message",
    )


class TenantSlugData(BaseDTO):
    tenant_slug: str | None = Field(default=None, description="Tenant slug")


class ActivateResponseData(BaseDTO):
    tenant_slug: str | None = Field(default=None, description="Tenant slug")
    requires_password_change: bool = Field(
        default=False, description="Whether user must set password first"
    )


class LoginResponseData(BaseDTO):
    pass


class AuthMeSessionData(BaseDTO):
    authenticated: bool = Field(default=True, description="Whether the user is authenticated")
    account_type: str | None = Field(default=None, description="User's account type/role")
