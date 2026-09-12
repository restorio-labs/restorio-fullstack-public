from datetime import datetime

from pydantic import EmailStr, Field

from core.dto.v1.common import AccountType, BaseDTO, EntityId


class UserResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="User identifier")
    email: EmailStr = Field(..., description="User email address")
    account_type: AccountType = Field(..., description="Account type")
    is_active: bool = Field(..., description="Whether user account is active")
    created_at: datetime = Field(..., description="Timestamp when user was created")
