from datetime import timedelta
from uuid import UUID

from fastapi import APIRouter, Request, Response, status
from sqlalchemy import select

from core.dto.v1 import (
    CreateTenantDTO,
    TenantResponseDTO,
    TenantSummaryResponseDTO,
    UpdateTenantDTO,
)
from core.foundation.auth_cookies import set_auth_cookies
from core.foundation.dependencies import (
    AuthorizedTenantId,
    PostgresSession,
    SecurityServiceDep,
    TenantServiceDep,
)
from core.foundation.http.responses import (
    CreatedResponse,
    DeletedResponse,
    SuccessResponse,
    UnauthenticatedResponse,
    UpdatedResponse,
)
from core.foundation.infra.config import settings
from core.foundation.role_guard import RequireOwner, RequireOwnerOrNoRole
from core.foundation.token_store import generate_family, generate_jti
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from routes.v1.mappers.tenant_mappers import (
    tenant_to_response,
    tenant_to_summary,
)

router = APIRouter()


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[TenantSummaryResponseDTO]],
)
async def list_tenants(
    request: Request,
    session: PostgresSession,
    service: TenantServiceDep,
) -> SuccessResponse[list[TenantSummaryResponseDTO]]:
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthenticatedResponse(message="Unauthorized")

    subject = user.get("sub")
    if not isinstance(subject, str):
        raise UnauthenticatedResponse(message="Unauthorized")

    user_id = UUID(subject)
    tenants = await service.list_tenants(session, user_id)
    return SuccessResponse(
        message="Tenants retrieved successfully",
        data=[tenant_to_summary(t) for t in tenants],
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[TenantResponseDTO],
)
async def create_tenant(
    _role: RequireOwnerOrNoRole,
    request: Request,
    response: Response,
    body: CreateTenantDTO,
    session: PostgresSession,
    service: TenantServiceDep,
    security_service: SecurityServiceDep,
) -> CreatedResponse[TenantResponseDTO]:
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthenticatedResponse(message="Unauthorized")

    subject = user.get("sub")
    if not isinstance(subject, str):
        raise UnauthenticatedResponse(message="Unauthorized")

    user_id = UUID(subject)
    data = CreateTenantDTO(
        name=body.name,
        slug=body.slug,
        status=body.status,
    )
    tenant = await service.create_tenant(session, data, user_id)

    tenant_role_ids = list(
        await session.scalars(select(TenantRole.tenant_id).where(TenantRole.account_id == user_id))
    )
    tenant_ids: list[str] = []
    if tenant_role_ids:
        rows = await session.execute(select(Tenant.public_id).where(Tenant.id.in_(tenant_role_ids)))
        tenant_ids = [row[0] for row in rows.all()]

    role = await session.scalar(select(TenantRole).where(TenantRole.account_id == user_id).limit(1))
    email = user.get("email")
    token_data: dict[str, str | list[str] | None] = {
        "sub": str(user_id),
        "tenant_ids": tenant_ids,
        "account_type": role.account_type.value if role is not None else None,
        "email": email if isinstance(email, str) else None,
    }
    access_token = security_service.create_access_token(token_data)
    refresh_token = security_service.create_access_token(
        {
            **token_data,
            "type": "refresh",
            "jti": generate_jti(),
            "family": generate_family(),
        },
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    set_auth_cookies(
        response=response,
        request=request,
        access_token=access_token,
        refresh_token=refresh_token,
    )

    return CreatedResponse(
        message="Tenant created successfully",
        data=tenant_to_response(tenant),
    )


@router.get(
    "/{tenant_public_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantResponseDTO],
    summary="Get a tenant by ID",
    description="Get a tenant by ID",
    response_description="Tenant retrieved successfully",
)
async def get_tenant(
    tenant_id: AuthorizedTenantId,
    session: PostgresSession,
    service: TenantServiceDep,
) -> SuccessResponse[TenantResponseDTO]:
    tenant = await service.get_tenant(session, tenant_id)
    return SuccessResponse(
        message="Tenant retrieved successfully",
        data=tenant_to_response(tenant),
    )


@router.put(
    "/{tenant_public_id}",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[TenantResponseDTO],
    summary="Update a tenant",
    description="Update a tenant",
    response_description="Tenant updated successfully",
)
async def update_tenant(
    _role: RequireOwner,
    tenant_id: AuthorizedTenantId,
    request: UpdateTenantDTO,
    session: PostgresSession,
    service: TenantServiceDep,
) -> UpdatedResponse[TenantResponseDTO]:
    data = UpdateTenantDTO(
        name=request.name,
        slug=request.slug,
        status=request.status,
        active_layout_version_id=request.active_layout_version_id,
    )
    tenant = await service.update_tenant(session, tenant_id, data)
    return UpdatedResponse(
        message="Tenant updated successfully",
        data=tenant_to_response(tenant),
    )


@router.delete(
    "/{tenant_public_id}",
    status_code=status.HTTP_200_OK,
    response_model=DeletedResponse,
    summary="Delete a tenant",
    description="Delete a tenant",
    response_description="Tenant deleted successfully",
)
async def delete_tenant(
    _role: RequireOwner,
    tenant_id: AuthorizedTenantId,
    session: PostgresSession,
    service: TenantServiceDep,
) -> DeletedResponse:
    await service.delete_tenant(session, tenant_id)
    return DeletedResponse(message="Tenant deleted successfully")
