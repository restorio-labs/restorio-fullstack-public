from typing import Any

from pydantic import Field, field_validator

from core.dto.v1.common import BaseDTO


class MobileLandingContentDTO(BaseDTO):
    headline: str | None = Field(None, max_length=500)
    subtitle: str | None = Field(None, max_length=2000)
    tables_cta_label: str | None = Field(None, max_length=120, alias="tablesCtaLabel")
    menu_cta_label: str | None = Field(None, max_length=120, alias="menuCtaLabel")
    open_status_label: str | None = Field(None, max_length=80, alias="openStatusLabel")
    closed_status_label: str | None = Field(None, max_length=80, alias="closedStatusLabel")
    ui_locale: str | None = Field(None, max_length=5, alias="uiLocale")

    @field_validator("ui_locale", mode="before")
    @classmethod
    def normalize_ui_locale(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = str(v).strip().lower()
        if s == "":
            return None
        allowed = ("en", "pl")
        if s not in allowed:
            msg = "uiLocale must be one of: en, pl"
            raise ValueError(msg)
        return s


class TenantMobileConfigResponseDTO(BaseDTO):
    page_title: str | None = Field(None, alias="pageTitle")
    theme_override: dict[str, Any] | None = Field(None, alias="themeOverride")
    landing_content: MobileLandingContentDTO | None = Field(None, alias="landingContent")
    has_favicon: bool = Field(False, alias="hasFavicon")


_MAX_THEME_OVERRIDE_SIZE = 131072
_MAX_LANDING_JSON = 8192


class UpdateTenantMobileConfigDTO(BaseDTO):
    page_title: str | None = Field(None, max_length=255, alias="pageTitle")
    theme_override: dict[str, Any] | None = Field(None, alias="themeOverride")
    landing_content: MobileLandingContentDTO | None = Field(None, alias="landingContent")

    @field_validator("theme_override")
    @classmethod
    def validate_theme_size(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        if v is None:
            return v
        raw = str(v)
        if len(raw) > _MAX_THEME_OVERRIDE_SIZE:
            msg = "Theme override is too large"
            raise ValueError(msg)
        return v

    @field_validator("landing_content", mode="before")
    @classmethod
    def validate_landing_json_size(cls, v: MobileLandingContentDTO | dict[str, Any] | None) -> Any:
        if v is None or isinstance(v, MobileLandingContentDTO):
            return v
        if isinstance(v, dict):
            raw = str(v)
            if len(raw) > _MAX_LANDING_JSON:
                msg = "Landing content is too large"
                raise ValueError(msg)
        return v


class TenantMobileFaviconPresignRequestDTO(BaseDTO):
    content_type: str = Field(..., alias="contentType")


class TenantMobileFaviconPresignResponseDTO(BaseDTO):
    upload_url: str = Field(..., alias="uploadUrl")
    object_key: str = Field(..., alias="objectKey")


class TenantMobileFaviconFinalizeRequestDTO(BaseDTO):
    object_key: str = Field(..., alias="objectKey")


class CopyMobileThemeFromDTO(BaseDTO):
    source_tenant_public_id: str = Field(..., min_length=1, alias="sourceTenantPublicId")


class MenuImagePresignRequestDTO(BaseDTO):
    content_type: str = Field(..., alias="contentType")


class MenuImagePresignResponseDTO(BaseDTO):
    upload_url: str = Field(..., alias="uploadUrl")
    object_key: str = Field(..., alias="objectKey")


class MenuImageFinalizeRequestDTO(BaseDTO):
    object_key: str = Field(..., alias="objectKey")


class MenuImageFinalizeResponseDTO(BaseDTO):
    image_url: str = Field(..., alias="imageUrl")
