from pydantic import BaseModel, ConfigDict, Field


class CreatePaymentRequest(BaseModel):
    """Request body for creating a payment via Przelewy24."""

    session_id: str = Field(..., alias="sessionId", description="Unique session identifier")
    amount: int = Field(..., gt=0, description="Amount in minor units (e.g. 10000 = 100.00 PLN)")
    currency: str = Field(default="PLN", description="Currency code")
    description: str = Field(..., description="Payment description")
    email: str = Field(..., description="Customer email address")
    country: str = Field(default="PL", description="Country code")
    language: str = Field(default="pl", description="Language code")
    url_return: str = Field(..., alias="urlReturn", description="Return URL after payment")
    url_status: str = Field(..., alias="urlStatus", description="Callback URL for payment status")
    wait_for_result: bool = Field(
        default=True, alias="waitForResult", description="Wait for payment result"
    )
    regulation_accept: bool = Field(
        default=False, alias="regulationAccept", description="Terms and conditions acceptance"
    )


class Przelewy24RegisterRequest(BaseModel):
    """Request body for Przelewy24 transaction/register API."""

    model_config = ConfigDict(populate_by_name=True)

    merchant_id: int = Field(..., alias="merchantId")
    pos_id: int = Field(..., alias="posId")
    session_id: str = Field(..., alias="sessionId")
    amount: int
    currency: str
    description: str
    email: str
    country: str
    language: str
    url_return: str = Field(..., alias="urlReturn")
    url_status: str = Field(..., alias="urlStatus")
    wait_for_result: bool = Field(..., alias="waitForResult")
    regulation_accept: bool = Field(..., alias="regulationAccept")
    sign: str


class Przelewy24VerifyRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    merchant_id: int = Field(..., alias="merchantId")
    pos_id: int = Field(..., alias="posId")
    session_id: str = Field(..., alias="sessionId")
    amount: int
    currency: str
    order_id: int = Field(..., alias="orderId")
    sign: str
