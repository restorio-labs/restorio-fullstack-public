from pydantic import ValidationError
import pytest

from core.dto.v1.common import InvoiceDataDTO, validate_nip


class TestValidateNip:
    """Test NIP validation function."""

    def test_valid_nip_plain(self) -> None:
        """Valid NIP without separators."""
        result = validate_nip("1234563218")
        assert result == "1234563218"

    def test_valid_nip_with_dashes(self) -> None:
        """Valid NIP with dashes."""
        result = validate_nip("123-456-32-18")
        assert result == "1234563218"

    def test_valid_nip_with_spaces(self) -> None:
        """Valid NIP with spaces."""
        result = validate_nip("123 456 32 18")
        assert result == "1234563218"

    def test_invalid_nip_wrong_length(self) -> None:
        """NIP with wrong length should fail."""
        with pytest.raises(ValueError, match="10 digits"):
            validate_nip("123456789")

    def test_invalid_nip_too_long(self) -> None:
        """NIP with too many digits should fail."""
        with pytest.raises(ValueError, match="10 digits"):
            validate_nip("12345678901")

    def test_invalid_nip_non_numeric(self) -> None:
        """NIP with non-numeric characters should fail."""
        with pytest.raises(ValueError, match="10 digits"):
            validate_nip("123456789A")

    def test_invalid_nip_checksum(self) -> None:
        """NIP with invalid checksum should fail."""
        with pytest.raises(ValueError, match="checksum"):
            validate_nip("1234567891")

    def test_known_valid_nips(self) -> None:
        """Test with known valid Polish NIP numbers."""
        valid_nips = [
            "1234563218",
            "5260250995",
            "7792348141",
        ]
        for nip in valid_nips:
            result = validate_nip(nip)
            assert result == nip


class TestInvoiceDataDTO:
    """Test InvoiceDataDTO validation."""

    def test_valid_invoice_data(self) -> None:
        """Valid invoice data should pass."""
        data = InvoiceDataDTO(
            companyName="Test Company Sp. z o.o.",
            nip="1234563218",
            street="ul. Testowa 123/4",
            city="Warszawa",
            postalCode="00-001",
            country="PL",
        )
        assert data.company_name == "Test Company Sp. z o.o."
        assert data.nip == "1234563218"
        assert data.street == "ul. Testowa 123/4"
        assert data.city == "Warszawa"
        assert data.postal_code == "00-001"
        assert data.country == "PL"

    def test_valid_invoice_data_camel_case(self) -> None:
        """Valid invoice data with camelCase aliases should pass."""
        data = InvoiceDataDTO.model_validate(
            {
                "companyName": "Test Company",
                "nip": "1234563218",
                "street": "ul. Testowa 1",
                "city": "Kraków",
                "postalCode": "30-001",
            }
        )
        assert data.company_name == "Test Company"
        assert data.postal_code == "30-001"

    def test_postal_code_without_dash(self) -> None:
        """Postal code without dash should be normalized."""
        data = InvoiceDataDTO(
            companyName="Test",
            nip="1234563218",
            street="Test 1",
            city="Test",
            postalCode="00001",
        )
        assert data.postal_code == "00-001"

    def test_invalid_nip_rejected(self) -> None:
        """Invalid NIP should be rejected."""
        with pytest.raises(ValidationError) as exc_info:
            InvoiceDataDTO(
                companyName="Test",
                nip="1234567891",
                street="Test 1",
                city="Test",
                postalCode="00-001",
            )
        errors = exc_info.value.errors()
        assert any("nip" in str(err).lower() for err in errors)

    def test_invalid_postal_code_rejected(self) -> None:
        """Invalid postal code should be rejected."""
        with pytest.raises(ValidationError) as exc_info:
            InvoiceDataDTO(
                companyName="Test",
                nip="1234563218",
                street="Test 1",
                city="Test",
                postalCode="123456",
            )
        errors = exc_info.value.errors()
        assert any("postal" in str(err).lower() for err in errors)

    def test_empty_company_name_rejected(self) -> None:
        """Empty company name should be rejected."""
        with pytest.raises(ValidationError):
            InvoiceDataDTO(
                companyName="",
                nip="1234563218",
                street="Test 1",
                city="Test",
                postalCode="00-001",
            )

    def test_default_country(self) -> None:
        """Country should default to PL."""
        data = InvoiceDataDTO(
            companyName="Test",
            nip="1234563218",
            street="Test 1",
            city="Test",
            postalCode="00-001",
        )
        assert data.country == "PL"
