from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from core.exceptions import ExternalAPIError, ServiceUnavailableError
from services.external_client_service import ExternalClient

HTTP_BAD_GATEWAY = 502
HTTP_SERVICE_UNAVAILABLE = 503


@pytest.mark.asyncio
async def test_external_post_json_success_returns_json() -> None:
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = {"token": "abc123", "status": "ok"}

    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_request = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value.__aenter__.return_value.request = mock_request
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        result = await ExternalClient().external_post_json(
            "https://api.example.com/register",
            json={"key": "value"},
            headers={"Authorization": "Bearer x"},
            timeout=10.0,
            service_name="Example API",
        )

        assert result == {"token": "abc123", "status": "ok"}
        mock_request.assert_called_once_with(
            "POST",
            "https://api.example.com/register",
            json={"key": "value"},
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer x",
            },
            timeout=10.0,
        )


@pytest.mark.asyncio
async def test_external_post_json_http_status_error_raises_external_api_error() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.json.return_value = {"error": {"message": "Invalid request"}}
    mock_response.text = "Bad Request"

    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_request = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "Bad Request",
                request=MagicMock(),
                response=mock_response,
            ),
        )
        mock_client_cls.return_value.__aenter__.return_value.request = mock_request
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(ExternalAPIError) as exc_info:
            await ExternalClient().external_post_json(
                "https://api.example.com/endpoint",
                json={},
                service_name="Example API",
            )

        assert exc_info.value.status_code == HTTP_BAD_GATEWAY
        assert "Example API error" in exc_info.value.detail
        assert "Invalid request" in exc_info.value.detail


@pytest.mark.asyncio
async def test_external_post_json_request_error_raises_service_unavailable() -> None:
    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_request = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))
        mock_client_cls.return_value.__aenter__.return_value.request = mock_request
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(ServiceUnavailableError) as exc_info:
            await ExternalClient().external_post_json(
                "https://api.example.com/endpoint",
                json={},
                service_name="Example API",
            )

        assert exc_info.value.status_code == HTTP_SERVICE_UNAVAILABLE
        assert "Failed to connect to Example API" in exc_info.value.detail
        assert "Connection refused" in exc_info.value.detail


@pytest.mark.asyncio
async def test_external_post_json_extract_error_from_body_errors_key() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 422
    mock_response.json.return_value = {"errors": "Validation failed"}
    mock_response.text = "Unprocessable Entity"

    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_request = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "Unprocessable",
                request=MagicMock(),
                response=mock_response,
            ),
        )
        mock_client_cls.return_value.__aenter__.return_value.request = mock_request
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(ExternalAPIError) as exc_info:
            await ExternalClient().external_post_json("https://api.example.com", json={})

        assert "Validation failed" in exc_info.value.detail


@pytest.mark.asyncio
async def test_external_post_json_extract_error_fallback_to_response_text() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.json.side_effect = ValueError("not json")
    mock_response.text = "Internal Server Error"

    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_request = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "Server Error",
                request=MagicMock(),
                response=mock_response,
            ),
        )
        mock_client_cls.return_value.__aenter__.return_value.request = mock_request
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(ExternalAPIError) as exc_info:
            await ExternalClient().external_post_json("https://api.example.com", json={})

        assert exc_info.value.status_code == HTTP_BAD_GATEWAY
        assert "Internal Server Error" in exc_info.value.detail


@pytest.mark.asyncio
async def test_external_post_json_extract_error_fallback_inside_try_block() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 418
    # JSON is valid but not dict → triggers fallback inside try block
    mock_response.json.return_value = ["unexpected", "format"]
    mock_response.text = "I'm a teapot"

    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_request = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "Teapot Error",
                request=MagicMock(),
                response=mock_response,
            ),
        )
        mock_client_cls.return_value.__aenter__.return_value.request = mock_request
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(ExternalAPIError) as exc_info:
            await ExternalClient().external_post_json(
                "https://api.example.com/endpoint",
                json={},
                service_name="Example API",
            )

        assert exc_info.value.status_code == HTTP_BAD_GATEWAY
        assert "I'm a teapot" in exc_info.value.detail


@pytest.mark.asyncio
async def test_external_get_success() -> None:
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.text = "plain"

    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_get = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value.__aenter__.return_value.get = mock_get
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        out = await ExternalClient().external_get("https://api.example.com/x")
        assert out == "plain"
        mock_get.assert_awaited_once()


@pytest.mark.asyncio
async def test_external_get_http_error_raises() -> None:
    mock_response = MagicMock()
    mock_response.json.return_value = {"error": "bad"}
    mock_response.text = "err"
    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_get = AsyncMock(
            side_effect=httpx.HTTPStatusError("x", request=MagicMock(), response=mock_response)
        )
        mock_client_cls.return_value.__aenter__.return_value.get = mock_get
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)
        with pytest.raises(ExternalAPIError):
            await ExternalClient().external_get("https://api.example.com/x", service_name="S")


@pytest.mark.asyncio
async def test_external_get_json_not_dict() -> None:
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = [1, 2]
    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_get = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value.__aenter__.return_value.get = mock_get
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)
        with pytest.raises(ExternalAPIError, match="invalid response"):
            await ExternalClient().external_get_json("https://api.example.com/x")


@pytest.mark.asyncio
async def test_post_json_uses_reusable_client() -> None:
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = {"ok": True}
    c = ExternalClient()
    c._client.post = AsyncMock(return_value=mock_response)
    out = await c.post_json("https://api.example.com/p", json={"a": 1})
    assert out == {"ok": True}


@pytest.mark.asyncio
async def test_external_put_json_empty_response() -> None:
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.text = "   \n"
    mock_response.json.side_effect = RuntimeError("no json on empty")
    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_request = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value.__aenter__.return_value.request = mock_request
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)
        out = await ExternalClient().external_put_json("https://api.example.com/u", json={})
    assert out == {}


@pytest.mark.asyncio
async def test_external_post_json_not_dict() -> None:
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = "list"
    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_request = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value.__aenter__.return_value.request = mock_request
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)
        with pytest.raises(ExternalAPIError, match="invalid response"):
            await ExternalClient().external_post_json("https://api.example.com/p", json={})
