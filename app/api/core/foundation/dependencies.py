from typing import Annotated
from uuid import UUID

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.database.connection import get_mongo_db
from core.foundation.database.database import get_db_session
from core.foundation.security import SecurityService, security_service
from core.foundation.tenant_guard import resolve_and_authorize_tenant
from services.auth_service import AuthService
from services.email_service import EmailService
from services.external_client_service import ExternalClient
from services.floor_canvas_service import FloorCanvasService
from services.order_service import OrderService
from services.payment_service import P24Service
from services.table_session_service import TableSessionService, table_session_service
from services.tenant_logo_storage_service import (
    TenantLogoStorageService,
    tenant_logo_storage_service,
)
from services.tenant_menu_image_storage_service import (
    TenantMenuImageStorageService,
    tenant_menu_image_storage_service,
)
from services.tenant_mobile_config_service import (
    TenantMobileConfigService,
    tenant_mobile_config_service,
)
from services.tenant_mobile_favicon_storage_service import (
    TenantMobileFaviconStorageService,
    tenant_mobile_favicon_storage_service,
)
from services.tenant_profile_service import TenantProfileService
from services.tenant_service import TenantService
from services.user_service import UserService


def get_user_service() -> UserService:
    return UserService(security=security_service)


async def get_mongo_database() -> AsyncIOMotorDatabase:
    return get_mongo_db()


def get_security_service() -> SecurityService:
    return security_service


def get_auth_service(
    security: SecurityService = Depends(get_security_service),
) -> AuthService:
    return AuthService(security=security)


def get_email_service() -> EmailService:
    return EmailService()


def get_tenant_service() -> TenantService:
    return TenantService()


def get_floor_canvas_service() -> FloorCanvasService:
    return FloorCanvasService()


def get_p24_service() -> P24Service:
    return P24Service()


def get_tenant_profile_service() -> TenantProfileService:
    return TenantProfileService()


def get_tenant_logo_storage_service() -> TenantLogoStorageService:
    return tenant_logo_storage_service


def get_tenant_mobile_config_service() -> TenantMobileConfigService:
    return tenant_mobile_config_service


def get_tenant_mobile_favicon_storage_service() -> TenantMobileFaviconStorageService:
    return tenant_mobile_favicon_storage_service


def get_tenant_menu_image_storage_service() -> TenantMenuImageStorageService:
    return tenant_menu_image_storage_service


def get_order_service() -> OrderService:
    return OrderService()


def get_table_session_service() -> TableSessionService:
    return table_session_service


def get_external_client() -> ExternalClient:
    return ExternalClient()


SecurityServiceDep = Annotated[SecurityService, Depends(get_security_service)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
EmailServiceDep = Annotated[EmailService, Depends(get_email_service)]
TenantServiceDep = Annotated[TenantService, Depends(get_tenant_service)]
FloorCanvasServiceDep = Annotated[FloorCanvasService, Depends(get_floor_canvas_service)]
P24ServiceDep = Annotated[P24Service, Depends(get_p24_service)]
TenantLogoStorageServiceDep = Annotated[
    TenantLogoStorageService, Depends(get_tenant_logo_storage_service)
]
TenantMobileConfigServiceDep = Annotated[
    TenantMobileConfigService, Depends(get_tenant_mobile_config_service)
]
TenantMobileFaviconStorageServiceDep = Annotated[
    TenantMobileFaviconStorageService, Depends(get_tenant_mobile_favicon_storage_service)
]
TenantMenuImageStorageServiceDep = Annotated[
    TenantMenuImageStorageService, Depends(get_tenant_menu_image_storage_service)
]
TenantProfileServiceDep = Annotated[TenantProfileService, Depends(get_tenant_profile_service)]
OrderServiceDep = Annotated[OrderService, Depends(get_order_service)]
TableSessionServiceDep = Annotated[TableSessionService, Depends(get_table_session_service)]
ExternalClientDep = Annotated[ExternalClient, Depends(get_external_client)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]

MongoDB = Annotated[AsyncIOMotorDatabase, Depends(get_mongo_database)]
PostgresSession = Annotated[AsyncSession, Depends(get_db_session)]

AuthorizedTenantId = Annotated[UUID, Depends(resolve_and_authorize_tenant)]
