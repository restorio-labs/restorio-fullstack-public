from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

from core.dto.v1.payments import CreateTransactionDTO
from core.exceptions import (
    BadRequestError,
    ExternalAPIError,
    NotFoundResponse,
    ServiceUnavailableError,
)
from core.foundation.http.responses import CreatedResponse
from routes.v1.payments.payments import create_payment
from services.payment_service import P24Service


class TestCalculatePrzelewy24Sign:
    EXPECTED_SIGN_LENGTH = 96

    def test_returns_96_char_hex_string(self) -> None:
        result = P24Service._przelewy24_sign(
            session_id="s1",
            merchant_id=1,
            amount=100,
            currency="PLN",
            crc="crc",
        )
        assert len(result) == self.EXPECTED_SIGN_LENGTH
        assert all(c in "0123456789abcdef" for c in result)

    def test_deterministic_for_same_inputs(self) -> None:
        a = P24Service._przelewy24_sign("s", 1, 100, "PLN", "x")
        b = P24Service._przelewy24_sign("s", 1, 100, "PLN", "x")
        assert a == b

    def test_different_inputs_different_sign(self) -> None:
        a = P24Service._przelewy24_sign("s1", 1, 100, "PLN", "crc")
        b = P24Service._przelewy24_sign("s2", 1, 100, "PLN", "crc")
        assert a != b

    def test_utf8_currency_in_sign(self) -> None:
        result_pln = P24Service._przelewy24_sign("s", 1, 100, "PLN", "c")
        result_eur = P24Service._przelewy24_sign("s", 1, 100, "EUR", "c")
        assert result_pln != result_eur


class TestValidateTenantP24Credentials:
    def test_raises_when_all_credentials_missing(self) -> None:
        tenant = Mock(name="Test Restaurant", p24_merchantid=None, p24_api=None, p24_crc=None)
        with pytest.raises(BadRequestError) as exc_info:
            P24Service.validate_tenant_p24_credentials(tenant)
        assert "Przelewy24 credentials" in exc_info.value.detail

    def test_raises_when_partial_credentials(self) -> None:
        tenant = Mock(name="Test Restaurant", p24_merchantid=12345, p24_api=None, p24_crc="crc")
        with pytest.raises(BadRequestError):
            P24Service.validate_tenant_p24_credentials(tenant)

    def test_passes_when_all_credentials_present(self) -> None:
        tenant = Mock(p24_merchantid=12345, p24_api="key", p24_crc="crc")
        P24Service.validate_tenant_p24_credentials(tenant)


@pytest.fixture
def tenant_id():
    return uuid4()


@pytest.fixture
def create_transaction_request(tenant_id):
    return CreateTransactionDTO(
        tenant_id=tenant_id,
        amount=10000,
        email="user@example.com",
        order={"items": [{"name": "Pizza", "qty": 1}]},
        note="Test payment",
    )


@pytest.fixture
def mock_tenant(tenant_id):
    tenant = Mock()
    tenant.id = tenant_id
    tenant.name = "Test Restaurant"
    tenant.p24_merchantid = 12345
    tenant.p24_api = "test-api-key"
    tenant.p24_crc = "test-crc"
    return tenant


@pytest.fixture
def przelewy24_success_response():
    return {"data": {"token": "p24-token-xyz"}, "responseCode": 0}


@pytest.fixture
def mock_registration_result(przelewy24_success_response):
    result = Mock()
    result.session_id = str(uuid4())
    result.merchant_id = 12345
    result.pos_id = 12345
    result.amount = 10000
    result.currency = "PLN"
    result.description = "Test payment"
    result.email = "user@example.com"
    result.country = "PL"
    result.language = "pl"
    result.url_return = "http://localhost:3000/payment/return"
    result.url_status = "http://localhost:3000/api/v1/payments/status"
    result.sign = "a" * 96
    result.wait_for_result = True
    result.regulation_accept = True
    result.p24_response = przelewy24_success_response
    return result


@pytest.fixture
def mock_p24_service():
    service = Mock()
    service.register_transaction = AsyncMock()
    return service


@pytest.fixture
def mock_session():
    session = Mock()
    session.flush = AsyncMock()
    return session


@pytest.mark.asyncio
async def test_create_payment_success(
    create_transaction_request,
    mock_tenant,
    mock_registration_result,
    mock_p24_service,
    mock_session,
    przelewy24_success_response,
):
    tenant_service = AsyncMock()
    tenant_service.get_tenant.return_value = mock_tenant

    mock_p24_service.register_transaction.return_value = mock_registration_result
    external_client = Mock()

    result = await create_payment(
        "tenant-public",
        create_transaction_request,
        mock_session,
        tenant_service,
        mock_p24_service,
        external_client,
        create_transaction_request.tenant_id,
    )

    assert isinstance(result, CreatedResponse)
    assert result.message == "Payment transaction created successfully"
    assert result.data == przelewy24_success_response
    tenant_service.get_tenant.assert_called_once_with(
        mock_session, create_transaction_request.tenant_id
    )
    mock_p24_service.validate_tenant_p24_credentials.assert_called_once_with(mock_tenant)
    mock_p24_service.register_transaction.assert_called_once_with(
        external_client,
        merchant_id=mock_tenant.p24_merchantid,
        api_key=mock_tenant.p24_api,
        crc=mock_tenant.p24_crc,
        amount=create_transaction_request.amount,
        email=create_transaction_request.email,
        description=create_transaction_request.note,
    )
    mock_session.add.assert_called_once()
    mock_session.flush.assert_called_once()


@pytest.mark.asyncio
async def test_create_payment_tenant_not_found(create_transaction_request, mock_p24_service):
    session = AsyncMock()
    tenant_service = AsyncMock()
    tenant_service.get_tenant.side_effect = NotFoundResponse(
        "Tenant", str(create_transaction_request.tenant_id)
    )

    external_client = Mock()

    with pytest.raises(NotFoundResponse):
        await create_payment(
            "tenant-public",
            create_transaction_request,
            session,
            tenant_service,
            mock_p24_service,
            external_client,
            create_transaction_request.tenant_id,
        )


@pytest.mark.asyncio
async def test_create_payment_missing_p24_credentials(
    create_transaction_request, mock_tenant, mock_p24_service
):
    mock_tenant.p24_merchantid = None
    mock_tenant.p24_api = None
    mock_tenant.p24_crc = None

    session = AsyncMock()
    tenant_service = AsyncMock()
    tenant_service.get_tenant.return_value = mock_tenant

    mock_p24_service.validate_tenant_p24_credentials.side_effect = BadRequestError(
        message="Tenant 'Test Restaurant' does not have Przelewy24 credentials configured"
    )
    external_client = Mock()

    with pytest.raises(BadRequestError) as exc_info:
        await create_payment(
            "tenant-public",
            create_transaction_request,
            session,
            tenant_service,
            mock_p24_service,
            external_client,
            create_transaction_request.tenant_id,
        )

    mock_p24_service.validate_tenant_p24_credentials.assert_called_once_with(mock_tenant)
    assert "Przelewy24 credentials" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_payment_p24_api_error(
    create_transaction_request, mock_tenant, mock_p24_service
):
    session = AsyncMock()
    tenant_service = AsyncMock()
    tenant_service.get_tenant.return_value = mock_tenant

    mock_p24_service.register_transaction.side_effect = ExternalAPIError(
        message="Przelewy24 error: Invalid merchant configuration",
    )

    external_client = Mock()

    with pytest.raises(ExternalAPIError) as exc_info:
        await create_payment(
            "tenant-public",
            create_transaction_request,
            session,
            tenant_service,
            mock_p24_service,
            external_client,
            create_transaction_request.tenant_id,
        )

    assert exc_info.value.status_code == 502  # noqa: PLR2004
    assert "Przelewy24" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_payment_service_unavailable(
    create_transaction_request, mock_tenant, mock_p24_service
):
    session = AsyncMock()
    tenant_service = AsyncMock()
    tenant_service.get_tenant.return_value = mock_tenant

    mock_p24_service.register_transaction.side_effect = ServiceUnavailableError(
        message="Failed to connect to Przelewy24: Connection refused",
    )

    external_client = Mock()

    with pytest.raises(ServiceUnavailableError) as exc_info:
        await create_payment(
            "tenant-public",
            create_transaction_request,
            session,
            tenant_service,
            mock_p24_service,
            external_client,
            create_transaction_request.tenant_id,
        )

    assert exc_info.value.status_code == 503  # noqa: PLR2004
    assert "Przelewy24" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_payment_optional_fields_empty(
    tenant_id,
    mock_tenant,
    mock_registration_result,
    mock_p24_service,
    mock_session,
):
    request = CreateTransactionDTO(
        tenant_id=tenant_id,
        amount=5000,
        email="user@example.com",
    )

    tenant_service = AsyncMock()
    tenant_service.get_tenant.return_value = mock_tenant

    mock_p24_service.register_transaction.return_value = mock_registration_result
    external_client = Mock()

    result = await create_payment(
        "tenant-public",
        request,
        mock_session,
        tenant_service,
        mock_p24_service,
        external_client,
        tenant_id,
    )

    assert isinstance(result, CreatedResponse)
    call_kwargs = mock_p24_service.register_transaction.call_args.kwargs
    assert call_kwargs["description"] == ""
