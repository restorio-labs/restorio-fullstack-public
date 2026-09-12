from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
import pytest

from core.dto.v1.payments import UpdateP24ConfigDTO
from core.foundation.http.responses import UpdatedResponse
from core.models.enums import TenantStatus
from routes.v1.payments.p24_config import get_p24_config, update_p24_config


def _make_tenant(
    tenant_id=None,
    name="Test Restaurant",
    slug="test-restaurant",
    status=TenantStatus.ACTIVE,
    p24_merchantid=None,
    p24_api=None,
    p24_crc=None,
):
    tenant = MagicMock()
    tenant.id = tenant_id or uuid4()
    tenant.public_id = str(tenant.id)
    tenant.name = name
    tenant.slug = slug
    tenant.status = status
    tenant.created_at = datetime.now(UTC)
    tenant.p24_merchantid = p24_merchantid
    tenant.p24_api = p24_api
    tenant.p24_crc = p24_crc
    return tenant


def _make_session(tenant=None):
    session = AsyncMock()
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = tenant
    session.execute.return_value = result_mock
    return session


class TestUpdateP24Config:
    EXAMPLE_MERCHANT_ID = 123456
    EXAMPLE_API_KEY = "a" * 32
    EXAMPLE_CRC_KEY = "b" * 16

    @pytest.mark.asyncio
    async def test_updates_tenant_p24_fields(self) -> None:
        tenant = _make_tenant()
        session = _make_session(tenant)
        request = UpdateP24ConfigDTO(
            p24_merchantid=self.EXAMPLE_MERCHANT_ID,
            p24_api=self.EXAMPLE_API_KEY,
            p24_crc=self.EXAMPLE_CRC_KEY,
        )

        await update_p24_config(MagicMock(), tenant.id, request, session)

        assert tenant.p24_merchantid == self.EXAMPLE_MERCHANT_ID
        assert tenant.p24_api == self.EXAMPLE_API_KEY
        assert tenant.p24_crc == self.EXAMPLE_CRC_KEY

    @pytest.mark.asyncio
    async def test_commits_and_refreshes_session(self) -> None:
        tenant = _make_tenant()
        session = _make_session(tenant)
        request = UpdateP24ConfigDTO(
            p24_merchantid=self.EXAMPLE_MERCHANT_ID,
            p24_api=self.EXAMPLE_API_KEY,
            p24_crc=self.EXAMPLE_CRC_KEY,
        )

        await update_p24_config(MagicMock(), tenant.id, request, session)

        session.commit.assert_awaited_once()
        session.refresh.assert_awaited_once_with(tenant)

    @pytest.mark.asyncio
    async def test_returns_updated_response_with_tenant_data(self) -> None:
        tenant = _make_tenant(name="My Venue", slug="my-venue", status=TenantStatus.ACTIVE)
        session = _make_session(tenant)
        request = UpdateP24ConfigDTO(p24_merchantid=999, p24_api="k" * 32, p24_crc="c" * 16)

        result = await update_p24_config(MagicMock(), tenant.id, request, session)

        assert isinstance(result, UpdatedResponse)
        assert result.message == "P24 config updated successfully"
        assert result.data.id == tenant.public_id
        assert result.data.name == "My Venue"
        assert result.data.slug == "my-venue"
        assert result.data.status == TenantStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_raises_404_when_tenant_not_found(self) -> None:
        status_code = 404
        session = _make_session(tenant=None)
        tenant_id = uuid4()
        request = UpdateP24ConfigDTO(p24_merchantid=1, p24_api="k" * 32, p24_crc="c" * 16)

        with pytest.raises(HTTPException) as exc_info:
            await update_p24_config(MagicMock(), tenant_id, request, session)

        assert exc_info.value.status_code == status_code
        assert str(tenant_id) in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_overwrites_existing_p24_config(self) -> None:
        tenant = _make_tenant(p24_merchantid=111, p24_api="old-api", p24_crc="old-crc")
        session = _make_session(tenant)
        request = UpdateP24ConfigDTO(p24_merchantid=222, p24_api="n" * 32, p24_crc="m" * 16)

        await update_p24_config(MagicMock(), tenant.id, request, session)

        assert tenant.p24_merchantid == request.p24_merchantid
        assert tenant.p24_api == request.p24_api
        assert tenant.p24_crc == request.p24_crc


class TestGetP24Config:
    EXAMPLE_MERCHANT_ID = 123456
    EXAMPLE_API_KEY = "a" * 32
    EXAMPLE_CRC_KEY = "b" * 16

    @pytest.mark.asyncio
    async def test_returns_stored_p24_config(self) -> None:
        tenant = _make_tenant(
            p24_merchantid=self.EXAMPLE_MERCHANT_ID,
            p24_api=self.EXAMPLE_API_KEY,
            p24_crc=self.EXAMPLE_CRC_KEY,
        )
        session = _make_session(tenant)

        result = await get_p24_config(MagicMock(), tenant.id, session)

        assert result.p24_merchantid == self.EXAMPLE_MERCHANT_ID
        assert result.p24_api == self.EXAMPLE_API_KEY
        assert result.p24_crc == self.EXAMPLE_CRC_KEY

    @pytest.mark.asyncio
    async def test_returns_nulls_when_not_configured(self) -> None:
        tenant = _make_tenant()
        session = _make_session(tenant)

        result = await get_p24_config(MagicMock(), tenant.id, session)

        assert result.p24_merchantid is None
        assert result.p24_api is None
        assert result.p24_crc is None

    @pytest.mark.asyncio
    async def test_raises_404_when_tenant_missing(self) -> None:
        session = _make_session(tenant=None)
        tenant_id = uuid4()

        with pytest.raises(HTTPException) as exc_info:
            await get_p24_config(MagicMock(), tenant_id, session)

        assert exc_info.value.status_code == 404
        assert str(tenant_id) in exc_info.value.detail


class TestUpdateP24ConfigDTOValidation:
    MAX_MERCHANT_ID = 999_999
    EXACT_API_KEY_LENGTH = 32
    EXACT_CRC_KEY_LENGTH = 16

    EXAMPLE_MERCHANT_ID = 123456
    EXAMPLE_API_KEY = "a" * EXACT_API_KEY_LENGTH
    EXAMPLE_CRC_KEY = "b" * EXACT_CRC_KEY_LENGTH

    def test_valid_dto(self) -> None:
        dto = UpdateP24ConfigDTO(
            p24_merchantid=self.EXAMPLE_MERCHANT_ID,
            p24_api=self.EXAMPLE_API_KEY,
            p24_crc=self.EXAMPLE_CRC_KEY,
        )
        assert dto.p24_merchantid == self.EXAMPLE_MERCHANT_ID
        assert dto.p24_api == self.EXAMPLE_API_KEY
        assert dto.p24_crc == self.EXAMPLE_CRC_KEY

    def test_merchant_id_max_6_digits(self) -> None:
        with pytest.raises(ValidationError):
            UpdateP24ConfigDTO(
                p24_merchantid=1_000_000, p24_api=self.EXAMPLE_API_KEY, p24_crc=self.EXAMPLE_CRC_KEY
            )

    def test_merchant_id_cannot_be_negative(self) -> None:
        with pytest.raises(ValidationError):
            UpdateP24ConfigDTO(
                p24_merchantid=-1, p24_api=self.EXAMPLE_API_KEY, p24_crc=self.EXAMPLE_CRC_KEY
            )

    def test_api_key_longer_than_32_rejected(self) -> None:
        with pytest.raises(ValidationError):
            UpdateP24ConfigDTO(p24_merchantid=1, p24_api="a" * 33, p24_crc=self.EXAMPLE_CRC_KEY)

    def test_api_key_shorter_than_32_rejected(self) -> None:
        with pytest.raises(ValidationError):
            UpdateP24ConfigDTO(p24_merchantid=1, p24_api="a" * 31, p24_crc=self.EXAMPLE_CRC_KEY)

    def test_crc_key_longer_than_16_rejected(self) -> None:
        with pytest.raises(ValidationError):
            UpdateP24ConfigDTO(p24_merchantid=1, p24_api=self.EXAMPLE_API_KEY, p24_crc="a" * 17)

    def test_crc_key_shorter_than_16_rejected(self) -> None:
        with pytest.raises(ValidationError):
            UpdateP24ConfigDTO(p24_merchantid=1, p24_api=self.EXAMPLE_API_KEY, p24_crc="a" * 15)

    def test_boundary_values_accepted(self) -> None:
        dto = UpdateP24ConfigDTO(
            p24_merchantid=self.MAX_MERCHANT_ID,
            p24_api="a" * self.EXACT_API_KEY_LENGTH,
            p24_crc="b" * self.EXACT_CRC_KEY_LENGTH,
        )
        assert dto.p24_merchantid == self.MAX_MERCHANT_ID
        assert len(dto.p24_api) == self.EXACT_API_KEY_LENGTH
        assert len(dto.p24_crc) == self.EXACT_CRC_KEY_LENGTH

    def test_zero_merchant_id_accepted(self) -> None:
        dto = UpdateP24ConfigDTO(
            p24_merchantid=0, p24_api=self.EXAMPLE_API_KEY, p24_crc=self.EXAMPLE_CRC_KEY
        )
        assert dto.p24_merchantid == 0
