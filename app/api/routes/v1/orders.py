from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Request, status
from sqlalchemy import func, select

from core.dto.v1.orders import (
    ArchivedOrderResponseDTO,
    CreateOrderDTO,
    KitchenOrderResponseDTO,
    TableSessionResponseDTO,
    UpdateOrderDTO,
    UpdateOrderStatusDTO,
)
from core.exceptions import BadRequestError
from core.foundation.dependencies import (
    AuthorizedTenantId,
    MongoDB,
    OrderServiceDep,
    PostgresSession,
    TableSessionServiceDep,
    TenantServiceDep,
)
from core.foundation.http.responses import (
    CreatedResponse,
    DeletedResponse,
    PaginatedResponse,
    SuccessResponse,
    UpdatedResponse,
)
from core.foundation.role_guard import RequireAnyStaff
from core.models.archived_order import ArchivedOrder
from core.models.enums import TableSessionStatus
from services.archive_service import ArchiveService
from services.refund_service import RefundService
from services.ws_manager import ws_manager

_archive_service = ArchiveService()
_refund_service = RefundService()

router = APIRouter()


@router.get(
    "/{tenant_public_id}/orders",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[KitchenOrderResponseDTO]],
)
async def list_orders(
    tenant_public_id: str,
    request: Request,
    db: MongoDB,
    service: OrderServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
    order_status: Annotated[str | None, Query(alias="status")] = None,
) -> SuccessResponse[list[KitchenOrderResponseDTO]]:
    orders = await service.list_orders(
        db,
        tenant_public_id,
        status=order_status,
        timezone_name=request.headers.get("X-Timezone"),
    )
    return SuccessResponse(
        message="Orders retrieved successfully",
        data=[KitchenOrderResponseDTO(**o) for o in orders],
    )


@router.get(
    "/{tenant_public_id}/orders/archived",
    status_code=status.HTTP_200_OK,
    response_model=PaginatedResponse[ArchivedOrderResponseDTO],
)
async def list_archived_orders(
    tenant_public_id: str,
    session: PostgresSession,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    since_hours: Annotated[int | None, Query(alias="sinceHours", ge=1)] = None,
) -> PaginatedResponse[ArchivedOrderResponseDTO]:
    filters = [ArchivedOrder.restaurant_id == tenant_public_id]
    if since_hours is not None:
        cutoff = datetime.now(UTC) - timedelta(hours=since_hours)
        filters.append(ArchivedOrder.archived_at >= cutoff)

    total_result = await session.execute(
        select(func.count()).select_from(ArchivedOrder).where(*filters)
    )
    total = int(total_result.scalar_one())
    offset = (page - 1) * page_size

    archived_result = await session.execute(
        select(ArchivedOrder)
        .where(*filters)
        .order_by(ArchivedOrder.archived_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    archived_orders = list(archived_result.scalars().all())

    return PaginatedResponse.create(
        items=[
            ArchivedOrderResponseDTO(
                id=archived.id,
                originalOrderId=archived.original_order_id,
                tenantId=archived.tenant_id,
                restaurantId=archived.restaurant_id,
                tableId=archived.table_id,
                tableLabel=archived.table_label,
                status=archived.status,
                paymentStatus=archived.payment_status,
                total=archived.total,
                currency=archived.currency,
                notes=archived.notes,
                createdAt=archived.order_created_at,
                archivedAt=archived.archived_at,
            )
            for archived in archived_orders
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{tenant_public_id}/orders/{order_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[KitchenOrderResponseDTO],
)
async def get_order(
    tenant_public_id: str,
    order_id: str,
    request: Request,
    db: MongoDB,
    service: OrderServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> SuccessResponse[KitchenOrderResponseDTO]:
    order = await service.get_order(
        db,
        tenant_public_id,
        order_id,
        timezone_name=request.headers.get("X-Timezone"),
    )
    return SuccessResponse(
        message="Order retrieved successfully",
        data=KitchenOrderResponseDTO(**order),
    )


@router.post(
    "/{tenant_public_id}/orders",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[KitchenOrderResponseDTO],
)
async def create_order(
    tenant_public_id: str,
    payload: CreateOrderDTO,
    request: Request,
    db: MongoDB,
    service: OrderServiceDep,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    table_session_service: TableSessionServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> CreatedResponse[KitchenOrderResponseDTO]:
    data = payload.model_dump(by_alias=True)
    tenant = await tenant_service.get_tenant_by_public_id(session, tenant_public_id)
    request_user = getattr(request.state, "user", None)
    subject = request_user.get("sub") if isinstance(request_user, dict) else None
    waiter_user_id: UUID | None = None
    if isinstance(subject, str):
        try:
            waiter_user_id = UUID(subject)
        except ValueError:
            waiter_user_id = None
    if payload.table_id:
        await table_session_service.acquire_waiter_session(
            session,
            tenant=tenant,
            table_ref=payload.table_id,
            table_label=payload.table,
            waiter_user_id=waiter_user_id,
        )
    order = await service.create_order(
        db,
        tenant_public_id,
        data,
        timezone_name=request.headers.get("X-Timezone"),
    )
    await ws_manager.broadcast(tenant_public_id, {"type": "order_created", "order": order})
    return CreatedResponse(
        message="Order created successfully",
        data=KitchenOrderResponseDTO(**order),
    )


@router.put(
    "/{tenant_public_id}/orders/{order_id}",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[KitchenOrderResponseDTO],
)
async def update_order(
    tenant_public_id: str,
    order_id: str,
    payload: UpdateOrderDTO,
    request: Request,
    db: MongoDB,
    service: OrderServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> UpdatedResponse[KitchenOrderResponseDTO]:
    data = payload.model_dump(by_alias=True, exclude_none=True)
    order = await service.update_order(
        db,
        tenant_public_id,
        order_id,
        data,
        timezone_name=request.headers.get("X-Timezone"),
    )
    await ws_manager.broadcast(tenant_public_id, {"type": "order_updated", "order": order})
    return UpdatedResponse(
        message="Order updated successfully",
        data=KitchenOrderResponseDTO(**order),
    )


@router.patch(
    "/{tenant_public_id}/orders/{order_id}/status",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[KitchenOrderResponseDTO],
)
async def update_order_status(
    tenant_public_id: str,
    order_id: str,
    payload: UpdateOrderStatusDTO,
    request: Request,
    db: MongoDB,
    service: OrderServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> UpdatedResponse[KitchenOrderResponseDTO]:
    order = await service.update_status(
        db,
        tenant_public_id,
        order_id,
        payload.status,
        rejection_reason=payload.rejection_reason,
        timezone_name=request.headers.get("X-Timezone"),
    )
    await ws_manager.broadcast(tenant_public_id, {"type": "order_updated", "order": order})
    return UpdatedResponse(
        message="Order status updated successfully",
        data=KitchenOrderResponseDTO(**order),
    )


@router.delete(
    "/{tenant_public_id}/orders/{order_id}",
    status_code=status.HTTP_200_OK,
    response_model=DeletedResponse,
)
async def delete_order(
    tenant_public_id: str,
    order_id: str,
    request: Request,
    db: MongoDB,
    service: OrderServiceDep,
    session: PostgresSession,
    table_session_service: TableSessionServiceDep,
    tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> DeletedResponse:
    order = await service.delete_order(
        db,
        tenant_public_id,
        order_id,
        timezone_name=request.headers.get("X-Timezone"),
    )
    await table_session_service.release_by_table_ref(
        session,
        tenant_id=tenant_id,
        table_ref=order.get("tableId"),
        final_status=TableSessionStatus.RELEASED,
    )
    return DeletedResponse(message=f"Order {order_id} deleted successfully")


@router.post(
    "/{tenant_public_id}/orders/{order_id}/archive",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict],
)
async def archive_order(
    tenant_public_id: str,
    order_id: str,
    db: MongoDB,
    session: PostgresSession,
    service: OrderServiceDep,
    table_session_service: TableSessionServiceDep,
    tenant_service: TenantServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> SuccessResponse[dict]:
    order_doc = await service.get_order_for_archive(db, tenant_public_id, order_id)
    tenant_id = order_doc.get("restaurantId", tenant_public_id)
    tenant = await tenant_service.get_tenant(session, _tenant_id)
    archived = await _archive_service.archive_order(
        db, session, tenant_id, tenant_public_id, order_doc, pg_tenant=tenant
    )
    await table_session_service.release_by_table_ref(
        session,
        tenant_id=_tenant_id,
        table_ref=order_doc.get("tableId"),
    )
    await ws_manager.broadcast(
        tenant_public_id,
        {"type": "order_archived", "order": {"id": order_id}},
    )
    return SuccessResponse(
        message="Order archived successfully",
        data={"id": str(archived.id), "originalOrderId": order_id},
    )


@router.post(
    "/{tenant_public_id}/orders/{order_id}/refund",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict],
)
async def refund_order(
    tenant_public_id: str,
    order_id: str,
    db: MongoDB,
    service: OrderServiceDep,
    session: PostgresSession,
    table_session_service: TableSessionServiceDep,
    tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> SuccessResponse[dict]:
    order = await service.get_order(db, tenant_public_id, order_id)
    if order["status"] != "rejected":
        msg = "Only rejected orders can be refunded"
        raise BadRequestError(msg)

    refund_result = await _refund_service.process_refund(
        order_id,
        float(order.get("total", 0)),
        order.get("rejectionReason", ""),
    )

    updated = await service.update_status(db, tenant_public_id, order_id, "refunded")
    await table_session_service.release_by_table_ref(
        session,
        tenant_id=tenant_id,
        table_ref=order.get("tableId"),
    )
    await ws_manager.broadcast(tenant_public_id, {"type": "order_updated", "order": updated})

    return SuccessResponse(
        message="Refund initiated successfully",
        data={**refund_result, "order": updated},
    )


@router.get(
    "/{tenant_public_id}/table-sessions",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[TableSessionResponseDTO]],
)
async def list_table_sessions(
    tenant_public_id: str,  # noqa: ARG001
    session: PostgresSession,
    table_session_service: TableSessionServiceDep,
    tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> SuccessResponse[list[TableSessionResponseDTO]]:
    sessions = await table_session_service.list_active_sessions(session, tenant_id)
    return SuccessResponse(
        message="Table sessions retrieved successfully",
        data=[
            TableSessionResponseDTO(
                id=table_session.id,
                tableRef=table_session.table_ref,
                tableNumber=table_session.table_number,
                tableLabel=table_session.table_label,
                origin=table_session.origin.value,
                status=table_session.status.value,
                sessionId=table_session.session_id,
                waiterUserId=table_session.waiter_user_id,
                acquiredAt=table_session.acquired_at,
                lastSeenAt=table_session.last_seen_at,
                expiresAt=table_session.expires_at,
            )
            for table_session in sessions
        ],
    )


@router.post(
    "/{tenant_public_id}/table-sessions/{table_ref}/unlock",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict],
)
async def unlock_table_session(
    tenant_public_id: str,
    table_ref: str,
    request: Request,
    session: PostgresSession,
    table_session_service: TableSessionServiceDep,
    tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> SuccessResponse[dict]:
    request_user = getattr(request.state, "user", None)
    subject = request_user.get("sub") if isinstance(request_user, dict) else None
    actor_user_id: UUID | None = None
    if isinstance(subject, str):
        try:
            actor_user_id = UUID(subject)
        except ValueError:
            actor_user_id = None

    released = await table_session_service.release_waiter_table(
        session,
        tenant_id=tenant_id,
        table_ref=table_ref,
        actor_user_id=actor_user_id,
        reason="manual_waiter_unlock",
    )
    await ws_manager.broadcast(
        tenant_public_id,
        {"type": "table_session_unlocked", "tableRef": table_ref},
    )
    return SuccessResponse(
        message="Table session unlocked successfully",
        data={"released": released is not None, "tableRef": table_ref},
    )
