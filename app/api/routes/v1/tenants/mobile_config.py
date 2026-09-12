from fastapi import APIRouter, Request, status

from core.dto.v1.tenants.mobile_config import (
    CopyMobileThemeFromDTO,
    TenantMobileConfigResponseDTO,
    TenantMobileFaviconFinalizeRequestDTO,
    TenantMobileFaviconPresignRequestDTO,
    TenantMobileFaviconPresignResponseDTO,
    UpdateTenantMobileConfigDTO,
)
from core.exceptions import BadRequestError
from core.foundation.dependencies import (
    AuthorizedTenantId,
    PostgresSession,
    TenantMobileConfigServiceDep,
    TenantMobileFaviconStorageServiceDep,
)
from core.foundation.http.responses import SuccessResponse, UpdatedResponse
from core.foundation.role_guard import RequireOwnerOrManager
from core.foundation.tenant_guard import get_authorized_tenant_uuid
from routes.v1.mappers.tenant_mobile_config_mappers import tenant_mobile_config_to_response

router = APIRouter()


@router.get(
    "/{tenant_public_id}/mobile-config",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantMobileConfigResponseDTO],
)
async def get_tenant_mobile_config(
    _role: RequireOwnerOrManager,
    tenant_id: AuthorizedTenantId,
    session: PostgresSession,
    service: TenantMobileConfigServiceDep,
) -> SuccessResponse[TenantMobileConfigResponseDTO]:
    row = await service.get_by_tenant_id(session, tenant_id)

    return SuccessResponse(
        message="Mobile configuration retrieved",
        data=tenant_mobile_config_to_response(row),
    )


@router.put(
    "/{tenant_public_id}/mobile-config",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[TenantMobileConfigResponseDTO],
)
async def update_tenant_mobile_config(
    _role: RequireOwnerOrManager,
    tenant_id: AuthorizedTenantId,
    body: UpdateTenantMobileConfigDTO,
    session: PostgresSession,
    service: TenantMobileConfigServiceDep,
) -> UpdatedResponse[TenantMobileConfigResponseDTO]:
    kwargs: dict[str, object] = {}
    if "page_title" in body.model_fields_set:
        kwargs["page_title"] = body.page_title
    if "theme_override" in body.model_fields_set:
        kwargs["theme_override"] = body.theme_override
    if "landing_content" in body.model_fields_set:
        kwargs["landing_content"] = (
            body.landing_content.model_dump(by_alias=True, exclude_none=True)
            if body.landing_content is not None
            else None
        )

    if not kwargs:
        row = await service.get_by_tenant_id(session, tenant_id)
        if row is None:
            row = await service.upsert(session, tenant_id)
    else:
        row = await service.upsert(session, tenant_id, **kwargs)
    await session.commit()

    return UpdatedResponse(
        message="Mobile configuration updated",
        data=tenant_mobile_config_to_response(row),
    )


@router.post(
    "/{tenant_public_id}/mobile-config/favicon/presign",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantMobileFaviconPresignResponseDTO],
)
async def presign_tenant_mobile_favicon(
    _role: RequireOwnerOrManager,
    tenant_id: AuthorizedTenantId,
    body: TenantMobileFaviconPresignRequestDTO,
    storage: TenantMobileFaviconStorageServiceDep,
) -> SuccessResponse[TenantMobileFaviconPresignResponseDTO]:
    upload_url, object_key = storage.create_presigned_upload(tenant_id, body.content_type)

    return SuccessResponse(
        message="Favicon upload URL created",
        data=TenantMobileFaviconPresignResponseDTO(uploadUrl=upload_url, objectKey=object_key),
    )


@router.post(
    "/{tenant_public_id}/mobile-config/favicon/finalize",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[TenantMobileConfigResponseDTO],
)
async def finalize_tenant_mobile_favicon(
    _role: RequireOwnerOrManager,
    tenant_id: AuthorizedTenantId,
    body: TenantMobileFaviconFinalizeRequestDTO,
    session: PostgresSession,
    storage: TenantMobileFaviconStorageServiceDep,
    service: TenantMobileConfigServiceDep,
) -> UpdatedResponse[TenantMobileConfigResponseDTO]:
    object_key = storage.finalize_upload(tenant_id, body.object_key)
    row = await service.set_favicon_key(session, tenant_id, object_key)
    await session.commit()

    return UpdatedResponse(
        message="Favicon saved",
        data=tenant_mobile_config_to_response(row),
    )


@router.post(
    "/{tenant_public_id}/mobile-config/theme/copy-from",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[TenantMobileConfigResponseDTO],
)
async def copy_mobile_theme_from_tenant(
    _role: RequireOwnerOrManager,
    tenant_id: AuthorizedTenantId,
    body: CopyMobileThemeFromDTO,
    request: Request,
    session: PostgresSession,
    service: TenantMobileConfigServiceDep,
) -> UpdatedResponse[TenantMobileConfigResponseDTO]:
    source_uuid = await get_authorized_tenant_uuid(session, request, body.source_tenant_public_id)

    if source_uuid == tenant_id:
        raise BadRequestError(message="Source tenant must differ from target")

    row = await service.copy_theme_override_from(session, tenant_id, source_uuid)
    await session.commit()

    return UpdatedResponse(
        message="Theme copied",
        data=tenant_mobile_config_to_response(row),
    )
