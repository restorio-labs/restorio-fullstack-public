from collections import defaultdict
import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, restaurant_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[restaurant_id].append(websocket)
        logger.info("WS client connected for restaurant %s", restaurant_id)

    def disconnect(self, restaurant_id: str, websocket: WebSocket) -> None:
        conns = self._connections.get(restaurant_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self._connections.pop(restaurant_id, None)
        logger.info("WS client disconnected for restaurant %s", restaurant_id)

    async def broadcast(self, restaurant_id: str, event: dict[str, Any]) -> None:
        conns = self._connections.get(restaurant_id, [])
        payload = json.dumps(event, default=str)
        stale: list[WebSocket] = []
        for ws in conns:
            try:
                await ws.send_text(payload)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self.disconnect(restaurant_id, ws)


ws_manager = ConnectionManager()
