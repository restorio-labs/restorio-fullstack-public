from typing import Any

from fastapi import APIRouter, Form, status
from sqlalchemy import select

from core.exceptions import BadRequestError, NotFoundResponse
from core.foundation.dependencies import (
    ExternalClientDep,
    MongoDB,
    P24ServiceDep,
    PostgresSession,
    TableSessionServiceDep,
    TenantServiceDep,
)
from core.foundation.http.responses import SuccessResponse
from core.models.transaction import Transaction
from services.mobile_payment_sync import apply_mobile_payment_mongo_and_session_effects

router = APIRouter()

_RESOURCE_TRANSACTION = "Transaction"


@router.post(
    "/status",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict[str, Any]],
)
async def p24_status_webhook(
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    p24_service: P24ServiceDep,
    external_client: ExternalClientDep,
    table_session_service: TableSessionServiceDep,
    db: MongoDB,
    merchantId: int = Form(...),  # noqa: N803, ARG001
    posId: int = Form(...),  # noqa: N803, ARG001
    sessionId: str = Form(...),  # noqa: N803
    amount: int = Form(...),
    originAmount: int = Form(...),  # noqa: N803, ARG001
    currency: str = Form(...),  # noqa: ARG001
    orderId: int = Form(...),  # noqa: N803, ARG001
    methodId: int = Form(...),  # noqa: N803, ARG001
    statement: str = Form(...),  # noqa: ARG001
    sign: str = Form(...),  # noqa: ARG001
) -> SuccessResponse[dict[str, Any]]:
    result = await session.execute(
        select(Transaction).where(Transaction.session_id == sessionId)
    )
    transaction = result.scalar_one_or_none()
    if transaction is None:
        raise NotFoundResponse(_RESOURCE_TRANSACTION, sessionId)

    if transaction.amount != amount:
        raise BadRequestError(message="Transaction amount mismatch")

    tenant = await tenant_service.get_tenant(session, transaction.tenant_id)

    await p24_service.apply_p24_lookup_to_transaction(
        external_client,
        transaction=transaction,
        tenant=tenant,
    )

    await apply_mobile_payment_mongo_and_session_effects(
        db,
        session,
        table_session_service,
        tenant=tenant,
        transaction=transaction,
        session_id_str=sessionId,
    )

    await session.commit()

    return SuccessResponse(
        message="Payment status received",
        data={"sessionId": sessionId, "status": transaction.status},
    )
