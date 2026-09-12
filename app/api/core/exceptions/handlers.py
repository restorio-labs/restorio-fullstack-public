import logging
import traceback

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from core.exceptions import BaseHTTPException
from core.foundation.http.responses import ExceptionHandlerResponse, ValidationErrorResponse
from core.foundation.infra.config import Settings

logger = logging.getLogger(__name__)


def _get_request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def setup_exception_handlers(app: FastAPI, settings: Settings) -> None:
    @app.exception_handler(BaseHTTPException)
    async def restorio_exception_handler(
        request: Request,
        exc: BaseHTTPException,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=ExceptionHandlerResponse(
                message=str(exc.detail),
                details=exc.details,
                request_id=_get_request_id(request),
            ).model_dump(exclude_none=True),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        fields: list[str] = []
        seen: set[str] = set()
        for error in exc.errors():
            loc = error.get("loc", [])
            field = ".".join(str(part) for part in loc if part not in {"body"}) or "body"
            if field not in seen:
                seen.add(field)
                fields.append(field)

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content=ValidationErrorResponse(
                fields=fields,
                request_id=_get_request_id(request),
            ).model_dump(exclude_none=True),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        rid = _get_request_id(request)
        logger.error(
            "Unhandled exception [request_id=%s]: %s\n%s", rid, exc, traceback.format_exc()
        )
        if settings.DEBUG:
            return JSONResponse(
                status_code=getattr(exc, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR),
                content=ExceptionHandlerResponse(
                    message="An unexpected error occurred",
                    details={"type": type(exc).__name__},
                    request_id=rid,
                ).model_dump(exclude_none=True),
            )

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ExceptionHandlerResponse(
                message="Internal server error",
                request_id=rid,
            ).model_dump(exclude_none=True),
        )
