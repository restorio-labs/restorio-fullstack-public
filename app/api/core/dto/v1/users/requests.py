from pydantic import EmailStr, Field

from core.dto.v1.common import AccountType, BaseDTO


class CreateUserDTO(BaseDTO):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=5, max_length=128, description="User password")
    account_type: AccountType = Field(
        default=AccountType.OWNER, description="Account type (owner, waiter, kitchen)"
    )
    is_active: bool = Field(default=True, description="Whether user account is active")


class UpdateUserDTO(BaseDTO):
    email: EmailStr | None = Field(None, description="User email address")
    password: str | None = Field(None, min_length=5, max_length=128, description="User password")
    account_type: AccountType | None = Field(None, description="Account type")
    is_active: bool | None = Field(None, description="Whether user account is active")


class UserLoginDTO(BaseDTO):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")
