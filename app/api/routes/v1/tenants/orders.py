from decimal import Decimal
from uuid import NAMESPACE_URL, UUID, uuid5

from fastapi import APIRouter, HTTPException, Request, status
from sqlalchemy import select

from core.dto.v1.orders import (
    CreateOrderDTO,
    OrderItemResponseDTO,
    OrderResponseDTO,
    UpdateOrderDTO,
)
from core.foundation.dependencies import AuthorizedTenantId, PostgresSession
from core.foundation.http.responses import (
    CreatedResponse,
    SuccessResponse,
    UnauthenticatedResponse,
    UpdatedResponse,
)
from core.models.enums import OrderStatus
from core.models.order import Order
from core.models.order_details import OrderDetails
from core.models.user import User

router = APIRouter()


def _table_ref_to_uuid(tenant_public_id: str, value: str) -> UUID:
    try:
        return UUID(value)
    except ValueError:
        return uuid5(NAMESPACE_URL, f"{tenant_public_id}:{value}")


def _build_order_response(
    order: Order,
    details: OrderDetails | None,
    waiters_by_id: dict[UUID, User],
) -> OrderResponseDTO:
    waiter = waiters_by_id.get(order.waiter_user_id) if order.waiter_user_id else None
    item_snapshots = details.items_snapshot if details is not None else []

    return OrderResponseDTO(
        id=order.id,
        tenant_id=order.tenant_id,
        table_id=order.table_id,
        table_ref=order.table_ref,
        waiter_name=waiter.name if waiter else None,
        waiter_surname=waiter.surname if waiter else None,
        status=order.status,
        total_amount=order.total_amount,
        currency=order.currency,
        notes=details.notes if details is not None else None,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=[OrderItemResponseDTO(**item) for item in item_snapshots],
    )


@router.get(
    "/{tenant_public_id}/orders",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[OrderResponseDTO]],
    summary="List tenant orders",
)
async def list_tenant_orders(
    tenant_public_id: str,
    _tenant_id: AuthorizedTenantId,
    session: PostgresSession,
) -> SuccessResponse[list[OrderResponseDTO]]:
    del tenant_public_id

    orders_result = await session.execute(
        select(Order).where(Order.tenant_id == _tenant_id).order_by(Order.created_at.desc())
    )
    orders = list(orders_result.scalars().all())

    order_ids = [order.id for order in orders]
    details_by_order: dict[UUID, OrderDetails] = {}

    if order_ids:
        details_result = await session.execute(
            select(OrderDetails).where(OrderDetails.order_id.in_(order_ids))
        )
        details_by_order = {details.order_id: details for details in details_result.scalars().all()}
    waiter_ids = {order.waiter_user_id for order in orders if order.waiter_user_id is not None}
    waiters_by_id: dict[UUID, User] = {}
    if waiter_ids:
        waiters_result = await session.execute(select(User).where(User.id.in_(waiter_ids)))
        waiters_by_id = {waiter.id: waiter for waiter in waiters_result.scalars().all()}

    return SuccessResponse(
        message="Orders retrieved successfully",
        data=[
            _build_order_response(order, details_by_order.get(order.id), waiters_by_id)
            for order in orders
        ],
    )


@router.post(
    "/{tenant_public_id}/orders",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[OrderResponseDTO],
    summary="Create tenant order",
)
async def create_tenant_order(
    tenant_public_id: str,
    tenant_id: AuthorizedTenantId,
    request_context: Request,
    request: CreateOrderDTO,
    session: PostgresSession,
) -> CreatedResponse[OrderResponseDTO]:
    request_user = getattr(request_context.state, "user", None)
    if not isinstance(request_user, dict):
        raise UnauthenticatedResponse(message="Unauthorized")
    subject = request_user.get("sub")
    if not isinstance(subject, str):
        raise UnauthenticatedResponse(message="Unauthorized")

    try:
        waiter_user_id = UUID(subject)
    except ValueError as exc:
        raise UnauthenticatedResponse(message="Unauthorized") from exc

    total_amount = sum(Decimal(item.unit_price) * item.quantity for item in request.items)
    order = Order(
        tenant_id=tenant_id,
        table_id=_table_ref_to_uuid(tenant_public_id, request.table_id)
        if request.table_id
        else None,
        table_ref=request.table_id,
        waiter_user_id=waiter_user_id,
        status=OrderStatus.NEW.value,
        total_amount=total_amount,
        currency="PLN",
    )
    session.add(order)
    await session.flush()

    details = OrderDetails(
        order_id=order.id,
        notes=request.notes,
        items_snapshot=[
            item.model_dump(by_alias=True, exclude_none=True) for item in request.items
        ],
    )
    session.add(details)

    await session.commit()
    await session.refresh(order)
    waiter = await session.get(User, waiter_user_id)
    await session.refresh(details)

    return CreatedResponse(
        message="Order created successfully",
        data=_build_order_response(order, details, {waiter.id: waiter} if waiter else {}),
    )


@router.put(
    "/{tenant_public_id}/orders/{order_id}",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[OrderResponseDTO],
    summary="Update tenant order",
)
async def update_tenant_order(
    tenant_public_id: str,
    tenant_id: AuthorizedTenantId,
    order_id: UUID,
    request: UpdateOrderDTO,
    session: PostgresSession,
) -> UpdatedResponse[OrderResponseDTO]:
    del tenant_public_id

    order_result = await session.execute(
        select(Order).where(Order.id == order_id, Order.tenant_id == tenant_id)
    )
    order = order_result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if request.status is not None:
        order.status = request.status
    if request.currency is not None:
        order.currency = request.currency
    details = await session.get(OrderDetails, order.id)
    if details is None:
        details = OrderDetails(order_id=order.id, items_snapshot=[])
        session.add(details)
        await session.flush()

    if request.notes is not None:
        details.notes = request.notes
    elif "notes" in request.model_fields_set:
        details.notes = None

    if request.items is not None:
        details.items_snapshot = [
            item.model_dump(by_alias=True, exclude_none=True) for item in request.items
        ]
        order.total_amount = sum(Decimal(item.unit_price) * item.quantity for item in request.items)

    if request.total is not None:
        order.total_amount = request.total

    await session.commit()
    await session.refresh(order)
    waiter_map: dict[UUID, User] = {}
    if order.waiter_user_id is not None:
        waiter = await session.get(User, order.waiter_user_id)
        if waiter is not None:
            waiter_map[waiter.id] = waiter

    await session.refresh(details)

    return UpdatedResponse(
        message="Order updated successfully",
        data=_build_order_response(order, details, waiter_map),
    )
