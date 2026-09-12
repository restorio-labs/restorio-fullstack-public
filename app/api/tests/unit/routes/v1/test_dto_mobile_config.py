from pydantic import ValidationError
import pytest

from core.dto.v1.tenants.mobile_config import (
    CopyMobileThemeFromDTO,
    MenuImageFinalizeRequestDTO,
    MenuImageFinalizeResponseDTO,
    MenuImagePresignRequestDTO,
    MenuImagePresignResponseDTO,
    MobileLandingContentDTO,
    TenantMobileConfigResponseDTO,
    TenantMobileFaviconFinalizeRequestDTO,
    TenantMobileFaviconPresignRequestDTO,
    TenantMobileFaviconPresignResponseDTO,
    UpdateTenantMobileConfigDTO,
)


class TestMobileLandingContentDTO:
    def test_valid_content(self) -> None:
        dto = MobileLandingContentDTO(
            headline="Welcome",
            subtitle="Best restaurant in town",
            tablesCtaLabel="View Tables",
            menuCtaLabel="See Menu",
            openStatusLabel="Open",
            closedStatusLabel="Closed",
            uiLocale="en",
        )
        assert dto.headline == "Welcome"
        assert dto.subtitle == "Best restaurant in town"
        assert dto.tables_cta_label == "View Tables"
        assert dto.menu_cta_label == "See Menu"
        assert dto.open_status_label == "Open"
        assert dto.closed_status_label == "Closed"
        assert dto.ui_locale == "en"

    def test_ui_locale_none(self) -> None:
        dto = MobileLandingContentDTO(uiLocale=None)
        assert dto.ui_locale is None

    def test_ui_locale_empty_string_becomes_none(self) -> None:
        dto = MobileLandingContentDTO(uiLocale="")
        assert dto.ui_locale is None

    def test_ui_locale_whitespace_becomes_none(self) -> None:
        dto = MobileLandingContentDTO(uiLocale="   ")
        assert dto.ui_locale is None

    def test_ui_locale_valid_pl(self) -> None:
        dto = MobileLandingContentDTO(uiLocale="PL")
        assert dto.ui_locale == "pl"

    def test_ui_locale_invalid_raises(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            MobileLandingContentDTO(uiLocale="de")
        errors = exc_info.value.errors()
        assert any("uiLocale" in str(err) or "ui_locale" in str(err) for err in errors)

    def test_all_fields_none(self) -> None:
        dto = MobileLandingContentDTO()
        assert dto.headline is None
        assert dto.subtitle is None
        assert dto.tables_cta_label is None
        assert dto.menu_cta_label is None
        assert dto.open_status_label is None
        assert dto.closed_status_label is None
        assert dto.ui_locale is None


class TestTenantMobileConfigResponseDTO:
    def test_valid_response(self) -> None:
        dto = TenantMobileConfigResponseDTO(
            pageTitle="My Restaurant",
            themeOverride={"primaryColor": "#ff0000"},
            landingContent=MobileLandingContentDTO(headline="Welcome"),
            hasFavicon=True,
        )
        assert dto.page_title == "My Restaurant"
        assert dto.theme_override == {"primaryColor": "#ff0000"}
        assert dto.landing_content is not None
        assert dto.landing_content.headline == "Welcome"
        assert dto.has_favicon is True

    def test_defaults(self) -> None:
        dto = TenantMobileConfigResponseDTO()
        assert dto.page_title is None
        assert dto.theme_override is None
        assert dto.landing_content is None
        assert dto.has_favicon is False


class TestUpdateTenantMobileConfigDTO:
    def test_valid_update(self) -> None:
        dto = UpdateTenantMobileConfigDTO(
            pageTitle="Updated Title",
            themeOverride={"color": "blue"},
            landingContent={"headline": "New Headline"},
        )
        assert dto.page_title == "Updated Title"
        assert dto.theme_override == {"color": "blue"}
        assert dto.landing_content is not None

    def test_theme_override_none(self) -> None:
        dto = UpdateTenantMobileConfigDTO(themeOverride=None)
        assert dto.theme_override is None

    def test_theme_override_too_large_raises(self) -> None:
        large_theme = {"data": "x" * 150000}
        with pytest.raises(ValidationError) as exc_info:
            UpdateTenantMobileConfigDTO(themeOverride=large_theme)
        errors = exc_info.value.errors()
        assert any("theme" in str(err).lower() for err in errors)

    def test_landing_content_none(self) -> None:
        dto = UpdateTenantMobileConfigDTO(landingContent=None)
        assert dto.landing_content is None

    def test_landing_content_as_dto(self) -> None:
        landing = MobileLandingContentDTO(headline="Test")
        dto = UpdateTenantMobileConfigDTO(landingContent=landing)
        assert dto.landing_content is not None
        assert dto.landing_content.headline == "Test"

    def test_landing_content_too_large_raises(self) -> None:
        large_landing = {"headline": "x" * 10000}
        with pytest.raises(ValidationError) as exc_info:
            UpdateTenantMobileConfigDTO(landingContent=large_landing)
        errors = exc_info.value.errors()
        assert any("landing" in str(err).lower() for err in errors)


class TestTenantMobileFaviconPresignRequestDTO:
    def test_valid_request(self) -> None:
        dto = TenantMobileFaviconPresignRequestDTO(contentType="image/png")
        assert dto.content_type == "image/png"


class TestTenantMobileFaviconPresignResponseDTO:
    def test_valid_response(self) -> None:
        dto = TenantMobileFaviconPresignResponseDTO(
            uploadUrl="https://s3.example.com/upload",
            objectKey="favicons/abc123.png",
        )
        assert dto.upload_url == "https://s3.example.com/upload"
        assert dto.object_key == "favicons/abc123.png"


class TestTenantMobileFaviconFinalizeRequestDTO:
    def test_valid_request(self) -> None:
        dto = TenantMobileFaviconFinalizeRequestDTO(objectKey="favicons/abc123.png")
        assert dto.object_key == "favicons/abc123.png"


class TestCopyMobileThemeFromDTO:
    def test_valid_request(self) -> None:
        dto = CopyMobileThemeFromDTO(sourceTenantPublicId="tenant-123")
        assert dto.source_tenant_public_id == "tenant-123"

    def test_empty_source_rejected(self) -> None:
        with pytest.raises(ValidationError):
            CopyMobileThemeFromDTO(sourceTenantPublicId="")


class TestMenuImagePresignRequestDTO:
    def test_valid_request(self) -> None:
        dto = MenuImagePresignRequestDTO(contentType="image/jpeg")
        assert dto.content_type == "image/jpeg"


class TestMenuImagePresignResponseDTO:
    def test_valid_response(self) -> None:
        dto = MenuImagePresignResponseDTO(
            uploadUrl="https://s3.example.com/upload",
            objectKey="menu-images/abc123.jpg",
        )
        assert dto.upload_url == "https://s3.example.com/upload"
        assert dto.object_key == "menu-images/abc123.jpg"


class TestMenuImageFinalizeRequestDTO:
    def test_valid_request(self) -> None:
        dto = MenuImageFinalizeRequestDTO(objectKey="menu-images/abc123.jpg")
        assert dto.object_key == "menu-images/abc123.jpg"


class TestMenuImageFinalizeResponseDTO:
    def test_valid_response(self) -> None:
        dto = MenuImageFinalizeResponseDTO(imageUrl="https://cdn.example.com/image.jpg")
        assert dto.image_url == "https://cdn.example.com/image.jpg"
