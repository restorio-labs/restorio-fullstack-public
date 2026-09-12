from fastapi import APIRouter, status

from core.dto.v1 import (
    CreateTenantProfileDTO,
    TenantLogoUploadPresignRequestDTO,
    TenantLogoUploadResponseDTO,
    TenantLogoViewPresignResponseDTO,
    TenantProfileResponseDTO,
)
from core.foundation.dependencies import (
    AuthorizedTenantId,
    PostgresSession,
    TenantLogoStorageServiceDep,
    TenantProfileServiceDep,
)
from core.foundation.http.responses import (
    CreatedResponse,
    SuccessResponse,
    UpdatedResponse,
)
from core.foundation.role_guard import RequireOwnerOrManager
from routes.v1.mappers.tenant_profile_mappers import tenant_profile_to_response

router = APIRouter()


@router.post(
    "/{tenant_public_id}/profile/logo/presign",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantLogoUploadResponseDTO],
    summary="Create presigned tenant logo upload URL",
    description="Create a presigned MinIO upload URL for a tenant logo",
    response_description="Presigned tenant logo upload URL created successfully",
)
async def create_tenant_logo_upload(
    _role: RequireOwnerOrManager,
    tenant_id: AuthorizedTenantId,
    storage: TenantLogoStorageServiceDep,
    request: TenantLogoUploadPresignRequestDTO,
) -> SuccessResponse[TenantLogoUploadResponseDTO]:
    upload_url, object_key = storage.create_presigned_upload(tenant_id, request.content_type)
    return SuccessResponse(
        message="Tenant logo upload URL created successfully",
        data=TenantLogoUploadResponseDTO(uploadUrl=upload_url, objectKey=object_key),
    )


@router.get(
    "/{tenant_public_id}/profile/logo/presign",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantLogoViewPresignResponseDTO],
    summary="Create presigned tenant logo view URL",
    description="Create a presigned MinIO URL for viewing a tenant logo",
    response_description="Presigned tenant logo view URL created successfully",
)
async def create_tenant_logo_view(
    tenant_id: AuthorizedTenantId,
    storage: TenantLogoStorageServiceDep,
) -> SuccessResponse[TenantLogoViewPresignResponseDTO]:
    view_url = storage.create_presigned_view(tenant_id)
    return SuccessResponse(
        message="Tenant logo view URL created successfully",
        data=TenantLogoViewPresignResponseDTO(url=view_url),
    )


@router.get(
    "/{tenant_public_id}/profile",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantProfileResponseDTO | None],
    summary="Get tenant profile by tenant ID",
    description="Get tenant profile by tenant ID",
    response_description="Tenant profile retrieved successfully",
)
async def get_tenant_profile(
    tenant_id: AuthorizedTenantId,
    session: PostgresSession,
    service: TenantProfileServiceDep,
) -> SuccessResponse[TenantProfileResponseDTO | None]:
    profile = await service.get_by_tenant(session, tenant_id)
    if not profile:
        return SuccessResponse(
            message="Tenant profile not yet created",
            data=None,
        )
    return SuccessResponse(
        message="Tenant profile retrieved successfully",
        data=tenant_profile_to_response(profile),
    )


@router.put(
    "/{tenant_public_id}/profile",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[TenantProfileResponseDTO]
    | CreatedResponse[TenantProfileResponseDTO],
    summary="Create or update tenant profile",
    description="Create or update tenant profile for a tenant (upsert)",
    response_description="Tenant profile saved successfully",
)
async def upsert_tenant_profile(
    _role: RequireOwnerOrManager,
    tenant_id: AuthorizedTenantId,
    request: CreateTenantProfileDTO,
    session: PostgresSession,
    storage: TenantLogoStorageServiceDep,
    service: TenantProfileServiceDep,
) -> UpdatedResponse[TenantProfileResponseDTO] | CreatedResponse[TenantProfileResponseDTO]:
    if request.logo_upload_key:
        finalized_logo = storage.finalize_upload(tenant_id, request.logo_upload_key)
        request.logo = finalized_logo.url

    profile, created = await service.upsert(session, tenant_id, request)
    response_data = tenant_profile_to_response(profile)

    if created:
        return CreatedResponse(
            message="Tenant profile created successfully",
            data=response_data,
        )

    return UpdatedResponse(
        message="Tenant profile updated successfully",
        data=response_data,
    )
