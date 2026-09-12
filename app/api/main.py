from fastapi import FastAPI
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from core.exceptions.handlers import setup_exception_handlers
from core.foundation.infra.config import settings
from core.middleware import (
    CSRFMiddleware,
    RateLimitMiddleware,
    TimingMiddleware,
    UnauthorizedMiddleware,
    setup_cors,
)
from routes import api_router as api_router_v1
from routes.v1.health import router as health_router
from routes.v1.ws import router as ws_router


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description=settings.PROJECT_DESCRIPTION,
        version=settings.VERSION,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
        openapi_url="/openapi.json" if settings.DEBUG else None,
    )

    setup_exception_handlers(app=app, settings=settings)

    if settings.TRUST_PROXY_HEADERS:
        app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

    app.add_middleware(RateLimitMiddleware)
    app.add_middleware(CSRFMiddleware)
    app.add_middleware(UnauthorizedMiddleware)
    app.add_middleware(TimingMiddleware)
    # Keep CORS as the outermost middleware so short-circuit 401 responses
    # from auth middleware still receive CORS headers.
    setup_cors(app=app, settings=settings)

    @app.get("/")
    def read_root() -> dict[str, str]:
        return {
            "message": "Welcome to Restorio API",
            "version": settings.VERSION,
            "docs": "/docs" if settings.DEBUG else "disabled",
            "api_version": "v1",
            "api_prefix": settings.API_V1_PREFIX,
        }

    app.include_router(api_router_v1, prefix=settings.API_V1_PREFIX)
    app.include_router(health_router, prefix="/health", tags=["health"])
    app.include_router(ws_router, prefix=settings.API_V1_PREFIX, tags=["websocket"])
    return app


app = create_application()
