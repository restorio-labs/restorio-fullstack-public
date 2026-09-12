import json

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
import pytest

from core.exceptions import BaseHTTPException
from core.exceptions.handlers import setup_exception_handlers
from core.foundation.infra.config import Settings


@pytest.mark.asyncio
async def test_restorio_exception_handler_returns_500_and_hides_detail_when_debug_false() -> None:
    app = FastAPI()
    settings = Settings(DEBUG=False)
    setup_exception_handlers(app, settings)

    handler = app.exception_handlers[BaseHTTPException]

    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    exc = BaseHTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        message="Test error",
    )

    response = await handler(request, exc)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    body = json.loads(response.body.decode())
    assert body == {"message": "Test error"}


@pytest.mark.asyncio
async def test_restorio_exception_handler_returns_500_and_shows_detail_when_debug_true() -> None:
    app = FastAPI()
    settings = Settings(DEBUG=True)
    setup_exception_handlers(app, settings)

    handler = app.exception_handlers[BaseHTTPException]

    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    exc = BaseHTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        message="Test error",
    )

    response = await handler(request, exc)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    body = json.loads(response.body.decode())
    assert body == {"message": "Test error"}


@pytest.mark.asyncio
async def test_general_exception_handler_debug_false() -> None:
    app = FastAPI()
    settings = Settings(DEBUG=False)
    setup_exception_handlers(app, settings)

    handler = app.exception_handlers[Exception]

    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    exc = RuntimeError("failure")

    response = await handler(request, exc)

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    body = response.body.decode()
    assert "failure" not in body
    assert "RuntimeError" not in body


@pytest.mark.asyncio
async def test_general_exception_handler_debug_true() -> None:
    app = FastAPI()
    settings = Settings(DEBUG=True)
    setup_exception_handlers(app, settings)

    handler = app.exception_handlers[Exception]

    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    exc = RuntimeError("failure")

    response = await handler(request, exc)

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    body = response.body.decode()
    assert "An unexpected error occurred" in body
    assert "RuntimeError" in body


@pytest.mark.asyncio
async def test_validation_exception_handler_deduplicates_fields() -> None:
    app = FastAPI()
    settings = Settings(DEBUG=False)
    setup_exception_handlers(app, settings)

    handler = app.exception_handlers[RequestValidationError]
    request = Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/",
            "headers": [],
            "state": {"request_id": "req-123"},
        }
    )
    exc = RequestValidationError(
        [
            {"loc": ("body", "email"), "msg": "Field required", "type": "missing"},
            {"loc": ("body", "email"), "msg": "Invalid", "type": "value_error"},
            {"loc": ("query", "page"), "msg": "Invalid", "type": "value_error"},
        ]
    )

    response = await handler(request, exc)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    body = response.body.decode()
    assert '"fields":["email","query.page"]' in body
    assert '"request_id":"req-123"' in body
