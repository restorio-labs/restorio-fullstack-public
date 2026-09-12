from core.dto.v1.tenants.mobile_config import MobileLandingContentDTO, TenantMobileConfigResponseDTO
from core.models.tenant_mobile_config import TenantMobileConfig


def tenant_mobile_config_to_response(
    row: TenantMobileConfig | None,
) -> TenantMobileConfigResponseDTO:
    if row is None:
        return TenantMobileConfigResponseDTO(
            pageTitle=None,
            themeOverride=None,
            landingContent=None,
            hasFavicon=False,
        )

    landing = (
        MobileLandingContentDTO.model_validate(row.landing_content)
        if row.landing_content and isinstance(row.landing_content, dict)
        else None
    )

    return TenantMobileConfigResponseDTO(
        pageTitle=row.page_title,
        themeOverride=row.theme_override,
        landingContent=landing,
        hasFavicon=bool(row.favicon_object_key),
    )
