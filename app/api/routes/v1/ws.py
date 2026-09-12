import logging
from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select

from core.foundation.database.database import AsyncSessionLocal
from core.foundation.security import security_service
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from services.ws_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter()


async def _authenticate_websocket(websocket: WebSocket) -> dict | None:
    """Extract and validate access token from websocket connection.

    Checks query param 'token' first, then falls back to cookie.
    Returns decoded token payload or None if authentication fails.
    """
    token: str | None = websocket.query_params.get("token")
    if not token:
        token = websocket.cookies.get("rat")

    if not token:
        return None

    try:
        return security_service.decode_access_token(token)
    except Exception:
        return None


async def _authorize_tenant_access(user: dict, tenant_public_id: str) -> bool:
    """Verify the authenticated user has access to the specified tenant.

    Checks JWT claims first, then falls back to database lookup.
    """
    tenant_ids_claim = user.get("tenant_ids")
    if isinstance(tenant_ids_claim, list) and tenant_public_id in tenant_ids_claim:
        return True

    tenant_id_claim = user.get("tenant_id")
    if isinstance(tenant_id_claim, str) and tenant_id_claim == tenant_public_id:
        return True

    subject = user.get("sub")
    if not isinstance(subject, str):
        return False

    try:
        account_id = UUID(subject)
    except ValueError:
        return False

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Tenant.id)
            .join(TenantRole, TenantRole.tenant_id == Tenant.id)
            .where(
                Tenant.public_id == tenant_public_id,
                TenantRole.account_id == account_id,
            )
        )
        return result.scalar_one_or_none() is not None


@router.websocket("/ws/kitchen/{restaurant_id}")
async def kitchen_websocket(websocket: WebSocket, restaurant_id: str) -> None:
    user = await _authenticate_websocket(websocket)
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    has_access = await _authorize_tenant_access(user, restaurant_id)
    if not has_access:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws_manager.connect(restaurant_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(restaurant_id, websocket)
    except Exception:
        ws_manager.disconnect(restaurant_id, websocket)
