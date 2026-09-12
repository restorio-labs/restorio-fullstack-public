from typing import Any

from fastapi import APIRouter, status
from sqlalchemy import select

from core.dto.v1.payments import VerifyP24TransactionDTO
from core.exceptions import NotFoundResponse
from core.foundation.dependencies import (
    AuthorizedTenantId,
    ExternalClientDep,
    P24ServiceDep,
    PostgresSession,
    TenantServiceDep,
)
from core.foundation.http.responses import SuccessResponse
from core.foundation.role_guard import RequireAnyStaff
from core.models.transaction import Transaction

router = APIRouter()

_RESOURCE_TRANSACTION = "Transaction"


@router.post(
    "/tenants/{tenant_public_id}/p24/verify-transaction",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict[str, Any]],
)
async def verify_p24_transaction(
    _staff: RequireAnyStaff,
    request: VerifyP24TransactionDTO,
    tenant_id: AuthorizedTenantId,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    p24_service: P24ServiceDep,
    external_client: ExternalClientDep,
) -> SuccessResponse[dict[str, Any]]:
    result = await session.execute(
        select(Transaction).where(
            Transaction.session_id == request.session_id,
            Transaction.tenant_id == tenant_id,
        )
    )
    transaction = result.scalar_one_or_none()
    if transaction is None:
        raise NotFoundResponse(_RESOURCE_TRANSACTION, str(request.session_id))

    tenant = await tenant_service.get_tenant(session, tenant_id)
    p24_response = await p24_service.verify_transaction_at_przelewy24(
        external_client,
        transaction=transaction,
        tenant=tenant,
    )
    await session.commit()

    return SuccessResponse(
        message="Przelewy24 transaction verification request completed",
        data=p24_response,
    )
