from datetime import datetime

from pydantic import Field

from core.dto.v1.common import BaseDTO, EntityId


class TenantProfileResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Unique profile identifier")
    tenant_id: EntityId = Field(
        ..., alias="tenantId", serialization_alias="tenantId", description="Tenant identifier"
    )

    nip: str = Field(..., description="Polish tax identification number (NIP)")
    company_name: str = Field(
        ...,
        alias="companyName",
        serialization_alias="companyName",
        description="Official registered company name",
    )
    logo: str | None = Field(
        None, alias="logo", serialization_alias="logo", description="URL to uploaded logo"
    )

    contact_email: str = Field(
        ...,
        alias="contactEmail",
        serialization_alias="contactEmail",
        description="Restaurant contact email",
    )
    phone: str = Field(..., description="Restaurant telephone number")

    address_street_name: str = Field(
        ...,
        alias="addressStreetName",
        serialization_alias="addressStreetName",
        description="Street name",
    )
    address_street_number: str = Field(
        ...,
        alias="addressStreetNumber",
        serialization_alias="addressStreetNumber",
        description="Street/building number",
    )
    address_city: str = Field(
        ..., alias="addressCity", serialization_alias="addressCity", description="City"
    )
    address_postal_code: str = Field(
        ...,
        alias="addressPostalCode",
        serialization_alias="addressPostalCode",
        description="Polish postal code",
    )
    address_country: str = Field(
        ..., alias="addressCountry", serialization_alias="addressCountry", description="Country"
    )

    owner_first_name: str = Field(
        ...,
        alias="ownerFirstName",
        serialization_alias="ownerFirstName",
        description="Owner first name",
    )
    owner_last_name: str = Field(
        ...,
        alias="ownerLastName",
        serialization_alias="ownerLastName",
        description="Owner last name",
    )
    owner_email: str | None = Field(
        None, alias="ownerEmail", serialization_alias="ownerEmail", description="Owner email"
    )
    owner_phone: str | None = Field(
        None, alias="ownerPhone", serialization_alias="ownerPhone", description="Owner phone number"
    )

    contact_person_first_name: str | None = Field(
        None,
        alias="contactPersonFirstName",
        serialization_alias="contactPersonFirstName",
        description="Contact person first name",
    )
    contact_person_last_name: str | None = Field(
        None,
        alias="contactPersonLastName",
        serialization_alias="contactPersonLastName",
        description="Contact person last name",
    )
    contact_person_email: str | None = Field(
        None,
        alias="contactPersonEmail",
        serialization_alias="contactPersonEmail",
        description="Contact person email",
    )
    contact_person_phone: str | None = Field(
        None,
        alias="contactPersonPhone",
        serialization_alias="contactPersonPhone",
        description="Contact person phone number",
    )

    social_facebook: str | None = Field(
        None,
        alias="socialFacebook",
        serialization_alias="socialFacebook",
        description="Facebook page URL",
    )
    social_instagram: str | None = Field(
        None,
        alias="socialInstagram",
        serialization_alias="socialInstagram",
        description="Instagram profile URL",
    )
    social_tiktok: str | None = Field(
        None,
        alias="socialTiktok",
        serialization_alias="socialTiktok",
        description="TikTok profile URL",
    )
    social_website: str | None = Field(
        None,
        alias="socialWebsite",
        serialization_alias="socialWebsite",
        description="Restaurant website URL",
    )

    created_at: datetime = Field(
        ...,
        alias="createdAt",
        serialization_alias="createdAt",
        description="Profile creation timestamp",
    )
    updated_at: datetime = Field(
        ...,
        alias="updatedAt",
        serialization_alias="updatedAt",
        description="Last profile update timestamp",
    )


class TenantLogoUploadResponseDTO(BaseDTO):
    upload_url: str = Field(
        ...,
        alias="uploadUrl",
        serialization_alias="uploadUrl",
        description="Presigned URL for uploading a tenant logo directly to object storage",
    )
    object_key: str = Field(
        ...,
        alias="objectKey",
        serialization_alias="objectKey",
        description="Temporary object key that must be sent back on profile save",
    )


class TenantLogoViewPresignResponseDTO(BaseDTO):
    url: str = Field(
        ...,
        alias="url",
        serialization_alias="url",
        description="Presigned URL for viewing a tenant logo from object storage",
    )
