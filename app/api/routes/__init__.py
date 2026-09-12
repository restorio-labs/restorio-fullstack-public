from fastapi import APIRouter

from routes.v1.auth import router as auth_router
from routes.v1.health import router as health_router
from routes.v1.kitchen_config import router as kitchen_config_router
from routes.v1.orders import router as orders_restaurant_router
from routes.v1.payments import router as payments_router
from routes.v1.public import router as public_router
from routes.v1.tenants import (
    canvases_router,
    menu_router,
    mobile_config_router,
    orders_router,
    profile_router,
    tenants_router,
)
from routes.v1.users import router as users_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["health"])
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])

api_router.include_router(tenants_router, prefix="/tenants", tags=["tenants"])
api_router.include_router(canvases_router, prefix="/tenants", tags=["canvases"])
api_router.include_router(profile_router, prefix="/tenants", tags=["profile"])
api_router.include_router(menu_router, prefix="/tenants", tags=["menu"])
api_router.include_router(mobile_config_router, prefix="/tenants", tags=["mobile-config"])
api_router.include_router(orders_router, prefix="/tenants", tags=["orders"])

api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(orders_restaurant_router, prefix="/restaurants", tags=["orders"])
api_router.include_router(kitchen_config_router, prefix="/restaurants", tags=["kitchen-config"])
api_router.include_router(orders_router, prefix="/orders", tags=["orders"])
api_router.include_router(payments_router, prefix="/payments", tags=["payments"])

api_router.include_router(public_router, prefix="/public", tags=["public"])
