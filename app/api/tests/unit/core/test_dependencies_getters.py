from core.foundation.dependencies import (
    get_external_client,
    get_floor_canvas_service,
    get_order_service,
    get_p24_service,
    get_table_session_service,
    get_tenant_logo_storage_service,
    get_tenant_menu_image_storage_service,
    get_tenant_mobile_config_service,
    get_tenant_mobile_favicon_storage_service,
    get_tenant_profile_service,
    get_user_service,
)
from services.external_client_service import ExternalClient
from services.floor_canvas_service import FloorCanvasService
from services.order_service import OrderService
from services.payment_service import P24Service
from services.table_session_service import TableSessionService
from services.tenant_logo_storage_service import TenantLogoStorageService
from services.tenant_menu_image_storage_service import TenantMenuImageStorageService
from services.tenant_mobile_config_service import TenantMobileConfigService
from services.tenant_mobile_favicon_storage_service import TenantMobileFaviconStorageService
from services.tenant_profile_service import TenantProfileService
from services.user_service import UserService


def test_get_user_service_returns_instance() -> None:
    svc = get_user_service()
    assert isinstance(svc, UserService)


def test_get_tenant_logo_storage_service_returns_singleton() -> None:
    assert get_tenant_logo_storage_service() is get_tenant_logo_storage_service()
    assert isinstance(get_tenant_logo_storage_service(), TenantLogoStorageService)


def test_get_tenant_mobile_config_service_returns_singleton() -> None:
    assert get_tenant_mobile_config_service() is get_tenant_mobile_config_service()
    assert isinstance(get_tenant_mobile_config_service(), TenantMobileConfigService)


def test_get_tenant_mobile_favicon_storage_service_returns_singleton() -> None:
    a = get_tenant_mobile_favicon_storage_service()
    b = get_tenant_mobile_favicon_storage_service()
    assert a is b
    assert isinstance(a, TenantMobileFaviconStorageService)


def test_get_tenant_menu_image_storage_service_returns_singleton() -> None:
    a = get_tenant_menu_image_storage_service()
    assert a is get_tenant_menu_image_storage_service()
    assert isinstance(a, TenantMenuImageStorageService)


def test_get_order_service_returns_instance() -> None:
    o = get_order_service()
    assert isinstance(o, OrderService)
    assert o is not get_order_service()


def test_get_table_session_service_returns_singleton() -> None:
    assert get_table_session_service() is get_table_session_service()
    assert isinstance(get_table_session_service(), TableSessionService)


def test_get_external_client_returns_instance() -> None:
    a = get_external_client()
    assert isinstance(a, ExternalClient)
    assert a is not get_external_client()


def test_get_tenant_profile_service_returns_instance() -> None:
    a = get_tenant_profile_service()
    assert isinstance(a, TenantProfileService)
    assert a is not get_tenant_profile_service()


def test_get_p24_and_floor_services() -> None:
    p = get_p24_service()
    assert isinstance(p, P24Service)
    f = get_floor_canvas_service()
    assert isinstance(f, FloorCanvasService)
