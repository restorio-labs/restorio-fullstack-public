from unittest.mock import AsyncMock, MagicMock

import pytest

from services.ws_manager import ConnectionManager


@pytest.mark.asyncio
async def test_connect_accept_and_track() -> None:
    mgr = ConnectionManager()
    ws = AsyncMock()
    await mgr.connect("rest-1", ws)

    ws.accept.assert_awaited_once()
    assert mgr._connections["rest-1"] == [ws]


def test_disconnect_removes_empty_restaurant_key() -> None:
    mgr = ConnectionManager()
    ws = MagicMock()
    mgr._connections["rest-1"] = [ws]

    mgr.disconnect("rest-1", ws)

    assert "rest-1" not in mgr._connections


@pytest.mark.asyncio
async def test_broadcast_removes_stale_websockets() -> None:
    mgr = ConnectionManager()
    good = AsyncMock()
    bad = AsyncMock()
    bad.send_text.side_effect = RuntimeError("closed")

    mgr._connections["rest-1"] = [good, bad]

    await mgr.broadcast("rest-1", {"event": "ping"})

    good.send_text.assert_awaited()
    assert bad not in mgr._connections.get("rest-1", [])
