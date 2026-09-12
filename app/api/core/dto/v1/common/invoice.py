import re

from pydantic import Field, field_validator

from core.dto.v1.common.base import BaseDTO

_NIP_WEIGHTS = (6, 5, 7, 2, 3, 4, 5, 6, 7)
_NIP_REMAINDER_MAPS_TO_CHECK_DIGIT_ZERO = 10


def validate_nip(nip: str) -> str:
    """Validate Polish NIP (tax identification number).

    NIP is a 10-digit number with a checksum digit at position 10.
    """
    digits_only = re.sub(r"[\s\-]", "", nip)

    if not re.match(r"^\d{10}$", digits_only):
        msg = "NIP must be exactly 10 digits"
        raise ValueError(msg)

    digits = [int(d) for d in digits_only]
    checksum = sum(d * w for d, w in zip(digits[:9], _NIP_WEIGHTS, strict=True)) % 11

    if checksum == _NIP_REMAINDER_MAPS_TO_CHECK_DIGIT_ZERO:
        checksum = 0

    if digits[9] != checksum:
        msg = "Invalid NIP checksum"
        raise ValueError(msg)

    return digits_only


class InvoiceDataDTO(BaseDTO):
    company_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        alias="companyName",
        description="Company or business name",
    )
    nip: str = Field(
        ...,
        min_length=10,
        max_length=13,
        description="Polish tax identification number (NIP)",
    )
    street: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Street address with building/apartment number",
    )
    city: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="City name",
    )
    postal_code: str = Field(
        ...,
        min_length=1,
        max_length=10,
        alias="postalCode",
        description="Postal code (e.g. 00-000)",
    )
    country: str = Field(
        default="PL",
        min_length=2,
        max_length=2,
        description="ISO 3166-1 alpha-2 country code",
    )

    @field_validator("nip")
    @classmethod
    def validate_nip_format(cls, v: str) -> str:
        return validate_nip(v)

    @field_validator("postal_code")
    @classmethod
    def validate_postal_code(cls, v: str) -> str:
        cleaned = v.strip()
        if not re.match(r"^\d{2}-?\d{3}$", cleaned):
            msg = "Polish postal code must be in format XX-XXX or XXXXX"
            raise ValueError(msg)
        if "-" not in cleaned:
            cleaned = f"{cleaned[:2]}-{cleaned[2:]}"
        return cleaned
