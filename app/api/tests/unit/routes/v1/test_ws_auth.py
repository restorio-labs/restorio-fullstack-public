from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from starlette import status
from starlette.websockets import WebSocket, WebSocketDisconnect

import routes.v1.ws as ws_mod


def _connect_scope(query_string: bytes = b"", extra_headers: list | None = None) -> dict:
    headers = list(extra_headers or [])
    return {
        "type": "websocket",
        "path": "/v1/ws/kitchen/tenant",
        "query_string": query_string,
        "headers": headers,
        "subprotocols": [],
    }


def _make_ws(scope: dict) -> WebSocket:
    async def _recv() -> dict:
        return {"type": "websocket.connect"}

    return WebSocket(scope, receive=_recv, send=AsyncMock())


@pytest.mark.asyncio
async def test_authenticate_from_query() -> None:
    w = _make_ws(_connect_scope(b"token=tok1"))
    with patch.object(
        ws_mod.security_service, "decode_access_token", return_value={"sub": "u"}
    ) as dec:
        out = await ws_mod._authenticate_websocket(w)
    assert out == {"sub": "u"}
    dec.assert_called_once_with("tok1")


@pytest.mark.asyncio
async def test_authenticate_from_cookie() -> None:
    w = _make_ws(
        _connect_scope(
            b"",
            [
                (b"cookie", b"rat=fromcookie"),
            ],
        )
    )
    with patch.object(ws_mod.security_service, "decode_access_token", return_value={"a": 1}):
        out = await ws_mod._authenticate_websocket(w)
    assert out == {"a": 1}


@pytest.mark.asyncio
async def test_authenticate_no_token() -> None:
    w = _make_ws(_connect_scope(b""))
    out = await ws_mod._authenticate_websocket(w)
    assert out is None


@pytest.mark.asyncio
async def test_authenticate_decode_failure() -> None:
    w = _make_ws(_connect_scope(b"token=bad"))
    with patch.object(ws_mod.security_service, "decode_access_token", side_effect=ValueError):
        out = await ws_mod._authenticate_websocket(w)
    assert out is None


@pytest.mark.asyncio
async def test_authorize_tenant_by_list_claim() -> None:
    u = {"tenant_ids": ["tp1", "tp2"]}
    assert await ws_mod._authorize_tenant_access(u, "tp1") is True
    assert await ws_mod._authorize_tenant_access(u, "other") is False


@pytest.mark.asyncio
async def test_authorize_tenant_by_single_id_claim() -> None:
    u = {"tenant_id": "tp1"}
    assert await ws_mod._authorize_tenant_access(u, "tp1") is True
    assert await ws_mod._authorize_tenant_access(u, "tp2") is False


@pytest.mark.asyncio
async def test_authorize_tenant_by_db_match() -> None:
    u = {"sub": str(uuid4())}
    fake_result = MagicMock()
    fake_result.scalar_one_or_none = MagicMock(return_value=1)

    class _Sess:
        async def execute(self, _q: object) -> object:
            return fake_result

        async def __aenter__(self) -> _Sess:
            return self

        async def __aexit__(self, *a: object) -> bool:
            return False

    with patch.object(ws_mod, "AsyncSessionLocal", return_value=_Sess()):
        ok = await ws_mod._authorize_tenant_access(u, "pub-tenant-1")
    assert ok is True


@pytest.mark.asyncio
async def test_authorize_tenant_sub_not_uuid() -> None:
    u = {"sub": "not-uuid", "tenant_ids": []}
    ok = await ws_mod._authorize_tenant_access(u, "t")
    assert ok is False


@pytest.mark.asyncio
async def test_kitchen_websocket_rejects_unauthenticated() -> None:
    w = _make_ws(_connect_scope(b""))
    close = AsyncMock()
    w.close = close
    await ws_mod.kitchen_websocket(w, "rid1")
    close.assert_awaited_with(code=status.WS_1008_POLICY_VIOLATION)


@pytest.mark.asyncio
async def test_kitchen_websocket_rejects_no_tenant_access() -> None:
    w = _make_ws(_connect_scope(b"token=t"))
    with (
        patch.object(
            ws_mod.security_service, "decode_access_token", return_value={"tenant_ids": ["x"]}
        ),
        patch.object(
            ws_mod, "_authorize_tenant_access", new_callable=AsyncMock, return_value=False
        ),
    ):
        close = AsyncMock()
        w.close = close
        await ws_mod.kitchen_websocket(w, "rid1")
    close.assert_awaited_with(code=status.WS_1008_POLICY_VIOLATION)


@pytest.mark.asyncio
async def test_kitchen_websocket_disconnect_calls_manager() -> None:
    w = _make_ws(_connect_scope(b"token=t"))
    w.receive_text = AsyncMock(side_effect=WebSocketDisconnect)
    mgr = MagicMock()
    mgr.connect = AsyncMock()
    mgr.disconnect = MagicMock()
    with (
        patch.object(
            ws_mod.security_service, "decode_access_token", return_value={"tenant_ids": ["rid1"]}
        ),
        patch.object(ws_mod, "_authorize_tenant_access", new_callable=AsyncMock, return_value=True),
        patch.object(ws_mod, "ws_manager", mgr),
    ):
        await ws_mod.kitchen_websocket(w, "rid1")
    mgr.connect.assert_awaited_once()
    mgr.disconnect.assert_called_once()


@pytest.mark.asyncio
async def test_kitchen_websocket_exception_disconnects() -> None:
    w = _make_ws(_connect_scope(b"token=t"))
    w.receive_text = AsyncMock(side_effect=RuntimeError("recv"))
    mgr = MagicMock()
    mgr.connect = AsyncMock()
    mgr.disconnect = MagicMock()
    with (
        patch.object(
            ws_mod.security_service, "decode_access_token", return_value={"tenant_ids": ["rid1"]}
        ),
        patch.object(ws_mod, "_authorize_tenant_access", new_callable=AsyncMock, return_value=True),
        patch.object(ws_mod, "ws_manager", mgr),
    ):
        await ws_mod.kitchen_websocket(w, "rid1")
    mgr.disconnect.assert_called_once()
