from routes.v1.tenants.canvases import router as canvases_router
from routes.v1.tenants.menu import router as menu_router
from routes.v1.tenants.mobile_config import router as mobile_config_router
from routes.v1.tenants.orders import router as orders_router
from routes.v1.tenants.profile import router as profile_router
from routes.v1.tenants.tenants import router as tenants_router

__all__ = [
    "canvases_router",
    "menu_router",
    "mobile_config_router",
    "orders_router",
    "profile_router",
    "tenants_router",
]
